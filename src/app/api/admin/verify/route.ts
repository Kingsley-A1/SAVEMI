import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { normalizeAdminEmail } from "../../../../lib/admin-access";
import {
  issueVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  CODE_TTL_MINUTES,
} from "../../../../lib/admin-verification";
import { isEmailConfigured } from "../../../../lib/email";
import { getSiteUrl } from "../../../../lib/site-url";
import {
  codeRequestLimiter,
  codeVerifyLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../../lib/rate-limit";
import {
  checkCode,
  GENERIC_CODE_ERROR,
  isWellFormedCode,
  LOCKED_CODE_ERROR,
  normalizeCode,
} from "../../../../lib/verification-codes";

/**
 * Admin email verification by 6-digit code.
 *
 *   POST /api/admin/verify            { email, code }   → confirm
 *   POST /api/admin/verify?resend=1   { email }         → send a fresh code
 *
 * Responses never reveal whether an address is registered.
 */

const SENT_MESSAGE =
  "If that address needs confirming, a code is on its way. It expires in " +
  `${CODE_TTL_MINUTES} minutes.`;

async function handleResend(request: Request, email: string) {
  const ip = getClientIp(request);
  const limit = codeRequestLimiter.check(`admin-verify-send:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email is not configured, so codes cannot be sent." },
      { status: 503 },
    );
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    // Silent no-op for unknown or already-verified addresses.
    if (admin && !admin.emailVerified) {
      const { code, hash, expiry } = await issueVerificationCode();

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          verifyToken: hash,
          verifyTokenExpiry: expiry,
          verifyAttempts: 0,
        },
      });

      await sendVerificationEmail({
        to: admin.email,
        name: admin.name,
        code,
      });
    }
  } catch {
    // Fall through to the same generic reply.
  }

  return NextResponse.json({ message: SENT_MESSAGE });
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Verification is unavailable right now." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? normalizeAdminEmail(body.email) : "";

  if (!email) {
    return NextResponse.json(
      { error: "Enter your admin email address." },
      { status: 422 },
    );
  }

  const wantsResend =
    new URL(request.url).searchParams.get("resend") === "1" ||
    body.resend === true;

  if (wantsResend) {
    return handleResend(request, email);
  }

  const ip = getClientIp(request);
  const limit = codeVerifyLimiter.check(`admin-verify:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";

  if (!isWellFormedCode(code)) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 422 },
    );
  }

  try {
    const admin = await prisma.adminUser.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        verifyToken: true,
        verifyTokenExpiry: true,
        verifyAttempts: true,
      },
    });

    // Already confirmed: idempotent success, so a double submit is harmless.
    if (admin?.emailVerified) {
      return NextResponse.json({ message: "Your email is already confirmed." });
    }

    // Unknown address: same generic failure as a wrong code, so this endpoint
    // cannot be used to discover which addresses are registered.
    if (!admin) {
      return NextResponse.json({ error: GENERIC_CODE_ERROR }, { status: 400 });
    }

    const result = await checkCode(code, {
      hash: admin.verifyToken,
      expiry: admin.verifyTokenExpiry,
      attempts: admin.verifyAttempts,
    });

    if (!result.ok) {
      if (result.reason === "mismatch") {
        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { verifyAttempts: { increment: 1 } },
        });
      }

      return NextResponse.json(
        {
          error:
            result.reason === "locked"
              ? LOCKED_CODE_ERROR
              : GENERIC_CODE_ERROR,
        },
        { status: result.reason === "locked" ? 429 : 400 },
      );
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        emailVerified: new Date(),
        verifyToken: null,
        verifyTokenExpiry: null,
        verifyAttempts: 0,
      },
    });

    await sendWelcomeEmail({
      to: admin.email,
      name: admin.name,
      loginUrl: `${getSiteUrl(request)}/admin/login`,
    });

    return NextResponse.json({ message: "Email confirmed. Welcome aboard." });
  } catch {
    return NextResponse.json(
      { error: "Unable to confirm your email right now." },
      { status: 500 },
    );
  }
}
