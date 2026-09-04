import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { siteUrl } from "./site-url";

/**
 * Regression tests for a bug that broke a production deploy on 2026-09-04.
 *
 * app/layout.tsx resolved the origin with
 *   process.env.NEXT_PUBLIC_SITE_URL ?? fallback
 * `??` falls back only on null/undefined, never on "". The env var existed in
 * the Vercel dashboard with a blank value, so the expression produced "",
 * `new URL("")` threw ERR_INVALID_URL during page-data collection, and the
 * whole build failed — reporting `Failed to collect configuration for
 * /_not-found`, a route with nothing to do with the cause.
 *
 * The first test below is that exact bug. The rest cover the other shapes a
 * human can plausibly paste into a dashboard field.
 */

const KEYS = [
  "SITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_URL",
  "NODE_ENV",
] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("siteUrl", () => {
  it("does not return an empty string when the env var is set but blank", () => {
    // THE REGRESSION. If this ever returns "", `new URL()` in app/layout.tsx
    // throws and the deploy dies.
    process.env.SITE_URL = "";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("treats a whitespace-only value as absent", () => {
    process.env.SITE_URL = "   ";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("prefers an explicitly configured origin", () => {
    process.env.SITE_URL = "https://changewithpulse.com";
    process.env.VERCEL_URL = "preview-abc.vercel.app";
    expect(siteUrl()).toBe("https://changewithpulse.com");
  });

  it("accepts a bare domain and assumes https", () => {
    process.env.SITE_URL = "changewithpulse.com";
    expect(siteUrl()).toBe("https://changewithpulse.com");
  });

  it("strips trailing slashes so callers can concatenate paths safely", () => {
    process.env.SITE_URL = "https://changewithpulse.com///";
    expect(siteUrl()).toBe("https://changewithpulse.com");
  });

  it("falls back to VERCEL_URL when the explicit value is blank", () => {
    process.env.SITE_URL = "";
    process.env.VERCEL_URL = "preview-abc.vercel.app";
    expect(siteUrl()).toBe("https://preview-abc.vercel.app");
  });

  it("rejects a value that parses but has no hostname", () => {
    process.env.SITE_URL = "https://";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("falls back rather than throwing on unparseable input", () => {
    process.env.SITE_URL = ":://not a url";
    expect(() => siteUrl()).not.toThrow();
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("never throws for any plausible input", () => {
    // The load-bearing property: config resolution must degrade, never crash,
    // because a throw here takes the entire build down.
    const inputs = [
      "",
      "   ",
      "https://",
      "http://",
      "://",
      ":://not a url",
      "not a url at all",
      "ftp://example.com",
      "//example.com",
      "example.com",
      "https://example.com/",
      "https://example.com/path",
      "HTTPS://EXAMPLE.COM",
    ];
    for (const input of inputs) {
      process.env.SITE_URL = input;
      expect(() => siteUrl(), `input: ${JSON.stringify(input)}`).not.toThrow();
      const result = siteUrl();
      expect(result, `input: ${JSON.stringify(input)}`).toBeTruthy();
      // Whatever comes back must itself be a valid absolute URL, since
      // app/layout.tsx feeds it straight into new URL().
      expect(
        () => new URL(result),
        `result for ${JSON.stringify(input)} must parse`,
      ).not.toThrow();
    }
  });

  it("always returns something new URL() accepts, even with nothing configured", () => {
    expect(() => new URL(siteUrl())).not.toThrow();
  });

  // SITE_URL replaced NEXT_PUBLIC_SITE_URL: nothing in the browser reads it,
  // so there is no reason to inline it into the client bundle. The old name is
  // still honoured so an already-deployed project does not break the moment
  // the rename ships.
  describe("legacy NEXT_PUBLIC_SITE_URL", () => {
    it("is still honoured when SITE_URL is absent", () => {
      process.env.NEXT_PUBLIC_SITE_URL = "https://legacy.example.com";
      expect(siteUrl()).toBe("https://legacy.example.com");
    });

    it("loses to SITE_URL when both are set", () => {
      process.env.SITE_URL = "https://current.example.com";
      process.env.NEXT_PUBLIC_SITE_URL = "https://legacy.example.com";
      expect(siteUrl()).toBe("https://current.example.com");
    });

    it("is used when SITE_URL is set but blank", () => {
      // The empty-string trap again: a blank SITE_URL must not shadow a
      // perfectly good legacy value.
      process.env.SITE_URL = "";
      process.env.NEXT_PUBLIC_SITE_URL = "https://legacy.example.com";
      expect(siteUrl()).toBe("https://legacy.example.com");
    });
  });
});
