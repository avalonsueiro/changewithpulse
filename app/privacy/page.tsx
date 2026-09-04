import type { Metadata } from "next";

import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Pulse",
  description:
    "What Pulse collects when you join the waitlist, why, how long it is kept, and how to get it removed.",
};

// Bump when the policy changes materially.
const UPDATED = "4 September 2026";

/**
 * Written to match what the code actually does. Every field listed below is a
 * real column in the `signups` table, and every processor listed is one the
 * app genuinely talks to. If the data model changes, this page changes with it.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <div className="legal-note">
        <p>
          <strong>Placeholders to replace before launch:</strong> the contact
          address <code>privacy@example.com</code> and the governing
          jurisdiction below. This document describes the software accurately,
          but it is a template, not legal advice — have someone qualified read
          it if you are collecting at scale or from regulated sectors.
        </p>
      </div>

      <p>
        Pulse runs a waitlist. This page explains exactly what we store when you
        enter your email address, why we store it, and how to get rid of it.
      </p>

      <h2>What we collect</h2>
      <p>
        When you submit the form on the homepage, we record the following. There
        is nothing else — no advertising identifiers, no third-party trackers,
        and no cookies.
      </p>

      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Your email address</td>
              <td>To confirm your signup and tell you when access opens.</td>
            </tr>
            <tr>
              <td>Confirmation status and timestamps</td>
              <td>
                To know whether you confirmed, and so we never email an address
                that has not opted in.
              </td>
            </tr>
            <tr>
              <td>
                Referring page and campaign tags (<code>utm_source</code>,{" "}
                <code>utm_medium</code>, <code>utm_campaign</code>,{" "}
                <code>utm_term</code>, <code>utm_content</code>)
              </td>
              <td>
                To understand which channels people arrive from. Only these five
                named tags are stored; anything else in the URL is discarded.
              </td>
            </tr>
            <tr>
              <td>
                A <strong>one-way hash</strong> of your IP address
              </td>
              <td>
                To rate-limit the form against abuse. We salt and hash the
                address before storing it, so the raw IP is never written to the
                database and the stored value cannot be reversed back into one.
              </td>
            </tr>
            <tr>
              <td>Your browser&rsquo;s user-agent string</td>
              <td>To distinguish real signups from automated ones.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Confirmation and unsubscribe links</h2>
      <p>
        The links in our emails carry a random token. We store only a SHA-256
        hash of that token, never the token itself, so someone who obtained a
        copy of our database still could not confirm or unsubscribe on your
        behalf. The confirmation token is single-use and is destroyed the moment
        you click it.
      </p>

      <h2>Why we are allowed to hold it</h2>
      <p>
        Consent. You gave it by entering your address and clicking the
        confirmation link we sent. We use double opt-in specifically so that a
        mistyped or maliciously entered address never ends up on the list — an
        address that is never confirmed is never emailed again.
      </p>

      <h2>Who else sees it</h2>
      <p>
        We do not sell your data, share it for advertising, or hand it to
        anybody for their own purposes. It passes through three service
        providers who process it on our behalf:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — hosts the database the list is stored in.
        </li>
        <li>
          <strong>Resend</strong> — delivers the confirmation email.
        </li>
        <li>
          <strong>Vercel</strong> — hosts the website itself.
        </li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Until you ask us to delete it, or until the waitlist is wound up,
        whichever comes first. If you unsubscribe we keep a record that the
        address opted out — that is what stops us from mailing it again by
        mistake if it is re-entered later. Ask for erasure and that goes too.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask us to show you what we hold about you, correct it, delete
        it, or hand it over in a portable format. You can withdraw consent at
        any time, and you can complain to your local data protection authority
        if you think we have handled it badly.
      </p>
      <p>
        The fastest routes: click <strong>unsubscribe</strong> in any email we
        send, or email <code>privacy@example.com</code>. We will respond within
        30 days.
      </p>

      <h2>Cookies</h2>
      <p>
        This site sets none. There is no analytics script and no consent banner,
        because there is nothing to consent to.
      </p>

      <h2>Children</h2>
      <p>
        Pulse is a workplace tool and is not directed at children. We do not
        knowingly collect data from anyone under 16.
      </p>

      <h2>Changes</h2>
      <p>
        If we change this policy we will update the date at the top. Material
        changes affecting people already on the list will be sent by email.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about any of this: <code>privacy@example.com</code>. Governed
        by the laws of <em>[jurisdiction to be specified]</em>.
      </p>
    </LegalPage>
  );
}
