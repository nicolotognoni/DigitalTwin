import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).trim(),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({ data: profile });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { display_name } = parsed.data;

  // Update users table
  const { error: userError } = await supabase
    .from("users")
    .update({ display_name })
    .eq("id", user.id);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Also update the agent's display_name to keep them in sync
  await supabase
    .from("agents")
    .update({ display_name })
    .eq("user_id", user.id);

  return NextResponse.json({ data: { display_name } });
}
