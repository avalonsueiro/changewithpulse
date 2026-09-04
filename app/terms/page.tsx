import type { Metadata } from "next";

import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms — Pulse",
  description:
    "The terms that apply to joining the Pulse waitlist and using this site.",
};

const UPDATED = "4 September 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms" updated={UPDATED}>
      <div className="legal-note">
        <p>
          <strong>Placeholders to replace before launch:</strong> the contact
          address <code>hello@example.com</code>, the legal entity name, and the
          governing jurisdiction. A template, not legal advice.
        </p>
      </div>

      <p>
        This site does one thing: it takes an email address for a waitlist.
        These terms cover that, and nothing more.
      </p>

      <h2>The waitlist is not a promise</h2>
      <p>
        Joining does not create a contract, reserve you a place in any queue, or
        entitle you to access, a price, a launch date, or the product existing
        at all. Pulse is in development. We may change what it does, change who
        can use it, or stop building it. If that happens you will have lost
        nothing but the email address you gave us, which you can have deleted.
      </p>

      <h2>What we ask of you</h2>
      <ul>
        <li>
          Enter an address you control. Signing other people up is the one thing
          that genuinely causes harm here — it is why we confirm every address
          before we ever mail it again.
        </li>
        <li>
          Do not attempt to break, overload, or probe the site. The form is rate
          limited; treat that as the boundary rather than a challenge.
        </li>
        <li>Do not use anything here unlawfully.</li>
      </ul>
      <p>
        We may remove any address from the list at our discretion, and we do not
        have to explain why.
      </p>

      <h2>What you can expect from us</h2>
      <p>
        One confirmation email when you sign up. After that, email only when
        there is genuine news about access. Every message carries a working
        unsubscribe link, and unsubscribing is honoured permanently.
      </p>

      <h2>Ownership</h2>
      <p>
        The Pulse name, the wordmark, the copy, and the imagery on this site
        belong to us. Joining a waitlist does not license any of it.
      </p>

      <h2>No warranty, and limits on liability</h2>
      <p>
        The site is provided as it is, without warranties of any kind. We do not
        promise it will be available, uninterrupted, or free of errors. To the
        fullest extent the law allows, we are not liable for indirect or
        consequential loss arising from your use of it. Nothing here limits
        liability that cannot lawfully be limited.
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle your address is set out in the{" "}
        <a href="/privacy">Privacy Policy</a>, which forms part of these terms.
      </p>

      <h2>Changes</h2>
      <p>
        We may revise these terms. The date at the top shows when they last
        changed; continuing to use the site after that means you accept the
        revision.
      </p>

      <h2>Contact</h2>
      <p>
        <code>hello@example.com</code>. Governed by the laws of{" "}
        <em>[jurisdiction to be specified]</em>.
      </p>
    </LegalPage>
  );
}
