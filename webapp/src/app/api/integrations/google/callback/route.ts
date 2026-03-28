import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { google } from "googleapis";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const REDIRECT_URI =
  process.env.NEXT_PUBLIC_APP_URL + "/api/integrations/google/callback";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // user_id

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?error=missing_params", request.url)
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    const supabase = await createClient();

    // Upsert integration
    const { error } = await supabase.from("user_integrations").upsert(
      {
        user_id: state,
        provider: "google_calendar",
        access_token: tokens.access_token ?? "",
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        scopes: tokens.scope ? tokens.scope.split(" ") : [],
      },
      { onConflict: "user_id,provider" }
    );

    if (error) {
      return NextResponse.redirect(
        new URL("/settings?error=save_failed", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/settings?success=google_connected", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/settings?error=token_exchange_failed", request.url)
    );
  }
}
