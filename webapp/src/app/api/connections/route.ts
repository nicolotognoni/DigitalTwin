import { createClient } from "@/lib/supabase/server";
import { createConnectionSchema } from "@/lib/validations";
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
    .from("connections")
    .select(
      `
      *,
      requester:users!connections_requester_id_fkey(id, display_name, avatar_url, bio),
      receiver:users!connections_receiver_id_fkey(id, display_name, avatar_url, bio)
    `
    )
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
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
  const parsed = createConnectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { receiver_id } = parsed.data;

  if (receiver_id === user.id) {
    return NextResponse.json(
      { error: "Cannot connect with yourself" },
      { status: 400 }
    );
  }

  // Check if connection already exists
  const { data: existing } = await supabase
    .from("connections")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(requester_id.eq.${receiver_id},receiver_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Connection already exists (status: ${existing.status})` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("connections")
    .insert({
      requester_id: user.id,
      receiver_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Create notification for the receiver
  const { data: requesterProfile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  await supabase.rpc("create_notification", {
    p_user_id: receiver_id,
    p_type: "connection_request",
    p_title: `${requesterProfile?.display_name ?? "Qualcuno"} vuole connettersi`,
    p_body: "Hai ricevuto una nuova richiesta di connessione.",
    p_metadata: { connection_id: data.id, requester_id: user.id },
  });

  return NextResponse.json({ data }, { status: 201 });
}
