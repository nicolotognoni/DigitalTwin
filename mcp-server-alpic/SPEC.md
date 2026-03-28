# Digital Twin — ChatGPT App

## Value Proposition

Trasforma le conversazioni con ChatGPT in un agente AI personale — un Digital Twin cognitivo. Target: utenti ChatGPT che vogliono un assistente che li conosca davvero e possa interagire con i Twin degli amici.

Pain: ChatGPT non ricorda in modo strutturato, non comunica con gli assistenti di altre persone, non pianifica in team.

**Core actions**: Salvare e cercare memorie personali, interagire con i Digital Twin degli amici, creare piani collaborativi con agenti specialisti.

## Why LLM?

**Conversational win**: "Ricordati che sono un developer React" = una frase vs navigare UI di profilo. "Chiedi a Marco se domani pomeriggio e' libero" = naturale vs aprire calendario + messaggistica.

**LLM adds**: Intent recognition per categorizzare memorie automaticamente, sintesi di contributi multipli in piani unificati, reasoning per risposte personalizzate degli agent.

**What LLM lacks**: Persistenza strutturata (Supabase), accesso calendari (Google Calendar API), rete sociale (connections), notifiche cross-user.

## UI Overview

**First view**: L'utente parla con ChatGPT normalmente. I tool del Digital Twin si attivano contestualmente.

**Key interactions**:
- Salvataggio memorie: conversazionale, nessuna UI necessaria
- Agent selector: widget visuale per scegliere agenti specialisti e amici per un piano collaborativo
- Notifiche: widget per vedere richieste di connessione, meeting, piani condivisi
- Disponibilita' calendario: conversazionale, nessuna UI necessaria

**End state**: L'utente ha un Twin che lo rappresenta, connesso con amici, capace di pianificare in team.

## Product Context

- **Existing products**: Webapp Next.js (admin/dashboard), MCP Server (questo)
- **API**: Supabase (PostgreSQL + pgvector + Auth), Claude API (agent engine), Google Calendar API
- **Auth**: Supabase Auth come OAuth provider (PKCE S256), login email/password
- **Constraints**: Skybridge framework (non mcp-use), Alpic deploy/tunnel

## UX Flows

Memorizzazione:
1. Utente condivide info personali nella conversazione
2. ChatGPT chiama save-memory o extract-all-memories
3. Conferma testuale

Ricerca memorie:
1. Utente chiede "cosa sai di me?" o "quali sono le mie skill?"
2. ChatGPT chiama search-memories con semantic search
3. Risultati testuali

Interazione con Twin amici:
1. Utente chiede feedback/opinione a un amico connesso
2. ChatGPT chiama ask-agent con nome e domanda
3. Risposta testuale dal Twin dell'amico

Pianificazione collaborativa:
1. Utente chiede di creare un piano
2. ChatGPT chiama agent-selector (widget) per mostrare agenti disponibili
3. Utente seleziona agenti e descrive il progetto nel widget
4. Widget chiama create-plan, agenti collaborano in parallelo
5. Piano unificato mostrato nel widget

Notifiche:
1. Utente chiede "novita'?"
2. ChatGPT chiama notifications (widget) per mostrare notifiche non lette

Calendario:
1. Utente chiede "Marco e' libero domani?"
2. ChatGPT chiama check-availability
3. Risultato testuale con slot liberi/occupati
4. Se vuole, chiama request-meeting per proporre incontro

## Tools and Widgets

**Widget: agent-selector**
- **Input**: nessuno (carica agenti disponibili)
- **Output**: `{ builtin_agents[], friend_agents[] }`
- **Views**: griglia agenti, textarea piano, risultato piano
- **Behavior**: gestisce selezioni e input localmente, chiama `create-plan` tool

**Widget: notifications**
- **Input**: `{ mark_as_read?: boolean }`
- **Output**: `{ notifications[] }`
- **Views**: lista notifiche con tipo, titolo, tempo

**Tool: save-memory**
- **Input**: `{ content, category, metadata? }`
- **Output**: `{ memory_id, status }`

**Tool: search-memories**
- **Input**: `{ query, category?, limit? }`
- **Output**: `{ results[], count }`

**Tool: extract-all-memories**
- **Input**: `{ extraction_prompt }`
- **Output**: `{ memories_created, memories_deduplicated }`

**Tool: ask-agent**
- **Input**: `{ target_user_display_name, question, context?, interaction_type? }`
- **Output**: `{ agent_name, response, confidence }`

**Tool: get-my-twin-status**
- **Input**: nessuno
- **Output**: `{ display_name, memory_count, connections_count, categories, status }`

**Tool: create-plan**
- **Input**: `{ plan_description, agent_ids[], plan_name?, context? }`
- **Output**: `{ plan_title, contributions[], unified_plan, saved_plan_id }`

**Tool: get-plan**
- **Input**: `{ search }`
- **Output**: piano completo o messaggio "non trovato"

**Tool: list-plans**
- **Input**: nessuno
- **Output**: `{ plans[], count }`

**Tool: check-availability**
- **Input**: `{ target_display_name, date, time_range? }`
- **Output**: `{ available, busy_slots[], summary }`

**Tool: request-meeting**
- **Input**: `{ target_display_name, proposed_time, duration_minutes?, message? }`
- **Output**: conferma con notifica inviata
