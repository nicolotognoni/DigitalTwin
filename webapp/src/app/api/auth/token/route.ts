import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * DEV ONLY — returns the current user's access token for MCP testing.
 * Remove this endpoint before deploying to production.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  return NextResponse.json({
    access_token: session.access_token,
    user_id: session.user.id,
    email: session.user.email,
    expires_at: session.expires_at,
  });
}
