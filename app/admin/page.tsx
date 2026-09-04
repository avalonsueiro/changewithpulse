import { headers } from "next/headers";

import { isAuthorized } from "@/lib/admin-auth";
import { isSupabaseConfigured, supabaseAdmin, type Signup } from "@/lib/supabase";

// Counts must never be served from the full route cache — a dashboard showing
// yesterday's numbers is worse than no dashboard.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type SearchParams = { page?: string; status?: string };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Redundant with middleware.ts on purpose — see lib/admin-auth.ts. A page
  // cannot set a 401 status, so this renders a notice instead of the list;
  // middleware is what produces the browser's credential prompt.
  if (!isAuthorized(await headers())) {
    return (
      <Shell>
        <Notice>Not authorized.</Notice>
      </Shell>
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <Shell>
        <Notice>
          Supabase is not configured. Set <Code>SUPABASE_URL</Code> and{" "}
          <Code>SUPABASE_SERVICE_ROLE_KEY</Code>, then reload.
        </Notice>
      </Shell>
    );
  }

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filter =
    params.status && ["pending", "confirmed", "unsubscribed"].includes(params.status)
      ? params.status
      : null;

  const db = supabaseAdmin();

  // head:true fetches the count without transferring any rows.
  const countFor = (status?: string) => {
    const q = db.from("signups").select("id", { count: "exact", head: true });
    return status ? q.eq("status", status) : q;
  };

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [total, confirmed, pending, unsubscribed, lastWeek] = await Promise.all([
    countFor(),
    countFor("confirmed"),
    countFor("pending"),
    countFor("unsubscribed"),
    db
      .from("signups")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgo),
  ]);

  let listQuery = db
    .from("signups")
    .select("id, email, status, source, created_at, confirmed_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filter) listQuery = listQuery.eq("status", filter);

  const { data: rows, count: filteredCount, error } = await listQuery.returns<
    Pick<
      Signup,
      "id" | "email" | "status" | "source" | "created_at" | "confirmed_at"
    >[]
  >();

  if (error) {
    return (
      <Shell>
        <Notice>Could not load signups: {error.message}</Notice>
      </Shell>
    );
  }

  const pageCount = Math.max(1, Math.ceil((filteredCount ?? 0) / PAGE_SIZE));
  const exportHref = filter
    ? `/api/admin/export?status=${filter}`
    : "/api/admin/export";

  return (
    <Shell>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "var(--font-instrument-serif), serif",
              fontWeight: 400,
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Waitlist
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#6E6C65" }}>
            Every address collected by the Pulse landing page.
          </p>
        </div>
        <a
          href={exportHref}
          style={{
            background: "var(--olive)",
            color: "#FAFAF8",
            textDecoration: "none",
            borderRadius: 999,
            padding: "12px 22px",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.06em",
            whiteSpace: "nowrap",
          }}
        >
          Download CSV
        </a>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <Stat label="Total" value={total.count} />
        <Stat label="Confirmed" value={confirmed.count} accent />
        <Stat label="Awaiting confirmation" value={pending.count} />
        <Stat label="Unsubscribed" value={unsubscribed.count} />
        <Stat label="Last 7 days" value={lastWeek.count} />
      </div>

      <nav
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}
      >
        <Filter label="All" href="/admin" active={!filter} />
        <Filter
          label="Confirmed"
          href="/admin?status=confirmed"
          active={filter === "confirmed"}
        />
        <Filter
          label="Pending"
          href="/admin?status=pending"
          active={filter === "pending"}
        />
        <Filter
          label="Unsubscribed"
          href="/admin?status=unsubscribed"
          active={filter === "unsubscribed"}
        />
      </nav>

      <div
        style={{
          border: "1px solid var(--line)",
          borderRadius: 12,
          overflowX: "auto",
          background: "#FFFFFF",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
            minWidth: 620,
          }}
        >
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Source</Th>
              <Th>Signed up</Th>
              <Th>Confirmed</Th>
            </tr>
          </thead>
          <tbody>
            {rows?.length ? (
              rows.map((row) => (
                <tr key={row.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <Td mono>{row.email}</Td>
                  <Td>
                    <StatusPill status={row.status} />
                  </Td>
                  <Td>{row.source ?? "—"}</Td>
                  <Td>{formatDate(row.created_at)}</Td>
                  <Td>{row.confirmed_at ? formatDate(row.confirmed_at) : "—"}</Td>
                </tr>
              ))
            ) : (
              <tr style={{ borderTop: "1px solid var(--line)" }}>
                <td
                  colSpan={5}
                  style={{ padding: "28px 16px", color: "#8A8880", textAlign: "center" }}
                >
                  No signups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            fontSize: 13,
            color: "#6E6C65",
          }}
        >
          <span>
            Page {page} of {pageCount}
          </span>
          <span style={{ display: "flex", gap: 8 }}>
            {page > 1 ? (
              <PageLink
                label="Previous"
                page={page - 1}
                status={filter}
              />
            ) : null}
            {page < pageCount ? (
              <PageLink label="Next" page={page + 1} status={filter} />
            ) : null}
          </span>
        </div>
      ) : null}
    </Shell>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 1000,
        margin: "0 auto",
        padding: "clamp(24px, 5vw, 64px) clamp(16px, 4vw, 32px)",
      }}
    >
      {children}
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "16px 18px",
        background: accent ? "var(--sage)" : "#FFFFFF",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: accent ? "#3D4A22" : "#8A8880",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-instrument-serif), serif",
          fontSize: 32,
          lineHeight: 1.1,
          marginTop: 6,
        }}
      >
        {value ?? 0}
      </div>
    </div>
  );
}

function Filter({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      style={{
        textDecoration: "none",
        borderRadius: 999,
        padding: "7px 15px",
        fontSize: 13,
        border: "1px solid",
        borderColor: active ? "var(--olive)" : "var(--line)",
        background: active ? "var(--olive)" : "#FFFFFF",
        color: active ? "#FAFAF8" : "var(--ink)",
      }}
    >
      {label}
    </a>
  );
}

function PageLink({
  label,
  page,
  status,
}: {
  label: string;
  page: number;
  status: string | null;
}) {
  const href = status
    ? `/admin?status=${status}&page=${page}`
    : `/admin?page=${page}`;
  return (
    <a
      href={href}
      style={{
        textDecoration: "none",
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: "6px 14px",
        color: "var(--ink)",
      }}
    >
      {label}
    </a>
  );
}

function StatusPill({ status }: { status: string }) {
  const palette: Record<string, { bg: string; fg: string }> = {
    confirmed: { bg: "var(--sage)", fg: "#3D4A22" },
    pending: { bg: "#F1EFE7", fg: "#8A7A3F" },
    unsubscribed: { bg: "#F4E7E4", fg: "#A03B2E" },
  };
  const { bg, fg } = palette[status] ?? { bg: "#F1EFE7", fg: "#6E6C65" };
  return (
    <span
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 12,
        letterSpacing: "0.03em",
      }}
    >
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "12px 16px",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "#8A8880",
        fontWeight: 500,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <td
      style={{
        padding: "12px 16px",
        color: "var(--ink)",
        fontFamily: mono ? "ui-monospace, SFMono-Regular, monospace" : undefined,
        fontSize: mono ? 13 : undefined,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 24,
        background: "#FFFFFF",
        fontSize: 15,
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
        fontSize: 13,
        background: "#F1EFE7",
        borderRadius: 4,
        padding: "2px 6px",
      }}
    >
      {children}
    </code>
  );
}
