import { after, NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import {
  findPublishedContent,
  getRequestContext,
  parseContentKind,
  parseLikeKind,
  recordEvent,
} from "../../../lib/engagement";
import { getActiveMember, SIGN_IN_REQUIRED } from "../../../lib/member-session";
import { rateLimitResponse, reactionLimiter } from "../../../lib/rate-limit";

/**
 * POST /api/likes  { kind, id, liked? }
 *
 * Sets the member's like to `liked` when given — so a tap made while signed
 * out can never undo a like they already had — and toggles otherwise.
 */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }

  const member = await getActiveMember();
  if (!member) return NextResponse.json(SIGN_IN_REQUIRED, { status: 401 });

  const limit = reactionLimiter.check(`like:${member.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = parseLikeKind(body?.kind);
  const rawId = typeof body?.id === "string" ? body.id : "";
  if (!kind || !rawId) return NextResponse.json({ error: "Invalid target" }, { status: 422 });

  // Resolve to a canonical id that the member is allowed to see.
  let targetId: string | null = null;
  if (kind === "COMMENT") {
    const comment = await prisma.comment.findFirst({
      where: { id: rawId, status: "VISIBLE" },
      select: { id: true },
    });
    targetId = comment?.id ?? null;
  } else {
    const content = await findPublishedContent(kind, rawId).catch(() => null);
    targetId = content?.id ?? null;
  }
  if (!targetId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = { targetKind_targetId_userId: { targetKind: kind, targetId, userId: member.id } };
  const existing = await prisma.like.findUnique({ where: key, select: { id: true } });
  const want = typeof body?.liked === "boolean" ? body.liked : !existing;

  if (existing && !want) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else if (!existing && want) {
    await prisma.like
      .create({ data: { targetKind: kind, targetId, userId: member.id } })
      .catch(() => {}); // A double tap racing itself is not an error.

    const contentKind = parseContentKind(kind);
    if (contentKind && !member.isAdmin) {
      after(() =>
        recordEvent({
          type: "LIKE",
          kind: contentKind,
          targetId,
          userId: member.id,
          context: getRequestContext(request),
        }),
      );
    }
  }

  const count = await prisma.like.count({ where: { targetKind: kind, targetId } });
  return NextResponse.json({ liked: want, count });
}
