import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import {
  formatAdminNameFromEmail,
  normalizeAdminEmail,
} from "../../../../../lib/admin-access";
import { isSuperAdminEmail } from "../../../../../lib/admin-permissions";
import { audit } from "../../../../../lib/audit";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

export async function PATCH(req: NextRequest, { params }: RouteContext) {
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

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  const email = normalizeAdminEmail(getStringField(body, "email"));
  const name = getStringField(body, "name") || formatAdminNameFromEmail(email);

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Enter a valid admin email." },
      { status: 422 },
    );
  }

  if (isSuperAdminEmail(existing.email) && existing.email !== email) {
    return NextResponse.json(
      { error: "The configured super admin email cannot be changed here." },
      { status: 403 },
    );
  }

  try {
    const updated = await prisma.adminUser.update({
      where: { id },
      data: { email, name },
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
      action: "admin.update",
      entityType: "AdminUser",
      entityId: updated.id,
      detail: { email: updated.email, name: updated.name },
    });

    return NextResponse.json({ data: updated });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "That admin email is already registered." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to update admin user." },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
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

  const actingAdminId = session.user.id;
  if (!actingAdminId) {
    return NextResponse.json(
      { error: "Unable to identify current admin session." },
      { status: 500 },
    );
  }

  const { id } = await params;
  const target = await prisma.adminUser.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  if (target.id === actingAdminId) {
    return NextResponse.json(
      { error: "You cannot delete your active admin account." },
      { status: 400 },
    );
  }

  if (isSuperAdminEmail(target.email)) {
    return NextResponse.json(
      { error: "The configured super admin account cannot be deleted." },
      { status: 403 },
    );
  }

  const adminCount = await prisma.adminUser.count();
  if (adminCount <= 1) {
    return NextResponse.json(
      { error: "The last admin account cannot be deleted." },
      { status: 400 },
    );
  }

  try {
    try {
      await prisma.auditLog.updateMany({
        where: { adminId: target.id },
        data: { adminId: actingAdminId },
      });
    } catch {
      // If the audit migration is missing, deletion should still remove access.
    }

    await prisma.adminUser.delete({ where: { id: target.id } });

    await audit({
      session,
      request: req,
      action: "admin.delete",
      entityType: "AdminUser",
      entityId: target.id,
      detail: { email: target.email, name: target.name },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete admin user." },
      { status: 500 },
    );
  }
}
