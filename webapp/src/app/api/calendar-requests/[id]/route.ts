import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// PUT: accept or decline a calendar request
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status as string;

  if (!["accepted", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Only target can accept/decline
  const { data: calRequest, error: fetchError } = await supabase
    .from("calendar_requests")
    .select("*, requester:users!requester_id(display_name, email)")
    .eq("id", id)
    .eq("target_id", user.id)
    .single();

  if (fetchError || !calRequest) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  // Update status
  const { error: updateError } = await supabase
    .from("calendar_requests")
    .update({ status })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  // Notify requester
  await supabase.rpc("create_notification", {
    p_user_id: calRequest.requester_id,
    p_type: "calendar_request",
    p_title:
      status === "accepted"
        ? `${user.email} ha accettato il meeting!`
        : `${user.email} ha rifiutato il meeting.`,
    p_body: `Meeting del ${new Date(calRequest.proposed_time).toLocaleDateString("it-IT")}`,
    p_metadata: { calendar_request_id: id, status },
  });

  return NextResponse.json({ success: true, status });
}
