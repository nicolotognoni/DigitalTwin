import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchMemoriesSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = searchMemoriesSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { query, category, limit } = parsed.data;

  const embedding = await generateEmbedding(query);

  if (!embedding) {
    // Fallback: text search if no embedding available
    let dbQuery = supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .ilike("content", `%${query}%`)
      .limit(limit);

    if (category) {
      dbQuery = dbQuery.eq("category", category);
    }

    const { data, error } = await dbQuery;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      results: data ?? [],
      search_type: "text",
    });
  }

  // Semantic search via pgvector
  const { data, error } = await supabase.rpc("search_memories", {
    query_embedding: embedding,
    match_user_id: user.id,
    match_category: category ?? null,
    match_limit: limit,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    results: data ?? [],
    search_type: "semantic",
  });
}
