import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/embeddings";
import { createMemorySchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMemorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { content, category, source, metadata } = parsed.data;

  // Generate embedding for semantic search (null if OPENAI_API_KEY not set)
  const embedding = await generateEmbedding(content);

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    content,
    category,
    source,
    confidence: 0.8,
    metadata,
  };

  if (embedding) {
    insertData.embedding = embedding;
  }

  const { data, error } = await supabase
    .from("memories")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update agent memory count
  const { count } = await supabase
    .from("memories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  await supabase
    .from("agents")
    .update({ memory_count: count ?? 0 })
    .eq("user_id", user.id);

  return NextResponse.json({ data }, { status: 201 });
}
