import { NextResponse } from "next/server";

import { sendConfirmationEmail } from "@/lib/email";
import { clientIp, isRateLimited } from "@/lib/rate-limit";
import { supabaseAdmin, type Signup } from "@/lib/supabase";
import { createToken, hashIp } from "@/lib/tokens";
import { clamp, isValidEmail, normalizeEmail, pickUtm } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Response contract, unchanged from the original scaffold so
 * components/WaitlistForm.tsx needs no edits:
 *   201 — new signup, confirmation sent
 *   409 — address already known
 *   400 — malformed body or invalid email
 *   429 — rate limited
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Honeypot. Real users never see this field, so anything in it is a bot.
  // We return the success shape rather than an error: telling a scraper it was
  // detected just teaches it to stop filling the field.
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    return NextResponse.json({ status: "ok" }, { status: 201 });
  }

  const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const ipHash = hashIp(clientIp(request.headers));

  let db;
  try {
    db = supabaseAdmin();
  } catch (err) {
    console.error("[pulse] Supabase not configured:", err);
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  if (await isRateLimited(ipHash)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { data: existing, error: lookupError } = await db
    .from("signups")
    .select("id, status, unsubscribe_token_hash")
    .ilike("email", email)
    .maybeSingle<Pick<Signup, "id" | "status" | "unsubscribe_token_hash">>();

  if (lookupError) {
    console.error("[pulse] Signup lookup failed:", lookupError.message);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  const confirm = createToken();

  if (existing) {
    // Already confirmed, or previously unsubscribed: acknowledge and stop.
    // Re-mailing an unsubscribed address because someone typed it into the
    // form again is exactly the behaviour that gets a domain blocklisted.
    if (existing.status !== "pending") {
      return NextResponse.json({ status: "duplicate" }, { status: 409 });
    }

    // Still pending — the first email may have been lost, so issue a fresh
    // token and send again. Rotating invalidates the old link.
    const unsubscribe = createToken();
    const { error: updateError } = await db
      .from("signups")
      .update({
        confirm_token_hash: confirm.hash,
        confirm_sent_at: new Date().toISOString(),
        unsubscribe_token_hash: unsubscribe.hash,
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("[pulse] Failed to refresh token:", updateError.message);
      return NextResponse.json({ error: "Storage error" }, { status: 500 });
    }

    await sendConfirmationEmail(email, confirm.token, unsubscribe.token);
    return NextResponse.json({ status: "duplicate" }, { status: 409 });
  }

  const unsubscribe = createToken();
  const { error: insertError } = await db.from("signups").insert({
    email,
    status: "pending",
    source: clamp(body.source, 64),
    referrer: clamp(request.headers.get("referer"), 500),
    utm: pickUtm(body.utm),
    confirm_token_hash: confirm.hash,
    confirm_sent_at: new Date().toISOString(),
    unsubscribe_token_hash: unsubscribe.hash,
    ip_hash: ipHash,
    user_agent: clamp(request.headers.get("user-agent"), 500),
  });

  if (insertError) {
    // 23505 is unique_violation: two submissions of the same address raced
    // between the lookup above and this insert. The index did its job — report
    // it as the duplicate it is rather than a server error.
    if (insertError.code === "23505") {
      return NextResponse.json({ status: "duplicate" }, { status: 409 });
    }
    console.error("[pulse] Signup insert failed:", insertError.message);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  // Deliberately not awaited for its result to gate the response: the row is
  // committed, so a mail failure must not present as a failed signup.
  await sendConfirmationEmail(email, confirm.token, unsubscribe.token);

  return NextResponse.json({ status: "ok" }, { status: 201 });
}
