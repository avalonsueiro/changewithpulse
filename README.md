# Pulse — changewithpulse

Landing page and waitlist infrastructure for Pulse. A single hero screen over
video, plus everything needed to actually keep a mailing list: durable storage,
double opt-in, deduplication, one-click unsubscribe, an admin dashboard and CSV
export.

Next.js 15 (App Router) · React 19 · TypeScript · Supabase Postgres · Resend

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in the values described below
npm run dev
```

Open http://localhost:3000. The admin dashboard is at `/admin`.

Without `RESEND_API_KEY` the app still runs end to end — confirmation links are
printed to the server console instead of emailed.

## Database

Run `supabase/migrations/0001_signups.sql` against your project (Supabase
dashboard → SQL Editor, or `supabase db push` with the CLI).

It creates one table, `public.signups`:

| Column | Notes |
| --- | --- |
| `email` | Unique on `lower(email)` — case-insensitive dedup |
| `status` | `pending` → `confirmed`, or `unsubscribed` |
| `source`, `referrer`, `utm` | Attribution captured at signup |
| `confirm_token_hash` | SHA-256; nulled once spent (single use) |
| `unsubscribe_token_hash` | SHA-256; long-lived, every email carries it |
| `ip_hash` | Salted SHA-256, for rate limiting. Never a raw address |
| `created_at`, `confirmed_at` | Timestamps |

Row-level security is **on with no policies**, so the `anon` and
`authenticated` roles can read nothing. All access goes through the
service-role key from server-only route handlers.

## Environment

See `.env.example` for the annotated list. In short:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side DB access. Never expose |
| `NEXT_PUBLIC_SITE_URL` | production | Origin for confirm/unsubscribe links |
| `RESEND_API_KEY` | to send mail | Omit and links go to the console |
| `EMAIL_FROM` | to send mail | Must be a Resend-verified domain |
| `ADMIN_USER` / `ADMIN_PASSWORD` | yes | Guards `/admin`. Unset = locked |
| `IP_HASH_SALT` | yes | `openssl rand -hex 32` |

## How signup works

1. Visitor submits the hero form → `POST /api/waitlist`.
2. Honeypot, format check, then a per-IP rate limit (5 per 10 minutes).
3. Row inserted as `pending`; a 32-byte confirm token is generated, **hashed
   for storage**, and the raw value emailed.
4. Visitor clicks the link → `GET /api/confirm` → status becomes `confirmed`
   and the token is spent. Clicking again is harmless.
5. Every email carries a `List-Unsubscribe` header and footer link →
   `/api/unsubscribe` (GET and POST, for RFC 8058 one-click).

Response codes from `/api/waitlist`: `201` new · `409` already known ·
`400` invalid · `429` rate limited · `503` storage unconfigured.

**Only `confirmed` addresses should ever be mailed.** Filter the dashboard to
Confirmed, or export with `?status=confirmed`, before importing anywhere.

## Admin

`/admin` is behind HTTP Basic auth, enforced in **two independent places**:
`middleware.ts` and again inside the page and export handler
(`lib/admin-auth.ts`). That redundancy is deliberate — CVE-2025-29927 allowed a
crafted header to skip Next.js middleware entirely, and any app whose only
authorization check lived there was fully exposed. This project pins a patched
Next, *and* does not depend on middleware being the sole gate.

The CSV export omits token hashes, `ip_hash` and `user_agent`: a spreadsheet
should carry the mailing list, not the security material.

## Deploying to Vercel

1. Import the repo.
2. Add every variable from the table above. Set `NEXT_PUBLIC_SITE_URL` to the
   production origin so preview deploys do not mail links pointing at
   themselves.
3. Deploy. `public/hero.mp4` (37 MB) is committed to the repo and served as a
   static asset.

## Hero video

`public/hero.mp4` — 1920×1080, 60s, H.264, no audio, `faststart`, CRF 24.
Re-encode from a new source with:

```bash
ffmpeg -i source.mov -an -c:v libx264 -crf 24 -preset slow \
  -profile:v high -level 4.0 -pix_fmt yuv420p -g 48 \
  -movflags +faststart public/hero.mp4
ffmpeg -ss 2 -i source.mov -frames:v 1 -vf scale=1600:-2 -q:v 6 \
  -update 1 public/hero-poster.jpg
```

The poster is painted as the frame's CSS background, so it is what shows before
the video loads and what remains under `prefers-reduced-motion: reduce` — where
the video is hidden and never downloaded.

## Not included

Deliberately out of scope for this pass: the marketing sections below the hero
(problem, how it works, features, FAQ, footer) and privacy/terms pages. If you
collect email from the EU or UK, a privacy page and a consent line under the
form are worth adding — the unsubscribe flow and IP hashing are already in
place to support that.

## Structure

```
app/
  page.tsx                    hero
  admin/page.tsx              dashboard (Basic auth)
  confirmed/, unsubscribed/   post-click screens
  api/waitlist/               POST signup
  api/confirm/                GET confirm token
  api/unsubscribe/            GET + POST unsubscribe token
  api/admin/export/           CSV
components/                   Hero, WaitlistForm, ResultScreen
lib/                          supabase, tokens, email, rate-limit,
                              validation, admin-auth
middleware.ts                 Basic auth over /admin and /api/admin
supabase/migrations/          schema
```
