import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { isValidEmail, normalizeEmail, normalizeName } from "../../../../lib/site-users";
import { isEmailConfigured, sendEmail } from "../../../../lib/email";
import { renderSignInCodeEmail } from "../../../../lib/email-templates";
import { issueEmailCode } from "../../../../lib/email-code";
import { CODE_TTL_MS } from "../../../../lib/verification-codes";
import {
  codeRequestLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../../lib/rate-limit";

const MINUTES = Math.round(CODE_TTL_MS / 60000);

/**
 * POST /api/account/code  { email, name? }
 *
 * Emails a 6-digit sign-in code. Works for new and returning members alike;
 * the reply is the same either way, so it reveals nothing about who has an
 * account. The name is only used if this address becomes a new account.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = codeRequestLimiter.check(`email-code:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isDatabaseConfigured() || !isEmailConfigured()) {
    return NextResponse.json(
      { error: "Sign-in is unavailable right now. Please try again later." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const name = typeof body.name === "string" ? normalizeName(body.name) : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 422 },
    );
  }

  // Admins sign in with the shared access code, never an emailed code.
  // Saying so (rather than pretending a code was sent) is the difference
  // between an admin waiting on an email that never comes and signing in.
  const admin = await prisma.adminUser
    .findUnique({ where: { email }, select: { id: true } })
    .catch(() => null);
  if (admin) {
    return NextResponse.json(
      {
        error: "This is a SAVEMI admin email. Sign in with your access code instead.",
        code: "ADMIN_ACCOUNT",
      },
      { status: 409 },
    );
  }

  try {
    const member = await prisma.siteUser.findUnique({
      where: { email },
      select: { name: true, status: true },
    });

    // Suspended accounts get no code — silently, to avoid disclosing status.
    if (!member || member.status === "ACTIVE") {
      const code = await issueEmailCode(email, name || null);
      const { subject, html } = renderSignInCodeEmail({
        name: member?.name ?? (name || null),
        code,
        minutes: MINUTES,
      });
      const sent = await sendEmail({ to: email, subject, html });
      if (!sent.ok) throw new Error(sent.error ?? "Email provider rejected the send");
    }
  } catch (error) {
    // The provider's own reason (e.g. an unverified sending domain) is the
    // only way to diagnose a delivery failure — keep it in the logs.
    console.error("[account/code] sign-in code not sent", {
      to: email.replace(/^(.).*(@.*)$/, "$1***$2"),
      reason: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error:
          "We couldn't send the email just now. Try again in a minute, or sign in with your password.",
        code: "SEND_FAILED",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message: `We sent a 6-digit code to ${email}. It expires in ${MINUTES} minutes.`,
  });
}
