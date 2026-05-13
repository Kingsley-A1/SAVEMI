import { NextResponse } from "next/server";
import {
  formatAdminNameFromEmail,
  getAdminAccessCodeConfigError,
  hashAdminAccessCode,
  isValidAdminAccessCode,
  normalizeAdminEmail,
} from "../../../../lib/admin-access";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
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

    return NextResponse.json({ data: admin }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to register admin." },
      { status: 500 },
    );
  }
}
