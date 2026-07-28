import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  validatePassword,
} from "../../../../../lib/site-users";
import {
  checkCode,
  GENERIC_CODE_ERROR,
  isWellFormedCode,
  LOCKED_CODE_ERROR,
  normalizeCode,
} from "../../../../../lib/verification-codes";
import {
  codeVerifyLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../../../lib/rate-limit";

/**
 * POST /api/account/password/reset  { email, code, password }
 *
 * Exchanges a valid 6-digit code for a new password. The code is consumed on
 * success, so it can never be replayed.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = codeVerifyLimiter.check(`password-reset:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Password reset is unavailable right now." },
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
    typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 422 },
    );
  }

  if (!isWellFormedCode(code)) {
    return NextResponse.json(
      { error: "Enter the 6-digit code from your email." },
      { status: 422 },
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 422 });
  }

  try {
    const user = await prisma.siteUser.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        resetCodeHash: true,
        resetCodeExpiry: true,
        resetAttempts: true,
      },
    });

    // Unknown or suspended account fails exactly like a wrong code.
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: GENERIC_CODE_ERROR }, { status: 400 });
    }

    const result = await checkCode(code, {
      hash: user.resetCodeHash,
      expiry: user.resetCodeExpiry,
      attempts: user.resetAttempts,
    });

    if (!result.ok) {
      if (result.reason === "mismatch") {
        await prisma.siteUser.update({
          where: { id: user.id },
          data: { resetAttempts: { increment: 1 } },
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

    // Consume the code in the same write that sets the new password.
    await prisma.siteUser.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
        resetCodeHash: null,
        resetCodeExpiry: null,
        resetAttempts: 0,
      },
    });

    return NextResponse.json({
      message: "Your password has been reset. You can sign in now.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reset your password right now." },
      { status: 500 },
    );
  }
}
