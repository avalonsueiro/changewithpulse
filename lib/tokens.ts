import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Confirmation and unsubscribe links are bearer credentials: whoever holds the
 * token can act on that address. So we store only the SHA-256 hash and email
 * the raw value. A database dump therefore cannot confirm or unsubscribe
 * anyone. 32 bytes of entropy makes guessing infeasible; hashing is a single
 * fast digest (not bcrypt) because the input is already high-entropy — key
 * stretching only buys anything against low-entropy secrets like passwords.
 */
export function createToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * IP addresses are personal data under GDPR, and we only need them to rate
 * limit. Hashing with a server-side salt keeps the rate limiter working while
 * making the stored value non-reversible. Without IP_HASH_SALT the digest
 * would be trivially reversible by rainbow table — the v4 space is small
 * enough to enumerate.
 */
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/** Constant-time compare for two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}
