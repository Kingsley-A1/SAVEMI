import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "admin" ? session : null;
}

// PATCH /api/admin/comments/:id { status: "VISIBLE" | "HIDDEN" }
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status === "VISIBLE" ? "VISIBLE" : body?.status === "HIDDEN" ? "HIDDEN" : null;
  if (!status) return NextResponse.json({ error: "Invalid status" }, { status: 422 });

  try {
    const updated = await prisma.comment.update({
      where: { id },
      // Approving clears the hold and resets reports, so a comment that was
      // reviewed is not re-held by the same reports.
      data: status === "VISIBLE"
        ? { status, heldReason: null, reportCount: 0, reports: { deleteMany: {} } }
        : { status },
      select: { id: true, body: true, status: true },
    });

    await audit({
      session,
      request: req,
      action: status === "VISIBLE" ? "comment.show" : "comment.hide",
      entityType: "Comment",
      entityId: id,
      detail: { excerpt: updated.body.slice(0, 80) },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

// DELETE /api/admin/comments/:id
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { id } = await params;
  try {
    const removed = await prisma.comment.delete({ where: { id }, select: { body: true } });
    await prisma.like.deleteMany({ where: { targetKind: "COMMENT", targetId: id } }).catch(() => {});
    await audit({
      session,
      request: req,
      action: "comment.delete",
      entityType: "Comment",
      entityId: id,
      detail: { excerpt: removed.body.slice(0, 80) },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
