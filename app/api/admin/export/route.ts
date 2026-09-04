import { NextResponse } from "next/server";

import { isAuthorized } from "@/lib/admin-auth";
import { supabaseAdmin, type Signup } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS = [
  "email",
  "status",
  "source",
  "created_at",
  "confirmed_at",
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

/**
 * CSV export of the list. Credentials are checked here as well as in
 * middleware.ts — see lib/admin-auth.ts for why that redundancy is deliberate.
 *
 * Note what is NOT exported: token hashes, ip_hash and user_agent. A CSV gets
 * mailed around and pasted into spreadsheets; it should carry the mailing list,
 * not the security material or the personal data we only kept to rate limit.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request.headers)) {
    return new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Pulse admin"' },
    });
  }

  const status = new URL(request.url).searchParams.get("status");

  let db;
  try {
    db = supabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }

  let query = db
    .from("signups")
    .select("email, status, source, created_at, confirmed_at, utm")
    .order("created_at", { ascending: false })
    .limit(50_000);

  if (status && ["pending", "confirmed", "unsubscribed"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.returns<
    Pick<
      Signup,
      "email" | "status" | "source" | "created_at" | "confirmed_at" | "utm"
    >[]
  >();

  if (error) {
    console.error("[pulse] Export failed:", error.message);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  const rows = (data ?? []).map((row) => [
    row.email,
    row.status,
    row.source ?? "",
    row.created_at,
    row.confirmed_at ?? "",
    row.utm?.utm_source ?? "",
    row.utm?.utm_medium ?? "",
    row.utm?.utm_campaign ?? "",
  ]);

  const csv = [COLUMNS, ...rows].map(toCsvLine).join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const name = status ? `pulse-signups-${status}-${stamp}` : `pulse-signups-${stamp}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function toCsvLine(fields: readonly string[]): string {
  return fields.map(escapeCsv).join(",");
}

/**
 * RFC 4180 quoting. The leading-character guard is a separate concern:
 * spreadsheets treat a field starting with = + - @ as a formula, so an address
 * like =cmd|'...'!A1 would execute on open. Prefixing a tab neutralises it
 * while leaving the value readable.
 */
function escapeCsv(value: string): string {
  let out = value ?? "";
  if (/^[=+\-@\t\r]/.test(out)) out = `\t${out}`;
  if (/[",\r\n]/.test(out)) out = `"${out.replace(/"/g, '""')}"`;
  return out;
}
