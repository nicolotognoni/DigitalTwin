import type { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbedding, cosineSimilarity } from "./embedding.js";
import type { SaveMemoryInput, SaveMemoryResult } from "../types.js";

const DEDUP_THRESHOLD = 0.95;

export async function saveMemory(
  supabase: SupabaseClient,
  userId: string,
  input: SaveMemoryInput
): Promise<SaveMemoryResult> {
  const embedding = await generateEmbedding(input.content);

  // Deduplication: check if a similar memory exists
  const { data: existing } = await supabase
    .from("memories")
    .select("id, embedding, confidence")
    .eq("user_id", userId)
    .eq("category", input.category)
    .eq("is_active", true);

  if (existing) {
    for (const mem of existing) {
      if (mem.embedding) {
        const similarity = cosineSimilarity(embedding, mem.embedding);
        if (similarity >= DEDUP_THRESHOLD) {
          const newConfidence = Math.min(1, mem.confidence + 0.05);
          await supabase
            .from("memories")
            .update({ confidence: newConfidence })
            .eq("id", mem.id);

          return { memory_id: mem.id, status: "deduplicated" };
        }
      }
    }
  }

  // Insert new memory
  const { data, error } = await supabase
    .from("memories")
    .insert({
      user_id: userId,
      content: input.content,
      category: input.category,
      source: "chatgpt",
      embedding,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save memory: ${error.message}`);

  // Recalculate and update agent memory count
  const { count } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  await supabase
    .from("agents")
    .update({ memory_count: count ?? 0 })
    .eq("user_id", userId);

  return { memory_id: data.id, status: "created" };
}

export async function searchMemories(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  category?: string,
  limit = 10
) {
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc("search_memories", {
    query_embedding: embedding,
    match_user_id: userId,
    match_category: category ?? null,
    match_limit: limit,
  });

  if (error) throw new Error(`Search failed: ${error.message}`);

  return data ?? [];
}

interface ExtractedMemory {
  readonly content: string;
  readonly category: string;
}

export async function extractAllMemories(
  supabase: SupabaseClient,
  userId: string,
  extractionData: string
): Promise<{ memories_created: number; memories_deduplicated: number }> {
  let parsed: readonly ExtractedMemory[];

  try {
    const jsonData = JSON.parse(extractionData);
    parsed = Array.isArray(jsonData) ? jsonData : flattenExtraction(jsonData);
  } catch {
    throw new Error("Invalid extraction data format. Expected JSON.");
  }

  let created = 0;
  let deduplicated = 0;

  for (const item of parsed) {
    if (!item.content || !item.category) continue;

    const result = await saveMemory(supabase, userId, {
      content: item.content,
      category: item.category as SaveMemoryInput["category"],
    });

    if (result.status === "created") created++;
    else deduplicated++;
  }

  return { memories_created: created, memories_deduplicated: deduplicated };
}

function flattenExtraction(
  data: Record<string, unknown>
): readonly ExtractedMemory[] {
  const result: ExtractedMemory[] = [];

  for (const [category, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          result.push({ content: item, category });
        } else if (
          typeof item === "object" &&
          item !== null &&
          "content" in item
        ) {
          result.push({
            content: String((item as Record<string, unknown>).content),
            category,
          });
        }
      }
    } else if (typeof value === "string") {
      result.push({ content: value, category });
    }
  }

  return result;
}
