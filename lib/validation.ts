/**
 * Deliberately permissive. Fully validating an address against RFC 5322 is
 * both hard and pointless — the only proof an address exists is that someone
 * clicked the link we sent to it, which is exactly what the double opt-in
 * flow does. This just catches typos and obvious junk before we spend a send.
 *
 * Kept identical to the pattern in components/WaitlistForm.tsx so the client
 * and server never disagree about what is acceptable.
 */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const MAX_EMAIL_LENGTH = 254; // RFC 5321 path limit.

export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}

/** Lowercase and trim. The unique index is on lower(email), so this must match. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/**
 * Picks only known UTM keys, capped in length. Without the allowlist an
 * attacker could push arbitrary JSON into the row through the query string.
 */
export function pickUtm(
  input: unknown,
): Record<string, string> | null {
  if (!input || typeof input !== "object") return null;
  const source = input as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim().slice(0, 200);
    }
  }
  return Object.keys(out).length ? out : null;
}

export function clamp(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : null;
}
