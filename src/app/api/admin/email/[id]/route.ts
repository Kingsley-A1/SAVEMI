import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/email/:id — remove a sent-email history entry.
// This only deletes the ministry's local record of having sent it; it
// cannot recall a message already delivered to a recipient's inbox.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. Admin session required." },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const deleted = await prisma.sentEmail.findUnique({
      where: { id },
      select: { id: true, subject: true },
    });

    await prisma.sentEmail.delete({ where: { id } });

    await audit({
      session,
      request,
      action: "email.delete",
      entityType: "SentEmail",
      entityId: id,
      detail: { subject: deleted?.subject },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete email history entry." },
      { status: 500 },
    );
  }
}
