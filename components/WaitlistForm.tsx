"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Status = "idle" | "loading" | "error" | "success";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

/** Carries campaign attribution from the landing URL into the signup row. */
function readUtm(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return utm;
}

export default function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [duplicate, setDuplicate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const honeyRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inputRef.current?.value.trim() ?? "";

    if (honeyRef.current?.value) {
      setStatus("success");
      return;
    }
    if (!EMAIL.test(email)) {
      setStatus("error");
      setMessage("Enter a valid email.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "hero",
          // Sent so the server can reject bots that post the form directly,
          // rather than relying on the client-side check above alone.
          company_website: honeyRef.current?.value ?? "",
          utm: readUtm(),
        }),
      });
      if (res.status === 409) {
        setDuplicate(true);
        setStatus("success");
      } else if (res.ok) {
        setDuplicate(false);
        setStatus("success");
      } else if (res.status === 429) {
        setStatus("error");
        setMessage("Too many attempts. Try again in a few minutes.");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: 48,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--sage)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
            <path
              d="M4.5 11.5 9 16 17.5 6.5"
              stroke="#3D4A22"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span style={{ fontSize: 15, color: "#FAFAF8" }}>
          {duplicate
            ? "You are already on the list."
            : "You are on the list. We will email you when access opens."}
        </span>
      </div>
    );
  }

  const loading = status === "loading";

  return (
    <form
      onSubmit={submit}
      noValidate
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        width: "100%",
        maxWidth: 460,
      }}
    >
      <label
        htmlFor="hero-email"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      >
        Email
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          background: "#FFFFFF",
          border: `1px solid ${status === "error" ? "#A03B2E" : "#DDDBD4"}`,
          borderRadius: 999,
          padding: "5px 5px 5px 6px",
          boxShadow: "0 1px 2px rgba(15,15,13,0.04)",
        }}
      >
        <input
          id="hero-email"
          ref={inputRef}
          type="email"
          placeholder="Email"
          autoComplete="email"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "11px 16px",
            fontFamily: "var(--font-jost), sans-serif",
            fontSize: 14.5,
            color: "var(--ink)",
            minWidth: 0,
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--olive)",
            color: "#FAFAF8",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            borderRadius: 999,
            padding: "12px 22px",
            fontFamily: "var(--font-jost), sans-serif",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "0.06em",
            transition: "background 0.2s ease",
          }}
        >
          Join the Waitlist
          {loading ? (
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ animation: "spin 0.8s linear infinite" }}
            >
              <circle
                cx="7"
                cy="7"
                r="5.5"
                stroke="#FAFAF8"
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
              <path
                d="M12.5 7A5.5 5.5 0 0 0 7 1.5"
                stroke="#FAFAF8"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h9M8 3.5 11.5 7 8 10.5"
                stroke="#FAFAF8"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* honeypot */}
      <input
        ref={honeyRef}
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }}
      />

      {status === "error" ? (
        <span role="alert" style={{ fontSize: 13, color: "#FFC9C0" }}>
          {message}
        </span>
      ) : null}

      {/*
        Consent has to be visible at the point of collection to mean anything,
        so this sits with the field rather than being buried in the footer. It
        states the purpose, the frequency, and the way out — the three things
        that make consent informed.
      */}
      <p className="hero-consent">
        We will email you once to confirm, then only when access opens.
        Unsubscribe any time. See our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </form>
  );
}
