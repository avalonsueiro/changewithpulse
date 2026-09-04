import { NextResponse, type NextRequest } from "next/server";

/**
 * HTTP Basic auth over the admin surface. Runs on the edge runtime, where
 * node:crypto's timingSafeEqual is unavailable — hence the hand-rolled
 * constant-time compare below.
 *
 * One shared password, no per-operator audit trail. That is the right weight
 * for a waitlist admin page; if it needs to grow, Supabase Auth magic links
 * drop in behind this same matcher.
 */
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  // Fail closed. An unset password must lock the page, never open it — the
  // opposite default would silently publish the mailing list on any deploy
  // where the env var was forgotten.
  if (!user || !password) {
    return new NextResponse(
      "Admin access is not configured. Set ADMIN_USER and ADMIN_PASSWORD.",
      { status: 503, headers: { "Content-Type": "text/plain" } },
    );
  }

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    // Split on the FIRST colon only: passwords may legitimately contain one.
    const separator = decoded.indexOf(":");
    if (separator > 0) {
      const givenUser = decoded.slice(0, separator);
      const givenPassword = decoded.slice(separator + 1);
      // Both compares always run — short-circuiting on the username would
      // leak whether it was correct via response time.
      const userOk = constantTimeEqual(givenUser, user);
      const passwordOk = constantTimeEqual(givenPassword, password);
      if (userOk && passwordOk) return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Pulse admin", charset="UTF-8"',
      "Content-Type": "text/plain",
    },
  });
}

/**
 * Compares in time proportional to the longer input rather than to the length
 * of the matching prefix. A plain === returns on the first differing byte,
 * which lets an attacker recover the password one character at a time by
 * timing responses.
 */
function constantTimeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
