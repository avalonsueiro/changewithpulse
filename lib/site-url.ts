/**
 * Resolves the site's absolute origin.
 *
 * This exists because getting it wrong breaks the build. An earlier version
 * used `process.env.NEXT_PUBLIC_SITE_URL ?? fallback`, and `??` only falls
 * back on null/undefined — NOT on "". A platform env var that exists but is
 * empty (easy to do: add the key in a dashboard, leave the value blank) then
 * produced `new URL("")`, which throws ERR_INVALID_URL during page-data
 * collection and fails the whole deploy.
 *
 * So: every branch below is defensive on purpose, and this function must
 * never throw. A misconfigured origin should degrade to localhost and be
 * loudly wrong at runtime, not take the build down.
 */

const FALLBACK = "http://localhost:3000";

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Accepts "example.com" as well as "https://example.com". */
function withProtocol(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalize(value: string): string | null {
  if (!value) return null;
  const candidate = withProtocol(value).replace(/\/+$/, "");
  try {
    const url = new URL(candidate);
    // Reject things that parse but are not usable origins, e.g. "https://".
    if (!url.hostname) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function siteUrl(): string {
  // Explicit configuration wins.
  const configured = normalize(clean(process.env.NEXT_PUBLIC_SITE_URL));
  if (configured) return configured;

  // Vercel sets this per-deployment. It has no protocol, hence withProtocol().
  const vercel = normalize(clean(process.env.VERCEL_URL));
  if (vercel) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[pulse] NEXT_PUBLIC_SITE_URL is unset or empty — falling back to VERCEL_URL. " +
          "Set it explicitly, or preview deploys will email links pointing at themselves.",
      );
    }
    return vercel;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[pulse] No usable site URL configured; using ${FALLBACK}. ` +
        "Confirmation links will be unusable until NEXT_PUBLIC_SITE_URL is set.",
    );
  }
  return FALLBACK;
}
