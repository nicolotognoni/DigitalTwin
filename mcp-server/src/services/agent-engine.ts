import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAgentPromptFromMemories } from "./prompt-builder";
import type { AskAgentResult, AskAgentError } from "../types";
import { createNotification } from "./notification-service";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const RATE_LIMIT_PER_DAY = Infinity; // No rate limit for now
const MIN_MEMORIES_THRESHOLD = 5;

/**
 * Ask another user's Digital Twin a question.
 * Uses SECURITY DEFINER functions for cross-user data access.
 * The supabaseClient is authenticated as the requesting user.
 */
export async function askAgent(
  supabaseClient: SupabaseClient,
  requesterId: string,
  targetDisplayName: string,
  question: string,
  context?: string
): Promise<AskAgentResult | AskAgentError> {
  // 1. Rate limit check via SECURITY DEFINER function
  const { data: rateCount } = await supabaseClient.rpc(
    "get_ask_agent_count_today",
    { p_user_id: requesterId }
  );

  if ((rateCount ?? 0) >= RATE_LIMIT_PER_DAY) {
    return {
      error: "rate_limited",
      message: `Hai raggiunto il limite di ${RATE_LIMIT_PER_DAY} interazioni/giorno con altri Twin.`,
    };
  }

  // 2. Get target's agent data via SECURITY DEFINER function
  const { data: agentData, error: agentError } = await supabaseClient.rpc(
    "get_connected_agent_data",
    {
      p_requester_id: requesterId,
      p_target_display_name: targetDisplayName,
    }
  );

  if (agentError) {
    return {
      error: "api_error",
      message: `Errore nel recupero dati: ${agentError.message}`,
    };
  }

  if (agentData?.error === "user_not_found") {
    return {
      error: "user_not_found",
      message: `Nessun utente trovato con il nome "${targetDisplayName}".`,
    };
  }

  if (agentData?.error === "not_connected") {
    return {
      error: "not_connected",
      message:
        "Non sei connesso a questo utente. Invia una richiesta di connessione dalla webapp.",
    };
  }

  const memoryCount = agentData.memory_count ?? 0;

  if (memoryCount < MIN_MEMORIES_THRESHOLD) {
    return {
      error: "twin_empty",
      message: `Il Twin di ${agentData.target_display_name} non ha ancora memorie sufficienti per dare un feedback utile (${memoryCount} memorie).`,
    };
  }

  // 3. Build prompt from memories returned by the function
  const systemPrompt = buildAgentPromptFromMemories(
    agentData.target_display_name,
    agentData.memories
  );

  const userMessage = `Un utente connesso ti chiede:

${question}

${context ? `\nContesto fornito:\n${context}` : ""}

Analizza dal punto di vista di ${agentData.target_display_name} e dai un feedback dettagliato.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // 4. Log interaction via SECURITY DEFINER function
    await supabaseClient.rpc("log_agent_interaction", {
      p_agent_user_id: requesterId,
      p_action: "ask_agent",
      p_target_user_id: agentData.target_user_id,
      p_details: { question, has_context: !!context },
    });

    // 5. Create notification for target user
    await createNotification(
      supabaseClient,
      agentData.target_user_id,
      "agent_interaction",
      `Qualcuno ha parlato con il tuo Twin`,
      `Domanda: "${question.slice(0, 100)}${question.length > 100 ? "..." : ""}"`,
      { requester_id: requesterId }
    ).catch(() => { /* non-blocking */ });

    return {
      agent_name: agentData.target_display_name,
      response: responseText,
      disclaimer: `Questa è l'analisi del Digital Twin di ${agentData.target_display_name}. Non rappresenta necessariamente il pensiero attuale della persona.`,
      confidence: Math.min(1, memoryCount / 50),
      memory_count: memoryCount,
    };
  } catch {
    return {
      error: "api_error",
      message: "Errore temporaneo nella generazione della risposta. Riprova.",
    };
  }
}
