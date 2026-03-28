import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

export { supabaseUrl, supabaseAnonKey };

/**
 * Create a Supabase client authenticated as a specific user.
 * Uses the user's JWT from OAuth — respects RLS policies.
 */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}

/**
 * Anonymous Supabase client — for operations that don't need auth.
 */
export const supabaseAnon = createClient(supabaseUrl!, supabaseAnonKey!);
