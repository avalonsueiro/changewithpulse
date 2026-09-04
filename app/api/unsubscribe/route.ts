import { NextResponse } from "next/server";

import { siteUrl } from "@/lib/email";
import { supabaseAdmin, type Signup } from "@/lib/supabase";
import { hashToken } from "@/lib/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The unsubscribe token is long-lived and NOT spent on use, unlike the confirm
 * token: every email carries the same link, and someone who unsubscribes then
 * clicks an older message must not hit a dead URL.
 */
export async function GET(request: Request) {
  return unsubscribe(new URL(request.url).searchParams.get("token"));
}

/**
 * RFC 8058 one-click unsubscribe. Mail clients POST to the List-Unsubscribe
 * header URL, so without this the header would 405 and the button would fail
 * in Gmail and Apple Mail.
 */
export async function POST(request: Request) {
  return unsubscribe(new URL(request.url).searchParams.get("token"));
}

async function unsubscribe(token: string | null) {
  const base = siteUrl();

  if (!token) {
    return NextResponse.redirect(`${base}/unsubscribed?state=invalid`, 302);
  }

  let db;
  try {
    db = supabaseAdmin();
  } catch {
    return NextResponse.redirect(`${base}/unsubscribed?state=error`, 302);
  }

  const { data, error } = await db
    .from("signups")
    .select("id, status")
    .eq("unsubscribe_token_hash", hashToken(token))
    .maybeSingle<Pick<Signup, "id" | "status">>();

  if (error) {
    console.error("[pulse] Unsubscribe lookup failed:", error.message);
    return NextResponse.redirect(`${base}/unsubscribed?state=error`, 302);
  }

  if (!data) {
    return NextResponse.redirect(`${base}/unsubscribed?state=invalid`, 302);
  }

  if (data.status === "unsubscribed") {
    return NextResponse.redirect(`${base}/unsubscribed?state=already`, 302);
  }

  const { error: updateError } = await db
    .from("signups")
    .update({ status: "unsubscribed", confirm_token_hash: null })
    .eq("id", data.id);

  if (updateError) {
    console.error("[pulse] Unsubscribe update failed:", updateError.message);
    return NextResponse.redirect(`${base}/unsubscribed?state=error`, 302);
  }

  return NextResponse.redirect(`${base}/unsubscribed?state=ok`, 302);
}
