import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { getActiveMember, SIGN_IN_REQUIRED } from "../../../../lib/member-session";

// DELETE /api/comments/:id — a member removes their own comment.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const member = await getActiveMember();
  if (!member) return NextResponse.json(SIGN_IN_REQUIRED, { status: 401 });

  const { id } = await params;
  const result = await prisma.comment.deleteMany({ where: { id, userId: member.id } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.like.deleteMany({ where: { targetKind: "COMMENT", targetId: id } }).catch(() => {});
  return NextResponse.json({ success: true });
}
