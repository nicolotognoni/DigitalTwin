import "dotenv/config";
import { MCPServer, text, object, error, widget } from "mcp-use/server";
import { AsyncLocalStorage } from "node:async_hooks";
import crypto from "node:crypto";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createUserClient } from "./src/services/supabase";
import { saveMemory, searchMemories, extractAllMemories } from "./src/services/memory";
import { askAgent } from "./src/services/agent-engine";
import { listAvailableAgents, createCollaborativePlan } from "./src/services/plan-engine";
import { savePlan, getPlan, listPlans } from "./src/services/plan-storage";
import { getUnreadNotifications, markAllRead, createNotification } from "./src/services/notification-service";
import { checkAvailability, hasCalendarIntegration } from "./src/services/calendar-service";

// ============================================
// Config
// ============================================
const PORT = parseInt(process.env.PORT ?? "3001", 10);
const BASE_URL = process.env.MCP_URL || `http://localhost:${PORT}`;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// ============================================
// Request Context (replaces ctx.auth)
// ============================================
interface RequestContext {
  readonly userId: string;
  readonly accessToken: string;
}

const requestContext = new AsyncLocalStorage<RequestContext>();

function getUserId(): string {
  const ctx = requestContext.getStore();
  if (!ctx) throw new Error("No auth context — user not authenticated");
  return ctx.userId;
}

function getAccessToken(): string {
  const ctx = requestContext.getStore();
  if (!ctx) throw new Error("No auth context — user not authenticated");
  return ctx.accessToken;
}

// ============================================
// Server (NO oauth provider — we handle it)
// ============================================
const server = new MCPServer({
  name: "digital-twin",
  title: "Digital Twin",
  version: "1.0.0",
  description:
    "Il tuo gemello digitale cognitivo — salva memorie e parla con i Twin dei tuoi amici",
  baseUrl: BASE_URL,
  favicon: "favicon.ico",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"],
    },
  ],
  stateless: true,
  cors: {
    origin: "*",
    exposeHeaders: ["mcp-session-id", "Mcp-Session-Id"],
  },
} as any);

// ============================================
// OAuth Discovery Endpoints
// ============================================
server.app.get("/.well-known/oauth-protected-resource", (c) =>
  c.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL],
    bearer_methods_supported: ["header"],
  })
);

server.app.get("/.well-known/oauth-protected-resource/mcp", (c) =>
  c.json({
    resource: `${BASE_URL}/mcp`,
    authorization_servers: [BASE_URL],
    bearer_methods_supported: ["header"],
  })
);

server.app.get("/.well-known/oauth-authorization-server", (c) =>
  c.json({
    issuer: BASE_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
      "none",
    ],
    scopes_supported: ["openid", "profile", "email"],
  })
);

// ============================================
// Dynamic Client Registration (RFC 7591)
// ============================================
server.app.post("/register", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const clientId = `mcp_${crypto.randomUUID()}`;

  return c.json(
    {
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
      client_name: body.client_name ?? "MCP Client",
      redirect_uris: body.redirect_uris ?? [],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: body.token_endpoint_auth_method ?? "none",
    },
    201
  );
});

// ============================================
// Pending authorizations & auth codes (in-memory)
// ============================================
const pendingAuthorizations = new Map<
  string,
  {
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    clientId: string;
    state: string;
    createdAt: number;
  }
>();

const authCodes = new Map<
  string,
  {
    supabaseAccessToken: string;
    supabaseRefreshToken: string;
    codeChallenge: string;
    redirectUri: string;
    createdAt: number;
  }
>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const TEN_MIN = 10 * 60 * 1000;
  for (const [k, v] of pendingAuthorizations) {
    if (now - v.createdAt > TEN_MIN) pendingAuthorizations.delete(k);
  }
  for (const [k, v] of authCodes) {
    if (now - v.createdAt > TEN_MIN) authCodes.delete(k);
  }
}, 5 * 60 * 1000);

