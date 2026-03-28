import { z } from "zod";

export const memoryCategories = [
  "identity",
  "skill",
  "preference",
  "decision",
  "project",
  "relationship",
  "opinion",
  "communication",
  "goal",
] as const;

export const memorySources = [
  "chatgpt",
  "claude",
  "perplexity",
  "manual",
  "integration",
] as const;

export const createMemorySchema = z.object({
  content: z.string().min(1, "Il contenuto è obbligatorio").max(5000),
  category: z.enum(memoryCategories, { error: "Categoria non valida" }),
  source: z.enum(memorySources).optional().default("manual"),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export const updateMemorySchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  category: z.enum(memoryCategories).optional(),
  is_active: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const searchMemoriesSchema = z.object({
  query: z.string().min(1, "La query è obbligatoria").max(1000),
  category: z.enum(memoryCategories).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const createConnectionSchema = z.object({
  receiver_id: z.string().uuid("ID utente non valido"),
});

export const updateConnectionSchema = z.object({
  status: z.enum(["accepted", "rejected", "blocked"], { error: "Status non valido" }),
});
