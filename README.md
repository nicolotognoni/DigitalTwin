<p align="center">
  <img src="assets/logo.png" alt="Digital Twin Logo" width="120" height="120" style="border-radius: 20px;" />
</p>

<h1 align="center">Digital Twin</h1>

<p align="center">
  <strong>Your AI-powered personal agent with a centralized memory layer. Create your Digital Twin, collaborate with friends' Twins via MCP, and access your plans and memories from any AI client — ChatGPT, Claude Code, or your own apps.</strong>
</p>

<p align="center">
  <a href="#features"><img src="https://img.shields.io/badge/MCP_Tools-12-blue?style=flat-square" alt="MCP Tools" /></a>
  <a href="#features"><img src="https://img.shields.io/badge/Specialist_Agents-8-purple?style=flat-square" alt="Agents" /></a>
  <a href="#license"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" /></a>
  <a href="https://github.com/nicolotognoni/DigitalTwin"><img src="https://img.shields.io/github/stars/nicolotognoni/DigitalTwin?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/nicolotognoni/DigitalTwin/issues"><img src="https://img.shields.io/github/issues/nicolotognoni/DigitalTwin?style=flat-square" alt="Issues" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#architecture">Architecture</a> &middot;
  <a href="#mcp-tools">MCP Tools</a> &middot;
  <a href="#deploy">Deploy</a>
</p>

---

