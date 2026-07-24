/**
 * Email delivery for SAVEMI, powered by Resend.
 *
 * This module talks to the Resend HTTP API directly with `fetch`, so it needs
 * no extra npm dependency and no cold-start client. All ministry email flows
 * (admin verification, welcome, and admin-composed messages) route through
 * `sendEmail`, which always fails soft — a delivery problem must never crash a
 * request or block an admin action.
 *
 * Required environment:
 *   RESEND_API_KEY   Your Resend API key (starts with "re_").
 *   EMAIL_FROM       Verified sender, e.g. "SAVEMI <hello@savemionline.org>".
 * Optional:
 *   EMAIL_REPLY_TO   Reply-to address (defaults to EMAIL_FROM).
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text fallback. Auto-derived from html when omitted. */
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
  /** True when email is not configured (RESEND_API_KEY / EMAIL_FROM missing). */
  skipped?: boolean;
}

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM!.trim();
}

function getReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO?.trim() || undefined;
}

/** Very small HTML→text fallback so recipients on text-only clients get content. */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      skipped: true,
      error: "Email is not configured (set RESEND_API_KEY and EMAIL_FROM).",
    };
  }

  const replyTo = input.replyTo ?? getReplyTo();

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text ?? htmlToText(input.html),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Resend responded ${response.status}: ${detail.slice(0, 300)}`,
      };
    }

    const data = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;

    return { ok: true, id: data?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Email delivery failed.",
    };
  }
}
