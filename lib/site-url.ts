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

/**
 * SITE_URL is not prefixed with NEXT_PUBLIC_ because nothing in the browser
 * reads it — the layout uses it for metadataBase and the mailer uses it to
 * build absolute links, both server-side. The client form posts to relative
 * paths and needs no origin at all. NEXT_PUBLIC_SITE_URL is still honoured so
 * an existing deployment keeps working, but SITE_URL is the one to set.
 */
function configuredSiteUrl(): string {
  const preferred = clean(process.env.SITE_URL);
  return preferred || clean(process.env.NEXT_PUBLIC_SITE_URL);
}

/**
 * A per-deployment Vercel hostname, e.g.
 *   changewithpulse-4liy157l9-avalon-sueiros-projects.vercel.app
 * The distinguishing feature is the random deployment id between dashes. The
 * stable aliases (changewithpulse.vercel.app, a custom domain) do not have it.
 */
const DEPLOYMENT_HOST = /-[a-z0-9]{8,}-[^.]+\.vercel\.app$/i;

/**
 * True when the resolved origin is safe to put in an email — i.e. a stable
 * host a recipient can still reach tomorrow.
 *
 * Links built from a per-deployment hostname are broken on arrival when
 * Deployment Protection is on: the recipient is bounced through Vercel SSO,
 * which drops the query string, and the token never reaches the route.
 */
export function isOriginMailable(): boolean {
  try {
    return !DEPLOYMENT_HOST.test(new URL(siteUrl()).hostname);
  } catch {
    return false;
  }
}

export function siteUrl(): string {
  // Explicit configuration wins.
  const configured = normalize(configuredSiteUrl());
  if (configured) return configured;

  // The project's STABLE production domain, set by Vercel. This must be tried
  // before VERCEL_URL: it resolves to the same host users visit, whereas
  // VERCEL_URL is per-deployment.
  const production = normalize(clean(process.env.VERCEL_PROJECT_PRODUCTION_URL));
  if (production) return production;

  // Last resort. VERCEL_URL is the PER-DEPLOYMENT hostname
  // (project-a1b2c3d4e-team.vercel.app), which is a genuinely bad thing to put
  // in an email: it changes on every deploy, and when Deployment Protection is
  // enabled it sits behind Vercel SSO. A recipient clicking that link gets
  // bounced through vercel.com/sso-api, which drops the ?token= query string,
  // and the confirm route then reports the link as invalid. That is not
  // hypothetical — it happened in production and is why the check exists.
  const vercel = normalize(clean(process.env.VERCEL_URL));
  if (vercel) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[pulse] SITE_URL and VERCEL_PROJECT_PRODUCTION_URL are both unset. " +
          "Falling back to the per-deployment VERCEL_URL, which is unusable in " +
          "email: it changes every deploy and may sit behind Deployment " +
          "Protection. Set SITE_URL to your real domain.",
      );
    }
    return vercel;
  }

  if (process.env.NODE_ENV === "production") {
    console.warn(
      `[pulse] No usable site URL configured; using ${FALLBACK}. ` +
        "Confirmation links will be unusable until SITE_URL is set.",
    );
  }
  return FALLBACK;
}