> 🏆 **1st Place Winner** at [Buildathon @ Turin](https://lu.ma/turinbuildathon) (March 28, 2026) — an MCP Apps hackathon hosted by [Fonderia](https://fonderia.dev) at OGR Torino, sponsored by Manufact, Alpic, Xolo, Lexroom & Fractal. Built in a single day, this project won first place out of 89 participants for its innovative approach to AI-powered personal agents.

---

## What is Digital Twin?

Every user creates a **Digital Twin** — a personal AI agent that stores all your preferences, skills, opinions, and knowledge in a **centralized memory layer**. Your Twin is yours: it lives in a shared database, which means you can access your memories and plans from **any AI client** — create a plan on ChatGPT, then pull it up in Claude Code, or query it from your own app.

But the real power is collaboration. Connect with friends, and your Twins can talk to each other directly through MCP. Create collaborative plans where specialist AI agents and your friends' Twins contribute together, share memories across users, and coordinate through Google Calendar — all from inside ChatGPT.

```
┌─────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐
│   ChatGPT   │────>│  MCP Server         │────>│  Supabase                │
│  (you talk) │<────│  (12 tools + OAuth) │<────│  (pg + pgvector + auth)  │
└─────────────┘     └─────────────────────┘     └──────────────────────────┘
                           ^     │                         ^
┌─────────────┐            │     │ Claude API              │
│   Webapp    │────────────┘     │ + Web Search            │
│  (manage)   │  API Routes      v                         │
└─────────────┘           ┌─────────────────┐              │
                          │  Agent Engine   │              │
                          │  (specialist +  │──────────────┘
                          │   friend twins) │  Google Calendar API
                          └─────────────────┘
```

## How It Works

1. **Talk to ChatGPT** as you normally do — MCP tools automatically save relevant facts about you
2. **Your Twin builds up** a centralized profile: identity, skills, preferences, opinions, goals
3. **Connect with friends** through the webapp — send and accept connection requests
4. **Ask each other's Twins** for feedback, reviews, and brainstorming through ChatGPT
5. **Create collaborative plans** with specialist AI agents + your friends' Twins
6. **Access everything everywhere** — plans and memories live in a shared DB, queryable from ChatGPT, Claude Code, or any MCP-compatible client
7. **Check availability** on friends' Google Calendar and request meetings

## Features

- **Centralized Memory** — all memories and plans stored in a shared DB, accessible from any AI client (ChatGPT, Claude Code, custom apps)
- **12 MCP Tools** — memory management, agent queries, collaborative planning, calendar, notifications
- **2 Interactive Widgets** — agent team selector + notifications card (rendered in ChatGPT)
- **8 Specialist Agents** — Frontend, Backend, Security, DevOps, UX, PM, Data, Mobile
- **Cross-Client Portability** — create a plan on ChatGPT, retrieve it from Claude Code, or query it via API
- **Twin-to-Twin Collaboration** — your Digital Twin talks directly to your friends' Twins
- **Web Search** — agents research online for up-to-date recommendations in plans
- **Google Calendar** — check friends' availability and request meetings
- **Semantic Search** — pgvector embeddings for intelligent memory retrieval
- **Plan Persistence** — plans saved to DB, retrievable from any client
- **Notifications** — real-time notification system with widget in ChatGPT + webapp dashboard
- **OAuth 2.1 + PKCE** — secure authentication with Supabase Auth

## Architecture

| Component | Stack | Purpose |
|-----------|-------|---------|
| **mcp-server-alpic/** | TypeScript, Alpic, Hono | MCP server with 12 tools, 2 widgets, OAuth |
| **webapp/** | Next.js 14, Tailwind, shadcn/ui | Dashboard: memories, connections, plans, notifications, settings |
| **supabase/** | PostgreSQL, pgvector, RLS | Database with vector search, row-level security |

### Database Schema

```
users ─────────── agents (1:1, auto-created)
  │
  ├── memories (pgvector embeddings, 9 categories)
  ├── connections (friend requests: pending/accepted/rejected)
  ├── plans (collaborative plans with agent contributions)
  ├── notifications (cross-user, via SECURITY DEFINER)
  ├── calendar_requests (meeting proposals between users)
  ├── user_integrations (Google Calendar OAuth tokens)
  └── audit_log (agent interaction tracking)
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `save_memory` | Save a fact about the user (identity, skills, preferences, goals, etc.) |
| `search_memories` | Semantic search across stored memories using pgvector |
| `extract_all_memories` | Bulk import multiple memories from a JSON payload |
| `ask_agent` | Query a connected friend's Digital Twin for feedback |
| `get_my_twin_status` | View Twin stats: memory count, connections, category breakdown |
| `list_agents` | Show available specialist agents + friends' Twins (renders widget) |
| `create_plan` | Create a collaborative plan with selected agents (auto-saved to DB) |
| `get_plan` | Retrieve a saved plan by name search |
| `list_plans` | List all saved plans |
| `get_notifications` | Show unread notifications (renders widget) |
| `check_availability` | Check a friend's Google Calendar availability |
| `request_meeting` | Propose a meeting with a connected friend |

## Quick Start

### Prerequisites

- **Node.js** 24+ (MCP server) / 20+ (webapp)
- **Supabase** project — [supabase.com](https://supabase.com)
- **OpenAI API key** — for ada-002 embeddings
- **Anthropic API key** — for agent engine (Claude)
- **Alpic CLI** — `npm install -g alpic` (tunnel + deploy)
- **Google Cloud credentials** — optional, for calendar integration

### 1. Clone & Install

```bash
git clone https://github.com/nicolotognoni/DigitalTwin.git
cd DigitalTwin

# MCP server
cd mcp-server-alpic && npm install

# Webapp
cd ../webapp && npm install
```

### 2. Configure Environment

```bash
cp mcp-server-alpic/.env.example mcp-server-alpic/.env
cp webapp/.env.example webapp/.env.local
```

<details>
<summary><strong>MCP Server environment variables</strong></summary>

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_USE_OAUTH_SUPABASE_PROJECT_ID` | Yes | Supabase project ID |
| `SUPABASE_URL` | Yes | Supabase API URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |
| `PORT` | No | Server port (default: `3001`) |
| `MCP_SERVER_URL` | Yes | Public URL (Alpic tunnel URL) |

</details>

<details>
<summary><strong>Webapp environment variables</strong></summary>

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Yes | Supabase anon key |
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |

</details>

### 3. Set Up Supabase

Run the migrations from `supabase/migrations/` (00001–00011) in the Supabase SQL Editor.

Then enable:
- **Authentication > OAuth Server** — Enable + Allow Dynamic OAuth Apps
- **Authentication > Sign In / Providers** — Enable Email (with password)

### 4. Run (3 Terminals)

```bash
# Terminal 1 — Webapp
cd webapp && npm run dev                          # http://localhost:3000

# Terminal 2 — Tunnel (Alpic CLI)
cd mcp-server-alpic && alpic tunnel --port 3001    # Copy the public URL

# Terminal 3 — MCP Server (set MCP_SERVER_URL in .env first)
cd mcp-server-alpic && npm run dev                # http://localhost:3001
```

### 5. Connect to ChatGPT

1. Go to **ChatGPT > Settings > Apps > Add MCP App**
2. Set a name (e.g. `digital-twin`)
3. Paste your tunnel URL + `/mcp` as the server URL
4. Set authentication to **OAuth**
5. Sign in with your Supabase credentials
6. Open a **new chat** and start talking to your Twin

## Project Structure

```
DigitalTwin/
├── mcp-server-alpic/
│   ├── index.ts                    # Server entry + 12 tools + OAuth
│   ├── server/src/
│   │   ├── services/
│   │   │   ├── memory.ts           # Memory CRUD with deduplication
│   │   │   ├── agent-engine.ts     # Cross-user Twin queries via Claude
│   │   │   ├── plan-engine.ts      # Collaborative planning + web search
│   │   │   ├── plan-storage.ts     # Plan persistence
│   │   │   ├── calendar-service.ts # Google Calendar integration
│   │   │   └── ...
│   │   └── types.ts
│   └── web/src/widgets/
│       ├── agent-selector.tsx      # Agent team builder widget
│       └── notifications.tsx       # Notifications card widget
├── webapp/
│   └── src/app/
│       ├── (auth)/login/           # Auth page
│       ├── (dashboard)/            # Dashboard, Twin, Network, Plans, Settings
│       ├── oauth/consent/          # OAuth consent screen for MCP
│       └── api/                    # REST endpoints
└── supabase/
    └── migrations/                 # 11 migrations: schema + pgvector + RLS
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **ChatGPT-first** | The webapp is admin; ChatGPT is where users live |
| **Human connections only** | Friend requests are user-initiated; agents talk only after acceptance |
| **pgvector** | Semantic search in-database, no external vector service |
| **95% cosine dedup** | Prevents duplicate memories automatically |
| **Web search in plans** | Agents use Anthropic's `web_search` tool for current recommendations |
| **Parallel agents** | `Promise.all` for plan contributions (~2x faster) |
| **Per-user calendar** | Each user connects their own Google Calendar; agents access only their owner's |
| **SECURITY DEFINER** | Cross-user operations use Postgres security definer functions |

## Deploy

```bash
# Build for production
cd mcp-server-alpic && npm run build

# Deploy to Alpic Cloud
cd mcp-server-alpic && npm run deploy
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with Claude API, Supabase, Next.js & Alpic<br/>
  <sub>Made by <a href="https://github.com/nicolotognoni">Nicolo Tognoni</a></sub>
</p>
