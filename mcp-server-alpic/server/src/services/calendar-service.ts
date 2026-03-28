import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";

interface FreeBusySlot {
  readonly start: string;
  readonly end: string;
}

interface AvailabilityResult {
  readonly hasCalendar: boolean;
  readonly busySlots: readonly FreeBusySlot[];
  readonly freeMessage: string;
}

/**
 * Create an authenticated Google OAuth2 client from stored tokens.
 * Refreshes the token if expired.
 */
async function getGoogleClient(
  supabase: SupabaseClient,
  userId: string
) {
  const { data: integration, error } = await supabase
    .from("user_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google_calendar")
    .single();

  if (error || !integration) return null;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.token_expires_at
      ? new Date(integration.token_expires_at).getTime()
      : undefined,
  });

  // Refresh if expired
  const tokenInfo = oauth2Client.credentials;
  if (tokenInfo.expiry_date && tokenInfo.expiry_date < Date.now()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    // Save refreshed token
    await supabase
      .from("user_integrations")
      .update({
        access_token: credentials.access_token,
        token_expires_at: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      })
      .eq("user_id", userId)
      .eq("provider", "google_calendar");
  }

  return oauth2Client;
}

/**
 * Check if a user has Google Calendar connected.
 */
export async function hasCalendarIntegration(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("user_integrations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("provider", "google_calendar");

  return (count ?? 0) > 0;
}

/**
 * Check availability for a user in a time range.
 */
export async function checkAvailability(
  supabase: SupabaseClient,
  userId: string,
  timeMin: string,
  timeMax: string
): Promise<AvailabilityResult> {
  const client = await getGoogleClient(supabase, userId);
  if (!client) {
    return {
      hasCalendar: false,
      busySlots: [],
      freeMessage: "L'utente non ha collegato Google Calendar.",
    };
  }

  const calendar = google.calendar({ version: "v3", auth: client });

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: "primary" }],
    },
  });

  const busySlots: FreeBusySlot[] = (
    res.data.calendars?.primary?.busy ?? []
  ).map((slot) => ({
    start: slot.start ?? "",
    end: slot.end ?? "",
  }));

  const freeMessage =
    busySlots.length === 0
      ? "L'utente è completamente libero in questo periodo."
      : `L'utente ha ${busySlots.length} impegn${busySlots.length === 1 ? "o" : "i"} in questo periodo.`;

  return { hasCalendar: true, busySlots, freeMessage };
}

/**
 * Create a calendar event for a user.
 */
export async function createCalendarEvent(
  supabase: SupabaseClient,
  userId: string,
  event: {
    summary: string;
    startTime: string;
    endTime: string;
    attendeeEmails?: readonly string[];
    description?: string;
  }
): Promise<{ eventId: string; htmlLink: string } | null> {
  const client = await getGoogleClient(supabase, userId);
  if (!client) return null;

  const calendar = google.calendar({ version: "v3", auth: client });

  const res = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startTime },
      end: { dateTime: event.endTime },
      attendees: event.attendeeEmails?.map((email) => ({ email })),
    },
  });

  return {
    eventId: res.data.id ?? "",
    htmlLink: res.data.htmlLink ?? "",
  };
}
