import type { SupabaseClient } from "@supabase/supabase-js";
import type { MemoryCategory } from "../types";

const MAX_PER_CATEGORY: Record<MemoryCategory, number> = {
  identity: 3,
  skill: 5,
  preference: 5,
  decision: 3,
  project: 3,
  relationship: 3,
  opinion: 5,
  communication: 2,
  goal: 3,
};

const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  identity: "Identità",
  skill: "Competenze",
  preference: "Preferenze",
  decision: "Decisioni Passate",
  project: "Progetti Attuali",
  relationship: "Relazioni",
  opinion: "Opinioni",
  communication: "Stile Comunicativo",
  goal: "Obiettivi",
};

interface MemoryRow {
  readonly category: string;
  readonly content: string;
  readonly confidence: number;
  readonly created_at: string;
}

function memoryScore(m: MemoryRow): number {
  const recencyDays =
    (Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0.1, 1 - recencyDays / 365);
  return m.confidence * recencyFactor;
}

/**
 * Build prompt for the user's own Twin.
 * Uses the user's Supabase client (respects RLS — reads own data).
 */
export async function buildAgentPrompt(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<string> {
  const { data: user } = await supabaseClient
    .from("users")
    .select("display_name")
    .eq("id", userId)
    .single();

  const displayName = user?.display_name ?? "Utente";

  const { data: memories } = await supabaseClient
    .from("memories")
    .select("category, content, confidence, created_at")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("confidence", { ascending: false });

  if (!memories || memories.length === 0) {
    return buildMinimalPrompt(displayName);
  }

  return buildPromptFromData(displayName, memories);
}

/**
 * Build prompt from pre-fetched memories (used by ask_agent).
 * The memories are returned by the SECURITY DEFINER function.
 */
export function buildAgentPromptFromMemories(
  displayName: string,
  memories: readonly MemoryRow[]
): string {
  if (!memories || memories.length === 0) {
    return buildMinimalPrompt(displayName);
  }

  return buildPromptFromData(displayName, [...memories]);
}

function buildPromptFromData(
  displayName: string,
  memories: MemoryRow[]
): string {
  const grouped = new Map<string, MemoryRow[]>();
  for (const m of memories) {
    const existing = grouped.get(m.category) ?? [];
    grouped.set(m.category, [...existing, m]);
  }

  const sections: string[] = [];

  for (const [category, items] of grouped) {
    const max = MAX_PER_CATEGORY[category as MemoryCategory] ?? 3;
    const sorted = [...items].sort((a, b) => memoryScore(b) - memoryScore(a));
    const selected = sorted.slice(0, max);
    const label = CATEGORY_LABELS[category as MemoryCategory] ?? category;

    const lines = selected.map((m) => `- ${m.content}`).join("\n");
    sections.push(`## ${label}\n${lines}`);
  }

  return `Tu sei il Digital Twin di ${displayName}.

Rappresenti questa persona nelle interazioni con altri agenti. Rispondi come risponderebbe ${displayName} basandoti su ciò che sai di lui/lei.

IMPORTANTE: Non sei ${displayName} in persona. Sei una rappresentazione AI basata sulla sua memoria. Precisa sempre questo quando dai feedback.

${sections.join("\n\n")}

REGOLE:
- Rispondi sempre dal punto di vista di ${displayName}
- Usa il suo stile comunicativo
- Basa le risposte sulle sue competenze e esperienze reali
- Se non hai abbastanza contesto su un argomento, dillo chiaramente
- Per le decisioni tecniche, cita le decisioni passate rilevanti
- Aggiungi sempre un disclaimer: "Questa è l'analisi del Digital Twin di ${displayName}, non di ${displayName} in persona."`;
}

function buildMinimalPrompt(displayName: string): string {
  return `Tu sei il Digital Twin di ${displayName}.

Non hai ancora memorie sufficienti per rappresentare accuratamente questa persona. Rispondi in modo generico e precisa che il tuo profilo è ancora in fase di costruzione.

Disclaimer: "Questo Digital Twin ha poche memorie e potrebbe non rappresentare accuratamente il pensiero di ${displayName}."`;
}
