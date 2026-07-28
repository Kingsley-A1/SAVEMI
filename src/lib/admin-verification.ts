/**
 * Admin email verification.
 *
 * A newly registered admin receives a 6-digit code by email and types it on
 * /admin/verify. Codes are hashed at rest, expire quickly, and die after a
 * handful of wrong guesses — see lib/verification-codes.
 *
 * When email is NOT configured (no RESEND_API_KEY / EMAIL_FROM) there is no
 * way to deliver a code, so the admin is auto-verified on registration.
 *
 * Verification is deliberately non-blocking for login: it confirms the address
 * is reachable without risking a lockout. See the HANDOVER notes for how to
 * make it a hard gate.
 */

import { sendEmail } from "./email";
import {
  renderVerificationEmail,
  renderWelcomeEmail,
} from "./email-templates";
import {
  CODE_TTL_MS,
  codeExpiry,
  generateCode,
  hashCode,
} from "./verification-codes";

export const CODE_TTL_MINUTES = Math.round(CODE_TTL_MS / 60000);

export interface IssuedCode {
  /** The plain code — emailed, never stored. */
  code: string;
  /** bcrypt hash to persist. */
  hash: string;
  expiry: Date;
}

export async function issueVerificationCode(): Promise<IssuedCode> {
  const code = generateCode();
  return { code, hash: await hashCode(code), expiry: codeExpiry() };
}

/** Fire-and-forget verification email. Never throws. */
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  code: string;
}): Promise<void> {
  try {
    const { subject, html } = renderVerificationEmail({
      name: params.name,
      code: params.code,
      minutes: CODE_TTL_MINUTES,
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
