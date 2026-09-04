import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS, so it must never be imported from a
 * client component — the "server-only" import above turns that into a build
 * error rather than a leaked key.
 */
let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export type SignupStatus = "pending" | "confirmed" | "unsubscribed";

export type Signup = {
  id: string;
  email: string;
  status: SignupStatus;
  source: string | null;
  referrer: string | null;
  utm: Record<string, string> | null;
  confirm_token_hash: string | null;
  confirm_sent_at: string | null;
  confirmed_at: string | null;
  unsubscribe_token_hash: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
};
