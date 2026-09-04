import "server-only";

import { supabaseAdmin } from "./supabase";

const WINDOW_MINUTES = 10;
const MAX_PER_WINDOW = 5;

/**
 * Postgres-backed rate limit, counting recent rows by hashed IP. Chosen over
 * Redis/Upstash because it adds no service to operate; the cost is one indexed
 * count per submit, served by signups_ip_hash_recent_idx.
 *
 * The limit is per-IP, so it slows bulk list-stuffing rather than stopping a
 * distributed one. That is the right ceiling for a waitlist: combined with the
 * honeypot and double opt-in, unconfirmed junk never reaches the mailing list.
 */
export async function isRateLimited(ipHash: string | null): Promise<boolean> {
  if (!ipHash) return false;

  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();

  const { count, error } = await supabaseAdmin()
    .from("signups")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) {
    // Fail open. A rate limiter that 500s during a database blip would reject
    // legitimate signups, which is a worse outcome than briefly allowing a
    // burst that the honeypot and opt-in still have to get past.
    console.error("[pulse] Rate-limit lookup failed, allowing:", error.message);
    return false;
  }

  return (count ?? 0) >= MAX_PER_WINDOW;
}

/**
 * Best-effort client IP. Vercel and most proxies set x-forwarded-for; the
 * left-most entry is the original client. Falls back to null locally, which
 * disables rate limiting in development rather than bucketing everyone
 * together under one key.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? null;
}
