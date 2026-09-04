import type { Metadata } from "next";

import ResultScreen from "@/components/ResultScreen";

export const metadata: Metadata = {
  title: "Email confirmed — Pulse",
  // Confirmation URLs carry a token; keep them out of search indexes.
  robots: { index: false, follow: false },
};

const COPY = {
  ok: {
    tone: "success",
    title: "You are confirmed.",
    body: "Your place on the Pulse waitlist is held. We will email you the moment access opens, and nothing else in the meantime.",
  },
  already: {
    tone: "success",
    title: "Already confirmed.",
    body: "This link has been used. You are on the list — there is nothing more to do.",
  },
  unsubscribed: {
    tone: "neutral",
    title: "This address unsubscribed.",
    body: "You previously asked us to stop emailing this address, so we have left it that way. Sign up again from the homepage if you have changed your mind.",
  },
  invalid: {
    tone: "error",
    title: "That link is not valid.",
    body: "It may have been altered in transit. Enter your email again on the homepage and we will send a fresh confirmation.",
  },
  error: {
    tone: "error",
    title: "Something went wrong.",
    body: "We could not confirm your address just now. Try the link again in a moment, or sign up again from the homepage.",
  },
} as const;

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const copy = COPY[(state ?? "ok") as keyof typeof COPY] ?? COPY.ok;
  return <ResultScreen tone={copy.tone} title={copy.title} body={copy.body} />;
}
