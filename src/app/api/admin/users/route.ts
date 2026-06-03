import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import {
  formatAdminNameFromEmail,
  getAdminAccessCodeConfigError,
  hashAdminAccessCode,
  isValidAdminAccessCode,
  normalizeAdminEmail,
} from "../../../../lib/admin-access";
import { isSuperAdminEmail } from "../../../../lib/admin-permissions";
import { audit } from "../../../../lib/audit";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getStringField(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Super admin access required" },
      { status: 403 },
    );
  }
  const currentUserId = session.user.id;

  const guard = guardDb();
  if (guard) return guard;

  const admins = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const auditByAdmin = new Map<
    string,
    { count: number; lastAction: string | null; lastActionAt: Date | null }
  >();

  try {
    const auditEvents = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        adminId: true,
        action: true,
        createdAt: true,
      },
    });

    for (const event of auditEvents) {
      const existing = auditByAdmin.get(event.adminId);
      if (existing) {
        existing.count += 1;
        continue;
      }

      auditByAdmin.set(event.adminId, {
        count: 1,
        lastAction: event.action,
        lastActionAt: event.createdAt,
      });
    }
  } catch {
    // Admin listing should still work if the audit migration is missing.
  }

  return NextResponse.json({
    data: admins.map((admin) => {
      const audit = auditByAdmin.get(admin.id);

      return {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        auditCount: audit?.count ?? 0,
        lastAction: audit?.lastAction ?? null,
        lastActionAt: audit?.lastActionAt ?? null,
        isSuperAdmin: isSuperAdminEmail(admin.email),
        isCurrentUser: admin.id === currentUserId,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSuperAdminEmail(session.user.email)) {
    return NextResponse.json(
      { error: "Super admin access required" },
      { status: 403 },
    );
  }

  const guard = guardDb();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = normalizeAdminEmail(getStringField(body, "email"));
  const name = getStringField(body, "name") || formatAdminNameFromEmail(email);
  const accessCode = getStringField(body, "accessCode");

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid admin email." },
      { status: 422 },
    );
  }

  if (!isValidAdminAccessCode(accessCode)) {
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

    const admin = await prisma.adminUser.create({
      data: {
        email,
        name,
        passwordHash: await hashAdminAccessCode(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await audit({
      session,
      request: req,
      action: "admin.create",
      entityType: "AdminUser",
      entityId: admin.id,
      detail: { email: admin.email, name: admin.name },
    });

    return NextResponse.json({ data: admin }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to create admin user." },
      { status: 500 },
    );
  }
}
