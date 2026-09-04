import type { Metadata } from "next";

import ResultScreen from "@/components/ResultScreen";

export const metadata: Metadata = {
  title: "Unsubscribed — Pulse",
  robots: { index: false, follow: false },
};

const COPY = {
  ok: {
    tone: "success",
    title: "You are unsubscribed.",
    body: "We have removed this address from the Pulse waitlist and will not email it again.",
  },
  already: {
    tone: "success",
    title: "Already unsubscribed.",
    body: "This address was removed earlier. No further email will be sent to it.",
  },
  invalid: {
    tone: "error",
    title: "That link is not valid.",
    body: "It may have been altered in transit. Reply to any Pulse email and we will remove you by hand.",
  },
  error: {
    tone: "error",
    title: "Something went wrong.",
    body: "We could not process the request just now. Try the link again in a moment.",
  },
} as const;

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const copy = COPY[(state ?? "ok") as keyof typeof COPY] ?? COPY.ok;
  return <ResultScreen tone={copy.tone} title={copy.title} body={copy.body} />;
}
