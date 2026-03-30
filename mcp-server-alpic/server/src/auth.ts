import "dotenv/config";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyExtra = RequestHandlerExtra<any, any>;
import { Router, urlencoded, json, type Request, type Response } from "express";
import type { McpServer } from "skybridge/server";

// ============================================
// Config
// ============================================
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const BASE_URL = process.env.MCP_SERVER_URL || "http://localhost:3000";

// ============================================
// Auth helpers for MCP tool handlers
// ============================================
interface Auth {
  readonly userId: string;
  readonly accessToken: string;
  readonly clientSource: "chatgpt" | "claude" | "manual";
}

/**
 * Wrap a tool handler with Bearer token authentication.
 * Validates the token with Supabase and injects { userId, accessToken }.
 */
export function withAuth<TInput>(
  handler: (input: TInput, auth: Auth) => Promise<any>
): (input: TInput, extra: AnyExtra) => Promise<any> {
  return async (input: TInput, extra: AnyExtra) => {
    const authHeader = (extra as any).requestInfo?.headers?.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
      return {
        content: [
          { type: "text", text: "Please sign in to use Digital Twin." },
        ],
        isError: true,
        _meta: {
          "mcp/www_authenticate": [
            `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`,
          ],
        },
      };
    }

    // Validate token with Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return {
        content: [
          { type: "text", text: "Please sign in to use Digital Twin." },
        ],
        isError: true,
        _meta: {
          "mcp/www_authenticate": [
            `Bearer resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource"`,
          ],
        },
      };
    }

    const userAgent = ((extra as any).requestInfo?.headers?.["user-agent"] ?? "").toLowerCase();
    const clientSource = userAgent.includes("claude") ? "claude" as const
      : userAgent.includes("chatgpt") || userAgent.includes("openai") ? "chatgpt" as const
      : "manual" as const;

    return handler(input, { userId: data.user.id, accessToken: token, clientSource });
  };
}

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
// Complete auth helper
// ============================================
function completeAuth(
  res: Response,
  pending: { redirectUri: string; codeChallenge: string; state: string },
  session: { access_token: string; refresh_token?: string },
  authState: string
): void {
  if (!session.refresh_token) {
    console.warn(
      "[Auth] WARNING: No refresh_token from Supabase session. ChatGPT may hide tools."
    );
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

  res.redirect(redirectUrl.toString());
}

// ============================================
// Setup all OAuth routes on the McpServer
// ============================================
export function setupOAuthRoutes(server: McpServer): void {
  const router = Router();
  router.use(urlencoded({ extended: true }));
  router.use(json());

  // ----------------------------------------
  // OAuth Discovery: Protected Resource
  // ----------------------------------------
  router.get("/.well-known/oauth-protected-resource", (_req: Request, res: Response) => {
    res.json({
      resource: `${BASE_URL}/mcp`,
      authorization_servers: [BASE_URL],
      bearer_methods_supported: ["header"],
    });
  });

  router.get("/.well-known/oauth-protected-resource/mcp", (_req: Request, res: Response) => {
    res.json({
      resource: `${BASE_URL}/mcp`,
      authorization_servers: [BASE_URL],
      bearer_methods_supported: ["header"],
    });
  });

  // ----------------------------------------
  // OAuth Discovery: Authorization Server
  // ----------------------------------------
  router.get("/.well-known/oauth-authorization-server", (_req: Request, res: Response) => {
    res.json({
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
    });
  });

  // ----------------------------------------
  // Dynamic Client Registration (RFC 7591)
  // ----------------------------------------
  router.post("/register", (req: Request, res: Response) => {
    const body = req.body ?? {};
    const clientId = `mcp_${crypto.randomUUID()}`;

    res.status(201).json({
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
      client_name: body.client_name ?? "MCP Client",
      redirect_uris: body.redirect_uris ?? [],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: body.token_endpoint_auth_method ?? "none",
    });
  });

  // ----------------------------------------
  // Authorize -> Show login page
  // ----------------------------------------
  router.get("/authorize", (req: Request, res: Response) => {
    const {
      response_type,
      client_id,
      redirect_uri,
      code_challenge,
      code_challenge_method,
      state,
    } = req.query as Record<string, string>;

    if (response_type !== "code") {
      res.status(400).json({ error: "unsupported_response_type" });
      return;
    }

    if (!code_challenge || code_challenge_method !== "S256") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "PKCE S256 required",
      });
      return;
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
    res.redirect(loginUrl.toString());
  });

  // ----------------------------------------
  // Login page (HTML)
  // ----------------------------------------
  router.get("/auth/login", (req: Request, res: Response) => {
    const authState = (req.query.auth_state as string) ?? "";
    const loginError = (req.query.error as string) ?? "";

    res.send(`<!DOCTYPE html>
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
    <p class="sub">Accedi per collegare il tuo Digital Twin</p>
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

  // ----------------------------------------
  // Authenticate (form POST -> Supabase Auth)
  // ----------------------------------------
  router.post("/auth/authenticate", async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const email = String(body.email ?? "");
    const password = String(body.password ?? "");
    const authState = String(body.auth_state ?? "");
    const mode = String(body.mode ?? "signin");

    if (!email || !password || !authState) {
      res.redirect(
        `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent("Email e password obbligatori")}`
      );
      return;
    }

    const pending = pendingAuthorizations.get(authState);
    if (!pending) {
      res.redirect(
        `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent("Sessione scaduta. Chiudi e riprova da ChatGPT.")}`
      );
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (mode === "signup") {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: email.split("@")[0] } },
      });
      if (signupError) {
        res.redirect(
          `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent(signupError.message)}`
        );
        return;
      }
      // Try to sign in immediately (works if auto-confirm is enabled)
      const { data, error: signinError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (signinError || !data.session) {
        res.redirect(
          `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent("Account creato. Conferma l'email e poi accedi.")}`
        );
        return;
      }
      completeAuth(res, pending, data.session, authState);
      return;
    }

    // Sign in
    const { data, error: signinError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signinError || !data.session) {
      const msg = signinError?.message?.includes("Invalid login")
        ? "Email o password non corretti"
        : (signinError?.message ?? "Login fallito");
      res.redirect(
        `${BASE_URL}/auth/login?auth_state=${authState}&error=${encodeURIComponent(msg)}`
      );
      return;
    }

    completeAuth(res, pending, data.session, authState);
  });

  // ----------------------------------------
  // Token endpoint (code -> access_token)
  // ----------------------------------------
  router.post("/token", async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const grant_type = String(body.grant_type ?? "");
    const code = String(body.code ?? "");
    const code_verifier = String(body.code_verifier ?? "");
    const redirect_uri = String(body.redirect_uri ?? "");
    const refresh_token = String(body.refresh_token ?? "");

    if (grant_type === "authorization_code") {
      if (!code || !code_verifier) {
        res.status(400).json({ error: "invalid_request" });
        return;
      }

      const stored = authCodes.get(code);
      if (!stored) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "Code not found or expired",
        });
        return;
      }

      // Verify PKCE S256
      const expectedChallenge = crypto
        .createHash("sha256")
        .update(code_verifier)
        .digest("base64url");

      if (expectedChallenge !== stored.codeChallenge) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "PKCE verification failed",
        });
        return;
      }

      if (redirect_uri && redirect_uri !== stored.redirectUri) {
        res.status(400).json({
          error: "invalid_grant",
          error_description: "redirect_uri mismatch",
        });
        return;
      }

      authCodes.delete(code);

      const tokenResponse: Record<string, unknown> = {
        access_token: stored.supabaseAccessToken,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "openid profile email",
      };
      if (stored.supabaseRefreshToken) {
        tokenResponse.refresh_token = stored.supabaseRefreshToken;
      }
      res.json(tokenResponse);
      return;
    }

    if (grant_type === "refresh_token") {
      if (!refresh_token) {
        res.status(400).json({ error: "invalid_request" });
        return;
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data, error: refreshError } =
        await supabase.auth.refreshSession({ refresh_token });

      if (refreshError || !data.session) {
        res.status(400).json({ error: "invalid_grant" });
        return;
      }

      res.json({
        access_token: data.session.access_token,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: data.session.refresh_token,
        scope: "openid profile email",
      });
      return;
    }

    res.status(400).json({ error: "unsupported_grant_type" });
  });

  // Mount all OAuth routes on the McpServer
  server.use(router as any);
}