// ============================================
// Authorize → Show login page
// ============================================
server.app.get("/authorize", (c) => {
  const {
    response_type,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    state,
  } = c.req.query();

  if (response_type !== "code") {
    return c.json({ error: "unsupported_response_type" }, 400);
  }

  if (!code_challenge || code_challenge_method !== "S256") {
    return c.json({ error: "invalid_request", error_description: "PKCE S256 required" }, 400);
  }

  // Store pending auth
  const authState = crypto.randomUUID();
  pendingAuthorizations.set(authState, {
    redirectUri: redirect_uri ?? "",
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    clientId: client_id ?? "",
    state: state ?? "",
    createdAt: Date.now(),
  });

  // Show login page
  const loginUrl = new URL(`${BASE_URL}/auth/login`);
  loginUrl.searchParams.set("auth_state", authState);
  return c.redirect(loginUrl.toString());
});

// ============================================
// Login page (HTML)
// ============================================
server.app.get("/auth/login", (c) => {
  const authState = c.req.query("auth_state") ?? "";
  const loginError = c.req.query("error") ?? "";

  return c.html(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Digital Twin — Accedi</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      display:flex;align-items:center;justify-content:center;
      min-height:100vh;background:#fafafa;color:#111}
    .card{background:white;border-radius:12px;padding:2rem;
      max-width:400px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    h1{font-size:1.5rem;margin-bottom:.5rem}
    .sub{color:#666;font-size:.875rem;margin-bottom:1.5rem}
    label{font-size:.875rem;font-weight:500;display:block;margin-bottom:.5rem}
    input{width:100%;padding:.625rem .75rem;border:1px solid #ddd;
      border-radius:8px;font-size:.875rem;margin-bottom:1rem;outline:none}
    input:focus{border-color:#111}
    button{width:100%;padding:.625rem;background:#111;color:white;
      border:none;border-radius:8px;font-size:.875rem;font-weight:500;cursor:pointer}
    button:hover{background:#333}
    .err{color:#dc2626;font-size:.8rem;margin-bottom:1rem;text-align:center}
    .toggle{text-align:center;font-size:.8rem;color:#666;margin-top:1rem;cursor:pointer}
    .toggle:hover{color:#111;text-decoration:underline}
  </style>
</head>
<body>
  <div class="card">
    <h1>Digital Twin</h1>
    <p class="sub">Accedi per collegare il tuo Digital Twin a ChatGPT</p>
    ${loginError ? `<p class="err">${loginError}</p>` : ""}
    <form method="POST" action="${BASE_URL}/auth/authenticate">
      <input type="hidden" name="auth_state" value="${authState}">
      <input type="hidden" name="mode" value="signin">
      <label for="email">Email</label>
      <input type="email" name="email" id="email" placeholder="tu@esempio.com" required>
      <label for="password">Password</label>
      <input type="password" name="password" id="password" placeholder="Min. 6 caratteri" required minlength="6">
      <button type="submit">Accedi</button>
    </form>
    <div class="toggle" onclick="toggleMode()">Non hai un account? Registrati</div>
  </div>
  <script>
    function toggleMode(){
      const form=document.querySelector('form');
      const mode=form.querySelector('[name=mode]');
      const btn=form.querySelector('button');
      const toggle=document.querySelector('.toggle');
      if(mode.value==='signin'){
        mode.value='signup';btn.textContent='Registrati';
        toggle.textContent='Hai gia un account? Accedi';
      }else{
        mode.value='signin';btn.textContent='Accedi';
        toggle.textContent='Non hai un account? Registrati';
      }
    }
  </script>
</body>
</html>`);
});

// ============================================
// Authenticate (form POST → Supabase Auth)
// ============================================
server.app.post("/auth/authenticate", async (c) => {
  const body = await c.req.parseBody();
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const authState = String(body.auth_state ?? "");
  const mode = String(body.mode ?? "signin");

  if (!email || !password || !authState) {
    return c.redirect(
      `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent("Email e password obbligatori")}`
    );
  }

  const pending = pendingAuthorizations.get(authState);
  if (!pending) {
    return c.redirect(
      `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent("Sessione scaduta. Chiudi e riprova da ChatGPT.")}`
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  if (mode === "signup") {
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: email.split("@")[0] } },
    });
    if (signupError) {
      return c.redirect(
        `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent(signupError.message)}`
      );
    }
    // Try to sign in immediately (works if auto-confirm is enabled)
    const { data, error: signinError } = await supabase.auth.signInWithPassword({ email, password });
    if (signinError || !data.session) {
      return c.redirect(
        `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent("Account creato. Conferma l'email e poi accedi.")}`
      );
    }
    return completeAuth(c, pending, data.session, authState);
  }

  // Sign in
  const { data, error: signinError } = await supabase.auth.signInWithPassword({ email, password });
  if (signinError || !data.session) {
    const msg = signinError?.message?.includes("Invalid login")
      ? "Email o password non corretti"
      : (signinError?.message ?? "Login fallito");
    return c.redirect(
      `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent(msg)}`
    );
  }

  return completeAuth(c, pending, data.session, authState);
});

function completeAuth(
  c: any,
  pending: { redirectUri: string; codeChallenge: string; state: string },
  session: { access_token: string; refresh_token?: string },
  authState: string
) {
  if (!session.refresh_token) {
    console.warn("[Auth] WARNING: No refresh_token from Supabase session. ChatGPT may hide tools.");
  }

  const mcpAuthCode = crypto.randomUUID();

  authCodes.set(mcpAuthCode, {
    supabaseAccessToken: session.access_token,
    supabaseRefreshToken: session.refresh_token ?? "",
    codeChallenge: pending.codeChallenge,
    redirectUri: pending.redirectUri,
    createdAt: Date.now(),
  });

  pendingAuthorizations.delete(authState);

  const redirectUrl = new URL(pending.redirectUri);
  redirectUrl.searchParams.set("code", mcpAuthCode);
  if (pending.state) {
    redirectUrl.searchParams.set("state", pending.state);
  }

  return c.redirect(redirectUrl.toString());
}

// ============================================
// Token endpoint (code → access_token)
// ============================================
server.app.post("/token", async (c) => {
  const body = await c.req.parseBody();
  const grant_type = String(body.grant_type ?? "");
  const code = String(body.code ?? "");
  const code_verifier = String(body.code_verifier ?? "");
  const redirect_uri = String(body.redirect_uri ?? "");
  const refresh_token = String(body.refresh_token ?? "");

  if (grant_type === "authorization_code") {
    if (!code || !code_verifier) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const stored = authCodes.get(code);
    if (!stored) {
      return c.json({ error: "invalid_grant", error_description: "Code not found or expired" }, 400);
    }

    // Verify PKCE S256
    const expectedChallenge = crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64url");

    if (expectedChallenge !== stored.codeChallenge) {
      return c.json({ error: "invalid_grant", error_description: "PKCE verification failed" }, 400);
    }

    if (redirect_uri && redirect_uri !== stored.redirectUri) {
      return c.json({ error: "invalid_grant", error_description: "redirect_uri mismatch" }, 400);
    }

    authCodes.delete(code);

    return c.json({
      access_token: stored.supabaseAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: stored.supabaseRefreshToken,
      scope: "openid profile email",
    });
  }

  if (grant_type === "refresh_token") {
    if (!refresh_token) {
      return c.json({ error: "invalid_request" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error: refreshError } = await supabase.auth.refreshSession({ refresh_token });

    if (refreshError || !data.session) {
      return c.json({ error: "invalid_grant" }, 400);
    }

    return c.json({
      access_token: data.session.access_token,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: data.session.refresh_token,
      scope: "openid profile email",
    });
  }

  return c.json({ error: "unsupported_grant_type" }, 400);
});

// ============================================
// Bearer Auth Middleware on /mcp and /sse
// ============================================
const RESOURCE_METADATA_URL = `${BASE_URL}/.well-known/oauth-protected-resource`;

const bearerAuthMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    c.header("WWW-Authenticate", `Bearer resource_metadata="${RESOURCE_METADATA_URL}"`);
    c.status(401);
    return c.json({ error: "Missing Authorization header" });
  }

  // Validate token with Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error: authError } = await supabase.auth.getUser(token);

  if (authError || !data.user) {
    c.header("WWW-Authenticate", `Bearer resource_metadata="${RESOURCE_METADATA_URL}", error="invalid_token"`);
    c.status(401);
    return c.json({ error: "Invalid or expired token" });
  }

  // Run handler inside AsyncLocalStorage context
  return requestContext.run(
    { userId: data.user.id, accessToken: token },
    () => next()
  );
};

server.app.use("/mcp/*", bearerAuthMiddleware);
server.app.use("/sse/*", bearerAuthMiddleware);

// ============================================
// Health check
// ============================================
server.app.get("/health", (c) =>
  c.json({ status: "ok", version: "1.0.0", auth: "supabase-oauth" })
);

// ============================================
// TOOL: save_memory
// ============================================
server.tool(
  {
    name: "save_memory",
    description:
      "Save a piece of information about the user to their Digital Twin's persistent long-term memory. ALWAYS use this tool when the user shares personal facts, skills, preferences, decisions, projects, relationships, opinions, goals, or communication style. This is NOT ChatGPT's built-in memory — it stores data in the user's Digital Twin profile so their AI agent can represent them to other people's agents.",
    schema: z.object({
      content: z
        .string()
        .describe("The memory content in natural language. Be specific and detailed. Example: 'Works as a full-stack developer specializing in React and Node.js at a startup in Turin'"),
      category: z
        .enum([
          "identity",
          "skill",
          "preference",
          "decision",
          "project",
          "relationship",
          "opinion",
          "communication",
          "goal",
        ])
        .describe("Category: identity (who they are), skill (what they can do), preference (what they like/dislike), decision (past choices), project (current work), relationship (people they know), opinion (views on topics), communication (how they talk), goal (what they want to achieve)"),
      metadata: z
        .string()
        .optional()
        .describe("Optional metadata as JSON string, e.g. '{\"source\":\"meeting\",\"date\":\"2026-03-26\"}'"),
    }),
  },
  async ({ content, category, metadata }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
      const result = await saveMemory(supabase, getUserId(), {
        content,
        category,
        metadata: parsedMetadata,
      });
      return object(result);
    } catch (err) {
      return error(`Errore nel salvataggio: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: search_memories
// ============================================
server.tool(
  {
    name: "search_memories",
    description:
      "Search the user's Digital Twin memory using semantic search. Use this when the user asks 'what do you know about me?', 'what are my skills?', 'do you remember...?', or any question about previously saved information. Returns the most relevant memories ranked by similarity.",
    schema: z.object({
      query: z
        .string()
        .describe("Natural language search query. Example: 'programming skills' or 'projects I'm working on'"),
      category: z
        .string()
        .optional()
        .describe("Optional filter: identity, skill, preference, decision, project, relationship, opinion, communication, goal"),
      limit: z.number().default(10).describe("Max results to return (default 10)"),
    }),
  },
  async ({ query, category, limit }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const results = await searchMemories(
        supabase,
        getUserId(),
        query,
        category,
        limit
      );
      return object({ results, count: results.length });
    } catch (err) {
      return error(`Errore nella ricerca: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: extract_all_memories
// ============================================
server.tool(
  {
    name: "extract_all_memories",
    description:
      "Bulk import multiple memories at once into the Digital Twin. Use this when you have gathered several facts about the user from a conversation and want to save them all efficiently. Send a JSON array of memories with content and category for each. This is faster than calling save_memory multiple times.",
    schema: z.object({
      extraction_prompt: z
        .string()
        .describe(
          'JSON string containing memories to import. Format: array of {content: string, category: string}. Example: [{"content":"Loves Italian cuisine","category":"preference"},{"content":"Expert in Python","category":"skill"}]'
        ),
    }),
  },
  async ({ extraction_prompt }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const result = await extractAllMemories(
        supabase,
        getUserId(),
        extraction_prompt
      );
      return object({
        ...result,
        message: `Importate ${result.memories_created} nuove memorie. ${result.memories_deduplicated} duplicate ignorate.`,
      });
    } catch (err) {
      return error(`Errore nell'estrazione: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: ask_agent
// ============================================
server.tool(
  {
    name: "ask_agent",
    description:
      "Ask a question to another user's Digital Twin agent. The agent will respond based on that person's stored memories, skills, and personality. Use this when the user wants feedback, advice, or a perspective from a connected friend's Digital Twin. Requires an accepted friend connection (set up via the Digital Twin webapp).",
    schema: z.object({
      target_user_display_name: z
        .string()
        .describe("Display name of the person whose Digital Twin you want to ask (e.g. 'marco', 'giulia')"),
      question: z
        .string()
        .describe("The question or request for the other person's Digital Twin"),
      context: z
        .string()
        .optional()
        .describe("Additional context to help the agent give a better answer (e.g. a project plan to review)"),
      interaction_type: z
        .enum(["feedback", "review", "brainstorm", "availability_check"])
        .optional()
        .describe("Type of interaction: feedback (opinion), review (evaluate work), brainstorm (generate ideas), availability_check (check if available)"),
    }),
  },
  async ({ target_user_display_name, question, context }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const result = await askAgent(
        supabase,
        getUserId(),
        target_user_display_name,
        question,
        context
      );
      return object(result);
    } catch (err) {
      return error(`Errore nell'interazione: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: get_my_twin_status
// ============================================
server.tool(
  {
    name: "get_my_twin_status",
    description:
      "Get the current status of the user's Digital Twin profile. Shows: total memories stored, number of friend connections, memory breakdown by category, and overall readiness. Use this when the user asks 'how is my twin?', 'what's my status?', 'how many memories do I have?', or wants an overview of their Digital Twin.",
    schema: z.object({}),
  },
  async () => {
    try {
      const supabase = createUserClient(getAccessToken());
      const userId = getUserId();

      const [{ data: agent }, { data: memories }, { count: connCount }] =
        await Promise.all([
          supabase
            .from("agents")
            .select("display_name, memory_count, status")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("memories")
            .select("category")
            .eq("user_id", userId)
            .eq("is_active", true),
          supabase
            .from("connections")
            .select("id", { count: "exact", head: true })
            .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
            .eq("status", "accepted"),
        ]);

      const categories: Record<string, number> = {};
      for (const m of memories ?? []) {
        categories[m.category] = (categories[m.category] ?? 0) + 1;
      }

      return object({
        display_name: agent?.display_name ?? "Unknown",
        memory_count: agent?.memory_count ?? 0,
        connections_count: connCount ?? 0,
        categories,
        status: agent?.status ?? "unknown",
      });
    } catch (err) {
      return error(`Errore nello stato: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: list_agents
// ============================================
server.tool(
  {
    name: "list_agents",
    description:
      "List all available agents for collaborative planning and show an interactive UI to select them. Returns specialist agents (Frontend, Backend, Security, DevOps, UX, PM, Data, Mobile) and connected friends' Digital Twins. Use this when the user asks 'show me the agents', 'which agents can I use?', 'who can help me plan?', 'build a team', or wants to create a collaborative plan.",
    schema: z.object({}),
    widget: {
      name: "agent-selector",
      invoking: "Loading agents...",
      invoked: "Select your team",
    },
  },
  async () => {
    try {
      const supabase = createUserClient(getAccessToken());
      const result = await listAvailableAgents(supabase, getUserId());
      return widget({
        props: result,
        output: text(
          `Available agents: ${result.builtin_agents.map((a) => `${a.icon} ${a.name}`).join(", ")}` +
          (result.friend_agents.length > 0
            ? `. Friends: ${result.friend_agents.map((a) => a.name).join(", ")}`
            : "")
        ),
      });
    } catch (err) {
      return error(`Errore nel recupero agenti: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: create_plan
// ============================================
server.tool(
  {
    name: "create_plan",
    description:
      "Create a comprehensive project plan using a team of AI agents. Each agent contributes their expertise (frontend, backend, security, UX, etc.) and optionally friends' Digital Twins can participate too. The agents collaborate and their contributions are synthesized into a unified actionable plan. Use this when the user says 'create a plan', 'help me plan', 'build a plan with agents', or describes a project they want to plan. First call list_agents to show available agents, let the user pick, then call this tool.",
    schema: z.object({
      plan_description: z
        .string()
        .describe(
          "Detailed description of the project or feature to plan. Be as specific as possible."
        ),
      agent_ids: z
        .array(z.string())
        .describe(
          "Array of agent IDs to include. Use IDs from list_agents: built-in IDs like 'frontend', 'backend', 'security', 'devops', 'ux', 'pm', 'data', 'mobile', or friend IDs like 'friend:username'"
        ),
      plan_name: z
        .string()
        .optional()
        .describe(
          "Short name for the plan (e.g. 'App iOS ElevenLabs'). If not provided, auto-generated from description."
        ),
      context: z
        .string()
        .optional()
        .describe(
          "Optional additional context: existing tech stack, constraints, deadlines, team size, etc."
        ),
    }),
  },
  async ({ plan_description, agent_ids, plan_name, context }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const result = await createCollaborativePlan(
        supabase,
        getUserId(),
        plan_description,
        agent_ids,
        context
      );

      // Auto-save plan to database
      const name = plan_name ?? result.plan_title;
      const saved = await savePlan(
        supabase,
        getUserId(),
        result,
        name,
        plan_description
      );

      return object({ ...result, saved_plan_id: saved.plan_id, saved_name: saved.name });
    } catch (err) {
      return error(`Errore nella creazione del piano: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: get_plan
// ============================================
server.tool(
  {
    name: "get_plan",
    description:
      "Retrieve a saved collaborative plan by name or keyword search. Returns the full plan with all agent contributions and unified plan. Use when the user says 'prendi il piano...', 'mostrami il piano...', 'get the plan for...', 'apri il piano...'. Returns the complete plan data so it can be used for implementation.",
    schema: z.object({
      search: z
        .string()
        .describe(
          "Name or keyword to search for in plan names/descriptions (e.g. 'app iOS', 'backend API')"
        ),
    }),
  },
  async ({ search }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const plan = await getPlan(supabase, getUserId(), search);
      if (!plan) return text("Nessun piano trovato con quel nome. Prova con 'i miei piani' per vedere tutti i piani salvati.");
      return object(plan);
    } catch (err) {
      return error(`Errore ricerca piano: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: list_plans
// ============================================
server.tool(
  {
    name: "list_plans",
    description:
      "List all saved collaborative plans. Use when the user says 'i miei piani', 'quali piani ho?', 'list my plans', 'show plans', 'mostra i piani'.",
    schema: z.object({}),
  },
  async () => {
    try {
      const supabase = createUserClient(getAccessToken());
      const plans = await listPlans(supabase, getUserId());
      if (plans.length === 0) return text("Non hai ancora nessun piano salvato. Crea un piano con il team di agenti!");
      return object({ plans, count: plans.length });
    } catch (err) {
      return error(`Errore lista piani: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: get_notifications
// ============================================
server.tool(
  {
    name: "get_notifications",
    description:
      "Get unread notifications for the user. Use when the user says 'novità?', 'notifiche?', 'news?', 'ci sono novità DigitalTwin?', 'qualcosa di nuovo?', 'che succede?', or any variation asking about news or notifications.",
    schema: z.object({
      mark_as_read: z
        .boolean()
        .default(false)
        .describe("If true, mark all returned notifications as read after showing them"),
    }),
    widget: {
      name: "notifications",
      invoking: "Checking notifications...",
      invoked: "Notifications",
    },
  },
  async ({ mark_as_read }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const notifications = await getUnreadNotifications(supabase, getUserId());

      if (mark_as_read && notifications.length > 0) {
        await markAllRead(supabase, getUserId());
      }

      return widget({
        props: { notifications },
        output:
          notifications.length === 0
            ? text("Nessuna notifica! Tutto tranquillo. 🎉")
            : text(
                `Hai ${notifications.length} notific${notifications.length === 1 ? "a" : "he"} non lett${notifications.length === 1 ? "a" : "e"}.`
              ),
      });
    } catch (err) {
      return error(`Errore lettura notifiche: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: check_availability
// ============================================
server.tool(
  {
    name: "check_availability",
    description:
      "Check if a connected friend is available on their Google Calendar. Use when the user asks 'è libero Marco?', 'Marco ha tempo domani?', 'is Marco free tomorrow?', or any variation asking about a friend's availability.",
    schema: z.object({
      target_display_name: z
        .string()
        .describe("Display name of the friend to check availability for"),
      date: z
        .string()
        .describe(
          "Date to check in ISO 8601 format (e.g. '2026-03-28'). Use today's date if not specified."
        ),
      time_range: z
        .string()
        .optional()
        .describe(
          "Time range to check (e.g. 'afternoon', 'morning', '14:00-18:00'). Defaults to full day."
        ),
    }),
  },
  async ({ target_display_name, date, time_range }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const userId = getUserId();

      // Find target user
      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .ilike("display_name", target_display_name)
        .single();

      if (!targetUser) {
        return text(`Utente "${target_display_name}" non trovato.`);
      }

      // Check connection
      const { data: connection } = await supabase
        .from("connections")
        .select("id")
        .or(
          `and(requester_id.eq.${userId},receiver_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},receiver_id.eq.${userId})`
        )
        .eq("status", "accepted")
        .single();

      if (!connection) {
        return text(
          `Non sei connesso con ${target_display_name}. Invia prima una richiesta di connessione.`
        );
      }

      // Parse time range
      let timeMin = `${date}T00:00:00Z`;
      let timeMax = `${date}T23:59:59Z`;

      if (time_range) {
        if (time_range.toLowerCase().includes("mattin") || time_range.toLowerCase() === "morning") {
          timeMin = `${date}T08:00:00Z`;
          timeMax = `${date}T13:00:00Z`;
        } else if (time_range.toLowerCase().includes("pomeriggio") || time_range.toLowerCase() === "afternoon") {
          timeMin = `${date}T13:00:00Z`;
          timeMax = `${date}T19:00:00Z`;
        } else if (time_range.includes("-")) {
          const [start, end] = time_range.split("-");
          timeMin = `${date}T${start.trim()}:00Z`;
          timeMax = `${date}T${end.trim()}:00Z`;
        }
      }

      const result = await checkAvailability(
        supabase,
        targetUser.id,
        timeMin,
        timeMax
      );

      if (!result.hasCalendar) {
        return text(
          `${target_display_name} non ha collegato Google Calendar. Non posso verificare la disponibilità.`
        );
      }

      const busyDetails =
        result.busySlots.length > 0
          ? result.busySlots
              .map(
                (s) =>
                  `- Occupato: ${new Date(s.start).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} - ${new Date(s.end).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
              )
              .join("\n")
          : "";

      return object({
        target_name: target_display_name,
        date,
        time_range: time_range ?? "giornata intera",
        available: result.busySlots.length === 0,
        busy_slots: result.busySlots,
        summary: result.freeMessage,
        details: busyDetails,
      });
    } catch (err) {
      return error(`Errore check disponibilità: ${String(err)}`);
    }
  }
);

// ============================================
// TOOL: request_meeting
// ============================================
server.tool(
  {
    name: "request_meeting",
    description:
      "Request a meeting with a connected friend. Creates a calendar request and notifies them. Use after checking availability with check_availability.",
    schema: z.object({
      target_display_name: z
        .string()
        .describe("Display name of the friend to meet with"),
      proposed_time: z
        .string()
        .describe(
          "Proposed meeting start time in ISO 8601 format (e.g. '2026-03-28T15:00:00Z')"
        ),
      duration_minutes: z
        .number()
        .default(30)
        .describe("Duration of the meeting in minutes"),
      message: z
        .string()
        .optional()
        .describe("Optional message explaining the meeting purpose"),
    }),
  },
  async ({ target_display_name, proposed_time, duration_minutes, message }) => {
    try {
      const supabase = createUserClient(getAccessToken());
      const userId = getUserId();

      // Find target user
      const { data: targetUser } = await supabase
        .from("users")
        .select("id, display_name")
        .ilike("display_name", target_display_name)
        .single();

      if (!targetUser) {
        return text(`Utente "${target_display_name}" non trovato.`);
      }

      // Get requester display name
      const { data: requester } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", userId)
        .single();

      // Create calendar request
      const { data: calRequest, error: calError } = await supabase
        .from("calendar_requests")
        .insert({
          requester_id: userId,
          target_id: targetUser.id,
          proposed_time,
          duration_minutes,
          message: message ?? null,
        })
        .select()
        .single();

      if (calError) {
        return error(`Errore creazione richiesta: ${calError.message}`);
      }

      // Create notification for target
      await createNotification(
        supabase,
        targetUser.id,
        "calendar_request",
        `${requester?.display_name ?? "Qualcuno"} vuole un meeting con te`,
        message ??
          `Meeting proposto per il ${new Date(proposed_time).toLocaleDateString("it-IT")} alle ${new Date(proposed_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} (${duration_minutes} min)`,
        {
          calendar_request_id: calRequest.id,
          requester_id: userId,
          proposed_time,
          duration_minutes,
        }
      );

      return text(
        `✅ Richiesta di meeting inviata a ${target_display_name}! Ti ha proposto un incontro il ${new Date(proposed_time).toLocaleDateString("it-IT")} alle ${new Date(proposed_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} per ${duration_minutes} minuti. ${target_display_name} riceverà una notifica.`
      );
    } catch (err) {
      return error(`Errore richiesta meeting: ${String(err)}`);
    }
  }
);

// ============================================
// Start server
// ============================================
server.listen(PORT).then(() => {
  console.log(`Digital Twin MCP Server running on port ${PORT}`);
  console.log(`MCP endpoint: ${BASE_URL}/mcp`);
  console.log(`OAuth authorize: ${BASE_URL}/authorize`);
  console.log(`OAuth register: ${BASE_URL}/register`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Inspector: http://localhost:${PORT}/inspector`);
});
