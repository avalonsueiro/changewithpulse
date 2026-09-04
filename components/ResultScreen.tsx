import Link from "next/link";

/**
 * Shared layout for /confirmed and /unsubscribed. Reuses the sage check mark
 * drawn inline in WaitlistForm.tsx so the moment after clicking an email link
 * looks like the moment after submitting the form.
 */
export default function ResultScreen({
  tone,
  title,
  body,
}: {
  tone: "success" | "neutral" | "error";
  title: string;
  body: string;
}) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "clamp(24px, 6vw, 64px)",
        gap: 20,
      }}
    >
      <Mark tone={tone} />
      <h1
        style={{
          fontFamily: "var(--font-instrument-serif), serif",
          fontWeight: 400,
          fontSize: "clamp(2.25rem, 6vw, 3.5rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          maxWidth: "42ch",
          fontSize: "clamp(15px, 1.3vw, 17px)",
          lineHeight: 1.7,
          color: "#4A4842",
          margin: 0,
        }}
      >
        {body}
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          textDecoration: "none",
          border: "1px solid var(--line)",
          borderRadius: 999,
          padding: "11px 24px",
          fontSize: 13,
          letterSpacing: "0.06em",
          color: "var(--ink)",
        }}
      >
        Back to Pulse
      </Link>
    </main>
  );
}

function Mark({ tone }: { tone: "success" | "neutral" | "error" }) {
  const background =
    tone === "success" ? "var(--sage)" : tone === "error" ? "#F4E7E4" : "#F1EFE7";
  const stroke =
    tone === "success" ? "#3D4A22" : tone === "error" ? "#A03B2E" : "#6E6C65";

  return (
    <span
      aria-hidden="true"
      style={{
        width: 52,
        height: 52,
        borderRadius: 999,
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
        {tone === "success" ? (
          <path
            d="M4.5 11.5 9 16 17.5 6.5"
            stroke={stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M5 11h12"
            stroke={stroke}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        )}
      </svg>
    </span>
  );
}
