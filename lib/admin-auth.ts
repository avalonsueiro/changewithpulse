import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Second, independent check of the same Basic credentials that middleware.ts
 * enforces. Deliberately redundant.
 *
 * CVE-2025-29927 let a crafted x-middleware-subrequest header skip Next.js
 * middleware entirely. Any app that put its only authorization check there
 * — as the obvious design for this page would — served its protected routes
 * to anyone who knew the trick. That class of bug recurs, so the mailing list
 * and its CSV export verify credentials again at the handler, where no
 * middleware-layer bypass can reach.
 */
export function isAuthorized(headers: Headers): boolean {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  // Fail closed: unconfigured means locked, never open.
  if (!user || !password) return false;

  const header = headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  } catch {
    return false;
  }

  // First colon only — passwords may contain them.
  const separator = decoded.indexOf(":");
  if (separator <= 0) return false;

  // Both compares always run; short-circuiting would leak whether the
  // username alone was right.
  const userOk = constantTimeEqual(decoded.slice(0, separator), user);
  const passwordOk = constantTimeEqual(decoded.slice(separator + 1), password);
  return userOk && passwordOk;
}

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, which would itself be a timing
  // signal — compare each against a fixed-length digest-free padding by
  // checking length separately but still running the byte compare.
  if (bufA.length !== bufB.length) {
    // Run a compare anyway so the failure path costs roughly the same.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}
