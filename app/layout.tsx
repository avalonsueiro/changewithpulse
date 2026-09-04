import type { Metadata } from "next";
import { Instrument_Serif, Jost } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jost",
});

const DESCRIPTION =
  "Simulate how your organization will react to a rollout before you launch it, team by team and person by person.";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  // metadataBase resolves the relative OG image below to an absolute URL.
  // Without it Next warns at build time and social cards render imageless.
  metadataBase: new URL(siteUrl),
  title: "Pulse — Change is hard.",
  description: DESCRIPTION,
  openGraph: {
    title: "Pulse — Change is hard.",
    description: DESCRIPTION,
    type: "website",
    siteName: "Pulse",
    images: [{ url: "/hero-poster.jpg", width: 1600, height: 900, alt: "Pulse" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pulse — Change is hard.",
    description: DESCRIPTION,
    images: ["/hero-poster.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
