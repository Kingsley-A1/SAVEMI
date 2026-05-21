import { NextResponse } from "next/server";
import {
  formatAdminNameFromEmail,
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
    const admin = await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name: formatAdminNameFromEmail(email),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Audit: log who performed this registration.
    // The registering user is either the current session holder or the new
    // admin themselves (bootstrap case). We try the session first.
    const session = await auth().catch(() => null);
    await audit({
      session: session ?? { user: { id: admin.id, email: admin.email } },
      request,
      action: "admin.register",
      entityType: "AdminUser",
      entityId: admin.id,
      detail: { email: admin.email, name: admin.name },
    });

    return NextResponse.json({ data: admin }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to register admin." },
      { status: 500 },
    );
  }
}
