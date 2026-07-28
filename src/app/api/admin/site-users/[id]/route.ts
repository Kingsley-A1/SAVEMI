import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function guard(session: { user?: { role?: string } } | null) {
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  return null;
}

// PATCH /api/admin/site-users/:id — suspend or reactivate a member.
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const blocked = guard(session);
  if (blocked) return blocked;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status =
    body.status === "ACTIVE"
      ? "ACTIVE"
      : body.status === "SUSPENDED"
        ? "SUSPENDED"
        : null;

  if (!status) {
    return NextResponse.json(
      { error: "Status must be ACTIVE or SUSPENDED." },
      { status: 422 },
    );
  }

  try {
    const updated = await prisma.siteUser.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, name: true, status: true },
    });

    await audit({
      session,
      request: req,
      action: "member.update",
      entityType: "SiteUser",
      entityId: updated.id,
      detail: { email: updated.email, status: updated.status },
    });

    return NextResponse.json({ data: updated });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update member." },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/site-users/:id — remove a member account.
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const blocked = guard(session);
  if (blocked) return blocked;

  const { id } = await params;

  try {
    const existing = await prisma.siteUser.findUnique({
      where: { id },
      select: { email: true },
    });

    await prisma.siteUser.delete({ where: { id } });

    await audit({
      session,
      request: req,
      action: "member.delete",
      entityType: "SiteUser",
      entityId: id,
      detail: { email: existing?.email },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete member." },
      { status: 500 },
    );
  }
}
