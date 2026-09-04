import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/email";
import { supabaseAdmin, type Signup } from "@/lib/supabase";
import { hashToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Completes the double opt-in. Idempotent: clicking a second time still lands
 * on /confirmed rather than an error, because mail clients pre-fetch links and
 * people re-click them.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const base = siteUrl();

  if (!token) {
    return NextResponse.redirect(`${base}/confirmed?state=invalid`, 302);
  }

  let db;
  try {
    db = supabaseAdmin();
  } catch {
    return NextResponse.redirect(`${base}/confirmed?state=error`, 302);
  }

  // Looked up by hash — the raw token from the URL is never compared against
  // anything stored, and never itself stored.
  const { data, error } = await db
    .from("signups")
    .select("id, status")
    .eq("confirm_token_hash", hashToken(token))
    .maybeSingle<Pick<Signup, "id" | "status">>();

  if (error) {
    console.error("[pulse] Confirm lookup failed:", error.message);
    return NextResponse.redirect(`${base}/confirmed?state=error`, 302);
  }

  if (!data) {
    // No row: either a bad token, or a good one already spent (we null the
    // hash on success). We cannot distinguish the two, and "already confirmed"
    // is by far the likelier case for a link that was just clicked.
    return NextResponse.redirect(`${base}/confirmed?state=already`, 302);
  }

  if (data.status === "unsubscribed") {
    return NextResponse.redirect(`${base}/confirmed?state=unsubscribed`, 302);
  }

  const { error: updateError } = await db
    .from("signups")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      // Single-use: spend the token so a leaked link cannot be replayed.
      confirm_token_hash: null,
    })
    .eq("id", data.id);

  if (updateError) {
    console.error("[pulse] Confirm update failed:", updateError.message);
    return NextResponse.redirect(`${base}/confirmed?state=error`, 302);
  }

  return NextResponse.redirect(`${base}/confirmed?state=ok`, 302);
}
