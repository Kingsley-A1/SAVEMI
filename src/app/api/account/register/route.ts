import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import {
  getClientIp,
  rateLimitResponse,
  registerLimiter,
} from "../../../../lib/rate-limit";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  normalizeName,
  validatePassword,
} from "../../../../lib/site-users";
import { isEmailConfigured, sendEmail } from "../../../../lib/email";
import { renderMemberWelcomeEmail } from "../../../../lib/email-templates";
import { getSiteUrl } from "../../../../lib/site-url";

// POST /api/account/register — public member sign-up.
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = registerLimiter.check(`account-register:${ip}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Registration is unavailable right now." },
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
  const name = typeof body.name === "string" ? normalizeName(body.name) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) {
    return NextResponse.json(
      { error: "Enter your name." },
      { status: 422 },
    );
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 422 },
    );
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 422 });
  }

  // An address already used by an admin must not become a member account —
  // it would be shadowed at sign-in by the admin branch.
  try {
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "That email is already registered." },
        { status: 409 },
      );
    }

    const existing = await prisma.siteUser.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "That email is already registered." },
        { status: 409 },
      );
    }

    const user = await prisma.siteUser.create({
      data: {
        email,
        name,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    // Welcome mail is a courtesy: never let it fail the registration.
    if (isEmailConfigured()) {
      const { subject, html } = renderMemberWelcomeEmail({
        name: user.name,
        siteUrl: getSiteUrl(),
      });

      void sendEmail({ to: user.email, subject, html }).catch(() => {});
    }

    return NextResponse.json({ data: user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create your account." },
      { status: 500 },
    );
  }
}
