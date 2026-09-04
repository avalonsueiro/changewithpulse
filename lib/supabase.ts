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

  const url = supabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * Deliberately NOT prefixed with NEXT_PUBLIC_. This value is read only here,
 * in a server-only module — no browser code ever needs it, so there is no
 * reason to inline it into the client bundle. Supabase's own docs use the
 * public name because most apps talk to Supabase from the browser; this one
 * never does. Every query goes through the service-role key on the server,
 * which is also why the table can keep RLS on with zero policies.
 *
 * NEXT_PUBLIC_SUPABASE_URL is still accepted so an existing deployment does
 * not break the moment this ships, but SUPABASE_URL is the one to set.
 */
function supabaseUrl(): string | undefined {
  const preferred = process.env.SUPABASE_URL?.trim();
  if (preferred) return preferred;
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
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
