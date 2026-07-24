/**
 * Admin email-verification helpers.
 *
 * When email is configured (RESEND_API_KEY + EMAIL_FROM), a newly registered
 * admin receives a verification link. Clicking it confirms ownership of the
 * address and triggers the welcome email. When email is NOT configured, there
 * is no way to deliver a link, so the admin is auto-verified on registration.
 *
 * Verification is deliberately non-blocking for login: it confirms the email
 * is reachable without risking a lockout during handover. See HANDOVER notes
 * for how to make it a hard gate later if desired.
 */

import { randomBytes } from "crypto";
import { sendEmail } from "./email";
import {
  renderVerificationEmail,
  renderWelcomeEmail,
} from "./email-templates";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 48; // 48 hours

export function createVerifyToken(): { token: string; expiry: Date } {
  return {
    token: randomBytes(32).toString("hex"),
    expiry: new Date(Date.now() + TOKEN_TTL_MS),
  };
}

export function buildVerifyUrl(siteUrl: string, token: string): string {
  return `${siteUrl}/api/admin/verify?token=${encodeURIComponent(token)}`;
}

/** Fire-and-forget verification email. Never throws. */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  try {
    const { subject, html } = renderVerificationEmail({
      name: params.name,
      verifyUrl: params.verifyUrl,
    });
    await sendEmail({ to: params.to, subject, html });
  } catch {
    /* non-fatal */
  }
}

/** Fire-and-forget welcome email. Never throws. */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  loginUrl: string;
}): Promise<void> {
  try {
    const { subject, html } = renderWelcomeEmail({
      name: params.name,
      loginUrl: params.loginUrl,
    });
    await sendEmail({ to: params.to, subject, html });
  } catch {
    /* non-fatal */
  }
}
