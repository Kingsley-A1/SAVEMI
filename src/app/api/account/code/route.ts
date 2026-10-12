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

  try {
    // Admins sign in at the admin door; a member account on the same address
    // would be shadowed by it.
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!admin) {
      const member = await prisma.siteUser.findUnique({
        where: { email },
        select: { name: true, status: true },
      });

      if (!member || member.status === "ACTIVE") {
        const code = await issueEmailCode(email, name || null);
        const { subject, html } = renderSignInCodeEmail({
          name: member?.name ?? (name || null),
          code,
          minutes: MINUTES,
        });
        const sent = await sendEmail({ to: email, subject, html });
        if (!sent.ok) throw new Error(sent.error);
      }
    }
  } catch {
    return NextResponse.json(
      { error: "We couldn't send a code just now. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: `We sent a 6-digit code to ${email}. It expires in ${MINUTES} minutes.`,
  });
}
