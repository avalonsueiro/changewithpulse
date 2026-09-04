import "server-only";

import { Resend } from "resend";

import { siteUrl } from "./site-url";

const FROM = process.env.EMAIL_FROM ?? "Pulse <onboarding@resend.dev>";
const REPLY_TO = process.env.EMAIL_REPLY_TO;

let resend: Resend | null = null;

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

// Re-exported so the confirm and unsubscribe routes keep importing it from
// here, while the resolution logic lives in one place. The copy that used to
// live in this file had the same `??`-does-not-catch-empty-string bug as the
// layout: it would not have thrown, it would have quietly emailed everyone a
// link to "/api/confirm?token=…" with no origin in front of it.
export { siteUrl };

export type SendResult = { delivered: boolean; reason?: string };

/**
 * Sends the double opt-in confirmation. Returns rather than throws on failure:
 * a signup row already exists at this point, so a dead mail provider must not
 * turn into a 500 that tells the visitor their signup failed. The caller logs
 * and moves on; the address can be re-confirmed by submitting again.
 *
 * With no RESEND_API_KEY the link is written to the server console instead, so
 * the whole flow is testable without an email account.
 */
export async function sendConfirmationEmail(
  email: string,
  confirmToken: string,
  unsubscribeToken: string,
): Promise<SendResult> {
  const confirmUrl = `${siteUrl()}/api/confirm?token=${encodeURIComponent(confirmToken)}`;
  const unsubscribeUrl = `${siteUrl()}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

  const api = client();
  if (!api) {
    console.info(
      `[pulse] RESEND_API_KEY unset — confirmation link for ${email}:\n  ${confirmUrl}`,
    );
    return { delivered: false, reason: "no-api-key" };
  }

  try {
    const { error } = await api.emails.send({
      from: FROM,
      to: email,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      subject: "Confirm your place on the Pulse waitlist",
      html: confirmationHtml(confirmUrl, unsubscribeUrl),
      text: confirmationText(confirmUrl, unsubscribeUrl),
      headers: {
        // Lets mail clients surface a one-click unsubscribe, which materially
        // reduces spam complaints against the sending domain.
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (error) {
      console.error("[pulse] Resend rejected the message:", error);
      return { delivered: false, reason: error.message };
    }
    return { delivered: true };
  } catch (err) {
    console.error("[pulse] Failed to send confirmation email:", err);
    return { delivered: false, reason: "send-threw" };
  }
}

function confirmationText(confirmUrl: string, unsubscribeUrl: string): string {
  return [
    "Change is hard.",
    "",
    "Confirm your email to hold your place on the Pulse waitlist:",
    confirmUrl,
    "",
    "If you did not request this, ignore this message and nothing further will be sent.",
    "",
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}

function confirmationHtml(confirmUrl: string, unsubscribeUrl: string): string {
  // Table-based layout with inline styles: Outlook and Gmail strip <style>
  // blocks and ignore flexbox, so this is the shape that survives both.
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#FAFAF8;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF8;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border:1px solid #E2E0DA;border-radius:14px;">
            <tr>
              <td style="padding:40px 40px 32px;font-family:Georgia,'Times New Roman',serif;">
                <h1 style="margin:0 0 20px;font-size:34px;line-height:1.1;letter-spacing:-0.03em;font-weight:400;color:#0F0F0D;">Change is hard.</h1>
                <p style="margin:0 0 28px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#4A4842;">
                  Confirm your email address and we will let you know the moment access opens.
                </p>
                <a href="${confirmUrl}" style="display:inline-block;background:#3D4A22;color:#FAFAF8;text-decoration:none;border-radius:999px;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:500;letter-spacing:0.06em;">
                  Confirm my email
                </a>
                <p style="margin:28px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:#8A8880;">
                  If the button does not work, paste this into your browser:<br />
                  <span style="color:#3D4A22;word-break:break-all;">${confirmUrl}</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#8A8880;border-top:1px solid #E2E0DA;padding-top:24px;">
                You received this because someone entered this address on the Pulse waitlist. If that was not you, ignore this message and nothing further will be sent.
                <br /><a href="${unsubscribeUrl}" style="color:#8A8880;">Unsubscribe</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
