import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import { isValidEmail, normalizeEmail } from "../../../../../lib/site-users";
import { isEmailConfigured, sendEmail } from "../../../../../lib/email";
import { renderPasswordResetEmail } from "../../../../../lib/email-templates";
import {
  codeExpiry,
  generateCode,
  hashCode,
  CODE_TTL_MS,
} from "../../../../../lib/verification-codes";
import {
  codeRequestLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../../../lib/rate-limit";

const MINUTES = Math.round(CODE_TTL_MS / 60000);

/**
 * POST /api/account/password/forgot  { email }
 *
 * Issues a 6-digit reset code. The reply is identical whether or not the
 * address exists, so this cannot be used to discover who has an account.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = codeRequestLimiter.check(`password-forgot:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? normalizeEmail(body.email) : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 422 },
    );
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Password reset is unavailable because email is not configured. Contact the ministry for help.",
      },
      { status: 503 },
    );
  }

  const genericMessage =
    `If an account exists for that address, a 6-digit code is on its way. ` +
    `It expires in ${MINUTES} minutes.`;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: genericMessage });
  }

  try {
    const user = await prisma.siteUser.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, status: true },
    });

    // Suspended accounts get no code — silently, to avoid disclosing status.
    if (user && user.status === "ACTIVE") {
      const code = generateCode();

      await prisma.siteUser.update({
        where: { id: user.id },
        data: {
          resetCodeHash: await hashCode(code),
          resetCodeExpiry: codeExpiry(),
          resetAttempts: 0,
        },
      });

      const { subject, html } = renderPasswordResetEmail({
        name: user.name,
        code,
        minutes: MINUTES,
      });

      await sendEmail({ to: user.email, subject, html });
    }
  } catch {
    // Fall through to the same generic reply.
  }

  return NextResponse.json({ message: genericMessage });
}
