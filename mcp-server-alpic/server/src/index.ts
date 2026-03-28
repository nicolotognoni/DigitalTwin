import "dotenv/config";
import { McpServer } from "skybridge/server";
import { z } from "zod";
import { withAuth } from "./auth.js";
import { createUserClient } from "./services/supabase.js";
import {
  saveMemory,
  searchMemories,
  extractAllMemories,
} from "./services/memory.js";
import { askAgent } from "./services/agent-engine.js";
import {
  listAvailableAgents,
  createCollaborativePlan,
} from "./services/plan-engine.js";
import { savePlan, getPlan, listPlans } from "./services/plan-storage.js";
import {
  getUnreadNotifications,
  markAllRead,
  createNotification,
} from "./services/notification-service.js";
import { checkAvailability } from "./services/calendar-service.js";

// ============================================
// Server
// ============================================
const server = new McpServer(
  {
    name: "digital-twin",
    version: "1.0.0",
  },
  { capabilities: {} },
)

  // ============================================
  // TOOL: save-memory
  // ============================================
  .registerTool(
    "save-memory",
    {
      description:
        "Save a piece of information about the user to their Digital Twin's persistent long-term memory. ALWAYS use this tool when the user shares personal facts, skills, preferences, decisions, projects, relationships, opinions, goals, or communication style. This is NOT ChatGPT's built-in memory — it stores data in the user's Digital Twin profile so their AI agent can represent them to other people's agents.",
      inputSchema: {
        content: z
          .string()
          .describe(
            "The memory content in natural language. Be specific and detailed. Example: 'Works as a full-stack developer specializing in React and Node.js at a startup in Turin'",
          ),
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
          .describe(
            "Category: identity (who they are), skill (what they can do), preference (what they like/dislike), decision (past choices), project (current work), relationship (people they know), opinion (views on topics), communication (how they talk), goal (what they want to achieve)",
          ),
        metadata: z
          .string()
          .optional()
          .describe(
            "Optional metadata as JSON string, e.g. '{\"source\":\"meeting\",\"date\":\"2026-03-26\"}'",
          ),
      },
    },
    withAuth(async ({ content, category, metadata }, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const parsedMetadata = metadata ? JSON.parse(metadata) : undefined;
        const result = await saveMemory(supabase, userId, {
          content,
          category,
          metadata: parsedMetadata,
        });
        return { structuredContent: result, content: [] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Errore nel salvataggio: ${String(err)}` }],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // TOOL: search-memories
  // ============================================
  .registerTool(
    "search-memories",
    {
      description:
        "Search the user's Digital Twin memory using semantic search. Use this when the user asks 'what do you know about me?', 'what are my skills?', 'do you remember...?', or any question about previously saved information. Returns the most relevant memories ranked by similarity.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Natural language search query. Example: 'programming skills' or 'projects I'm working on'",
          ),
        category: z
          .string()
          .optional()
          .describe(
            "Optional filter: identity, skill, preference, decision, project, relationship, opinion, communication, goal",
          ),
        limit: z.number().default(10).describe("Max results to return (default 10)"),
      },
    },
    withAuth(async ({ query, category, limit }, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const results = await searchMemories(supabase, userId, query, category, limit);
        return { structuredContent: { results, count: results.length }, content: [] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Errore nella ricerca: ${String(err)}` }],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // TOOL: extract-all-memories
  // ============================================
  .registerTool(
    "extract-all-memories",
    {
      description:
        "Bulk import multiple memories at once into the Digital Twin. Use this when you have gathered several facts about the user from a conversation and want to save them all efficiently. Send a JSON array of memories with content and category for each. This is faster than calling save_memory multiple times.",
      inputSchema: {
        extraction_prompt: z
          .string()
          .describe(
            'JSON string containing memories to import. Format: array of {content: string, category: string}. Example: [{"content":"Loves Italian cuisine","category":"preference"},{"content":"Expert in Python","category":"skill"}]',
          ),
      },
    },
    withAuth(async ({ extraction_prompt }, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const result = await extractAllMemories(supabase, userId, extraction_prompt);
        return {
          structuredContent: {
            ...result,
            message: `Importate ${result.memories_created} nuove memorie. ${result.memories_deduplicated} duplicate ignorate.`,
          },
          content: [],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Errore nell'estrazione: ${String(err)}` }],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // TOOL: ask-agent
  // ============================================
  .registerTool(
    "ask-agent",
    {
      description:
        "Ask a question to another user's Digital Twin agent. The agent will respond based on that person's stored memories, skills, and personality. Use this when the user wants feedback, advice, or a perspective from a connected friend's Digital Twin. Requires an accepted friend connection (set up via the Digital Twin webapp).",
      inputSchema: {
        target_user_display_name: z
          .string()
          .describe(
            "Display name of the person whose Digital Twin you want to ask (e.g. 'marco', 'giulia')",
          ),
        question: z
          .string()
          .describe("The question or request for the other person's Digital Twin"),
        context: z
          .string()
          .optional()
          .describe(
            "Additional context to help the agent give a better answer (e.g. a project plan to review)",
          ),
        interaction_type: z
          .enum(["feedback", "review", "brainstorm", "availability_check"])
          .optional()
          .describe(
            "Type of interaction: feedback (opinion), review (evaluate work), brainstorm (generate ideas), availability_check (check if available)",
          ),
      },
    },
    withAuth(
      async ({ target_user_display_name, question, context }, { userId, accessToken }) => {
        try {
          const supabase = createUserClient(accessToken);
          const result = await askAgent(
            supabase,
            userId,
            target_user_display_name,
            question,
            context,
          );
          return { structuredContent: result, content: [] };
        } catch (err) {
          return {
            content: [{ type: "text", text: `Errore nell'interazione: ${String(err)}` }],
            isError: true,
          };
        }
      },
    ),
  )

  // ============================================
  // TOOL: get-my-twin-status
  // ============================================
  .registerTool(
    "get-my-twin-status",
    {
      description:
        "Get the current status of the user's Digital Twin profile. Shows: total memories stored, number of friend connections, memory breakdown by category, and overall readiness. Use this when the user asks 'how is my twin?', 'what's my status?', 'how many memories do I have?', or wants an overview of their Digital Twin.",
      inputSchema: {},
    },
    withAuth(async (_input, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);

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

        return {
          structuredContent: {
            display_name: agent?.display_name ?? "Unknown",
            memory_count: agent?.memory_count ?? 0,
            connections_count: connCount ?? 0,
            categories,
            status: agent?.status ?? "unknown",
          },
          content: [],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Errore nello stato: ${String(err)}` }],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // WIDGET: agent-selector (was list_agents)
  // ============================================
  .registerWidget(
    "agent-selector",
    { description: "Interactive agent selector for collaborative planning" },
    {
      description:
        "List all available agents for collaborative planning and show an interactive UI to select them. Returns specialist agents (Frontend, Backend, Security, DevOps, UX, PM, Data, Mobile) and connected friends' Digital Twins. Use this when the user asks 'show me the agents', 'which agents can I use?', 'who can help me plan?', 'build a team', or wants to create a collaborative plan.",
      inputSchema: {},
    },
    withAuth(async (_input, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const result = await listAvailableAgents(supabase, userId);
        return {
          structuredContent: result,
          content: [
            {
              type: "text",
              text:
                `Available agents: ${result.builtin_agents.map((a: { icon: string; name: string }) => `${a.icon} ${a.name}`).join(", ")}` +
                (result.friend_agents.length > 0
                  ? `. Friends: ${result.friend_agents.map((a: { name: string }) => a.name).join(", ")}`
                  : ""),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            { type: "text", text: `Errore nel recupero agenti: ${String(err)}` },
          ],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // TOOL: create-plan
  // ============================================
  .registerTool(
    "create-plan",
    {
      description:
        "Create a comprehensive project plan using a team of AI agents. Each agent contributes their expertise (frontend, backend, security, UX, etc.) and optionally friends' Digital Twins can participate too. The agents collaborate and their contributions are synthesized into a unified actionable plan. Use this when the user says 'create a plan', 'help me plan', 'build a plan with agents', or describes a project they want to plan. First call list_agents to show available agents, let the user pick, then call this tool.",
      inputSchema: {
        plan_description: z
          .string()
          .describe(
            "Detailed description of the project or feature to plan. Be as specific as possible.",
          ),
        agent_ids: z
          .array(z.string())
          .describe(
            "Array of agent IDs to include. Use IDs from list_agents: built-in IDs like 'frontend', 'backend', 'security', 'devops', 'ux', 'pm', 'data', 'mobile', or friend IDs like 'friend:username'",
          ),
        plan_name: z
          .string()
          .optional()
          .describe(
            "Short name for the plan (e.g. 'App iOS ElevenLabs'). If not provided, auto-generated from description.",
          ),
        context: z
          .string()
          .optional()
          .describe(
            "Optional additional context: existing tech stack, constraints, deadlines, team size, etc.",
          ),
      },
    },
    withAuth(
      async (
        { plan_description, agent_ids, plan_name, context },
        { userId, accessToken },
      ) => {
        try {
          const supabase = createUserClient(accessToken);
          const result = await createCollaborativePlan(
            supabase,
            userId,
            plan_description,
            agent_ids,
            context,
          );

          // Auto-save plan to database
          const name = plan_name ?? result.plan_title;
          const saved = await savePlan(
            supabase,
            userId,
            result,
            name,
            plan_description,
          );

          return {
            structuredContent: {
              ...result,
              saved_plan_id: saved.plan_id,
              saved_name: saved.name,
            },
            content: [],
          };
        } catch (err) {
          return {
            content: [
              {
                type: "text",
                text: `Errore nella creazione del piano: ${String(err)}`,
              },
            ],
            isError: true,
          };
        }
      },
    ),
  )

  // ============================================
  // TOOL: get-plan
  // ============================================
  .registerTool(
    "get-plan",
    {
      description:
        "Retrieve a saved collaborative plan by name or keyword search. Returns the full plan with all agent contributions and unified plan. Use when the user says 'prendi il piano...', 'mostrami il piano...', 'get the plan for...', 'apri il piano...'. Returns the complete plan data so it can be used for implementation.",
      inputSchema: {
        search: z
          .string()
          .describe(
            "Name or keyword to search for in plan names/descriptions (e.g. 'app iOS', 'backend API')",
          ),
      },
    },
    withAuth(async ({ search }, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const plan = await getPlan(supabase, userId, search);
        if (!plan) {
          return {
            content: [
              {
                type: "text",
                text: "Nessun piano trovato con quel nome. Prova con 'i miei piani' per vedere tutti i piani salvati.",
              },
            ],
          };
        }
        return { structuredContent: plan, content: [] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Errore ricerca piano: ${String(err)}` }],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // TOOL: list-plans
  // ============================================
  .registerTool(
    "list-plans",
    {
      description:
        "List all saved collaborative plans. Use when the user says 'i miei piani', 'quali piani ho?', 'list my plans', 'show plans', 'mostra i piani'.",
      inputSchema: {},
    },
    withAuth(async (_input, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const plans = await listPlans(supabase, userId);
        if (plans.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Non hai ancora nessun piano salvato. Crea un piano con il team di agenti!",
              },
            ],
          };
        }
        return { structuredContent: { plans, count: plans.length }, content: [] };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Errore lista piani: ${String(err)}` }],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // WIDGET: notifications (was get_notifications)
  // ============================================
  .registerWidget(
    "notifications",
    { description: "User notifications display" },
    {
      description:
        "Get unread notifications for the user. Use when the user says 'novità?', 'notifiche?', 'news?', 'ci sono novità DigitalTwin?', 'qualcosa di nuovo?', 'che succede?', or any variation asking about news or notifications.",
      inputSchema: {
        mark_as_read: z
          .boolean()
          .default(false)
          .describe(
            "If true, mark all returned notifications as read after showing them",
          ),
      },
    },
    withAuth(async ({ mark_as_read }, { userId, accessToken }) => {
      try {
        const supabase = createUserClient(accessToken);
        const notifications = await getUnreadNotifications(supabase, userId);

        if (mark_as_read && notifications.length > 0) {
          await markAllRead(supabase, userId);
        }

        const summaryText =
          notifications.length === 0
            ? "Nessuna notifica! Tutto tranquillo."
            : `Hai ${notifications.length} notific${notifications.length === 1 ? "a" : "he"} non lett${notifications.length === 1 ? "a" : "e"}.`;

        return {
          structuredContent: { notifications },
          content: [{ type: "text", text: summaryText }],
        };
      } catch (err) {
        return {
          content: [
            { type: "text", text: `Errore lettura notifiche: ${String(err)}` },
          ],
          isError: true,
        };
      }
    }),
  )

  // ============================================
  // TOOL: check-availability
  // ============================================
  .registerTool(
    "check-availability",
    {
      description:
        "Check if a connected friend is available on their Google Calendar. Use when the user asks 'è libero Marco?', 'Marco ha tempo domani?', 'is Marco free tomorrow?', or any variation asking about a friend's availability.",
      inputSchema: {
        target_display_name: z
          .string()
          .describe("Display name of the friend to check availability for"),
        date: z
          .string()
          .describe(
            "Date to check in ISO 8601 format (e.g. '2026-03-28'). Use today's date if not specified.",
          ),
        time_range: z
          .string()
          .optional()
          .describe(
            "Time range to check (e.g. 'afternoon', 'morning', '14:00-18:00'). Defaults to full day.",
          ),
      },
    },
    withAuth(
      async ({ target_display_name, date, time_range }, { userId, accessToken }) => {
        try {
          const supabase = createUserClient(accessToken);

          // Find target user
          const { data: targetUser } = await supabase
            .from("users")
            .select("id")
            .ilike("display_name", target_display_name)
            .single();

          if (!targetUser) {
            return {
              content: [
                {
                  type: "text",
                  text: `Utente "${target_display_name}" non trovato.`,
                },
              ],
            };
          }

          // Check connection
          const { data: connection } = await supabase
            .from("connections")
            .select("id")
            .or(
              `and(requester_id.eq.${userId},receiver_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},receiver_id.eq.${userId})`,
            )
            .eq("status", "accepted")
            .single();

          if (!connection) {
            return {
              content: [
                {
                  type: "text",
                  text: `Non sei connesso con ${target_display_name}. Invia prima una richiesta di connessione.`,
                },
              ],
            };
          }

          // Parse time range
          let timeMin = `${date}T00:00:00Z`;
          let timeMax = `${date}T23:59:59Z`;

          if (time_range) {
            if (
              time_range.toLowerCase().includes("mattin") ||
              time_range.toLowerCase() === "morning"
            ) {
              timeMin = `${date}T08:00:00Z`;
              timeMax = `${date}T13:00:00Z`;
            } else if (
              time_range.toLowerCase().includes("pomeriggio") ||
              time_range.toLowerCase() === "afternoon"
            ) {
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
            timeMax,
          );

          if (!result.hasCalendar) {
            return {
              content: [
                {
                  type: "text",
                  text: `${target_display_name} non ha collegato Google Calendar. Non posso verificare la disponibilità.`,
                },
              ],
            };
          }

          const busyDetails =
            result.busySlots.length > 0
              ? result.busySlots
                  .map(
                    (s: { start: string; end: string }) =>
                      `- Occupato: ${new Date(s.start).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} - ${new Date(s.end).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`,
                  )
                  .join("\n")
              : "";

          return {
            structuredContent: {
              target_name: target_display_name,
              date,
              time_range: time_range ?? "giornata intera",
              available: result.busySlots.length === 0,
              busy_slots: result.busySlots,
              summary: result.freeMessage,
              details: busyDetails,
            },
            content: [],
          };
        } catch (err) {
          return {
            content: [
              { type: "text", text: `Errore check disponibilità: ${String(err)}` },
            ],
            isError: true,
          };
        }
      },
    ),
  )

  // ============================================
  // TOOL: request-meeting
  // ============================================
  .registerTool(
    "request-meeting",
    {
      description:
        "Request a meeting with a connected friend. Creates a calendar request and notifies them. Use after checking availability with check_availability.",
      inputSchema: {
        target_display_name: z
          .string()
          .describe("Display name of the friend to meet with"),
        proposed_time: z
          .string()
          .describe(
            "Proposed meeting start time in ISO 8601 format (e.g. '2026-03-28T15:00:00Z')",
          ),
        duration_minutes: z
          .number()
          .default(30)
          .describe("Duration of the meeting in minutes"),
        message: z
          .string()
          .optional()
          .describe("Optional message explaining the meeting purpose"),
      },
    },
    withAuth(
      async (
        { target_display_name, proposed_time, duration_minutes, message },
        { userId, accessToken },
      ) => {
        try {
          const supabase = createUserClient(accessToken);

          // Find target user
          const { data: targetUser } = await supabase
            .from("users")
            .select("id, display_name")
            .ilike("display_name", target_display_name)
            .single();

          if (!targetUser) {
            return {
              content: [
                {
                  type: "text",
                  text: `Utente "${target_display_name}" non trovato.`,
                },
              ],
            };
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
            return {
              content: [
                {
                  type: "text",
                  text: `Errore creazione richiesta: ${calError.message}`,
                },
              ],
              isError: true,
            };
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
            },
          );

          return {
            content: [
              {
                type: "text",
                text: `Richiesta di meeting inviata a ${target_display_name}! Ti ha proposto un incontro il ${new Date(proposed_time).toLocaleDateString("it-IT")} alle ${new Date(proposed_time).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })} per ${duration_minutes} minuti. ${target_display_name} riceverà una notifica.`,
              },
            ],
          };
        } catch (err) {
          return {
            content: [
              { type: "text", text: `Errore richiesta meeting: ${String(err)}` },
            ],
            isError: true,
          };
        }
      },
    ),
  );

// ============================================
// Start server
// ============================================
server.run();

export type AppType = typeof server;
