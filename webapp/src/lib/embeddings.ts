const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate embedding for a text using OpenAI ada-002.
 * Returns null if OPENAI_API_KEY is not configured (graceful degradation).
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  if (!OPENAI_API_KEY) {
    console.warn(
      "OPENAI_API_KEY not set — skipping embedding generation. Semantic search will not work."
    );
    return null;
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Embedding generation failed:", error);
    return null;
  }

  const data = await response.json();
  return data.data[0].embedding;
}
