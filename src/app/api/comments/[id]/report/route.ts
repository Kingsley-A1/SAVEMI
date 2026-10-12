import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import { REPORT_HOLD_THRESHOLD } from "../../../../../lib/comment-rules";
import { getActiveMember, SIGN_IN_REQUIRED } from "../../../../../lib/member-session";
import { rateLimitResponse, reactionLimiter } from "../../../../../lib/rate-limit";

// POST /api/comments/:id/report — one report per member; enough of them hold it.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const member = await getActiveMember();
  if (!member) return NextResponse.json(SIGN_IN_REQUIRED, { status: 401 });

  const limit = reactionLimiter.check(`report:${member.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  const { id } = await params;
  const comment = await prisma.comment.findFirst({
    where: { id, status: "VISIBLE" },
    select: { id: true, userId: true },
  });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (comment.userId === member.id) {
    return NextResponse.json({ error: "You can't report your own comment." }, { status: 422 });
  }

  const already = await prisma.commentReport.findUnique({
    where: { commentId_userId: { commentId: id, userId: member.id } },
  });

  if (!already) {
    await prisma.commentReport.create({ data: { commentId: id, userId: member.id } });
    const updated = await prisma.comment.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true },
    });

    if (updated.reportCount >= REPORT_HOLD_THRESHOLD) {
      await prisma.comment.update({
        where: { id },
        data: { status: "HELD", heldReason: "reported" },
      });
    }
  }

  return NextResponse.json({ success: true });
}
