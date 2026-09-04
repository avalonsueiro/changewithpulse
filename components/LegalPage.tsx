import Link from "next/link";

/**
 * Shared shell for /privacy and /terms. Keeps both pages on the same measure
 * and type scale as the rest of the site without duplicating the chrome.
 */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal">
      <Link href="/" className="legal-back">
        ← Pulse
      </Link>
      <h1>{title}</h1>
      <p className="legal-updated">Last updated {updated}</p>
      {children}
    </main>
  );
}
