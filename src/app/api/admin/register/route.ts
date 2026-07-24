import { NextResponse } from "next/server";
import {
  getAdminAccessCodeConfigError,
  hashAdminAccessCode,
  isValidAdminAccessCode,
  normalizeAdminEmail,
} from "../../../../lib/admin-access";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import {
  registerLimiter,
  getClientIp,
  rateLimitResponse,
} from "../../../../lib/rate-limit";
import { audit } from "../../../../lib/audit";
import { auth } from "../../../../../auth";
import { isAllowedAdminEmail } from "../../../../lib/admin-permissions";
import { isEmailConfigured } from "../../../../lib/email";
import {
  buildVerifyUrl,
  createVerifyToken,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../../../../lib/admin-verification";
import { getSiteUrl } from "../../../../lib/site-url";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  // Rate limit: 5 registration attempts per hour per IP.
  const ip = getClientIp(request);
  const limit = registerLimiter.check(`register:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const session = await auth().catch(() => null);

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? normalizeAdminEmail(body.email) : "";
  const password =
    typeof body.password === "string" ? body.password.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 422 },
    );
  }

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Enter your full name (at least 2 characters)." },
      { status: 422 },
    );
  }

  if (name.length > 80) {
    return NextResponse.json(
      { error: "Name is too long (80 characters max)." },
      { status: 422 },
    );
  }

  // Anyone whose email is on the allow-list may self-register with the shared
  // access code. This replaces the old "first admin only" bootstrap gate.
  if (!isAllowedAdminEmail(email)) {
    return NextResponse.json(
      {
        error:
          "This email is not on the approved admin list. Ask a ministry lead to add it to ADMIN_ALLOWED_EMAILS.",
      },
      { status: 403 },
    );
  }

  if (!isValidAdminAccessCode(password)) {
    return NextResponse.json(
      { error: getAdminAccessCodeConfigError() },
      { status: 401 },
    );
  }

  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "That admin email is already registered." },
        { status: 409 },
      );
    }

    const passwordHash = await hashAdminAccessCode();
    const emailEnabled = isEmailConfigured();
    const siteUrl = getSiteUrl(request);

    // When email works, hold verification until the admin clicks the link.
    // When it doesn't, there's no way to deliver a link — auto-verify instead.
    const verification = emailEnabled ? createVerifyToken() : null;

    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name,
        emailVerified: emailEnabled ? null : new Date(),
        verifyToken: verification?.token ?? null,
        verifyTokenExpiry: verification?.expiry ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (emailEnabled && verification) {
      await sendVerificationEmail({
        to: admin.email,
        name: admin.name,
        verifyUrl: buildVerifyUrl(siteUrl, verification.token),
      });
    } else {
      // No verification step — send the welcome email right away.
      await sendWelcomeEmail({
        to: admin.email,
        name: admin.name,
        loginUrl: `${siteUrl}/admin/login`,
      });
    }

    await audit({
      session: session ?? { user: { id: admin.id, email: admin.email } },
      request,
      action: "admin.register",
      entityType: "AdminUser",
      entityId: admin.id,
      detail: { email: admin.email, name: admin.name },
    });

    return NextResponse.json(
      {
        data: admin,
        emailSent: emailEnabled,
        message: emailEnabled
          ? "Account created. Check your inbox to confirm your email."
          : "Account created.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to register admin." },
      { status: 500 },
    );
  }
}
