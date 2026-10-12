import { after, NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import {
  findPublishedContent,
  getRequestContext,
  parseContentKind,
  recordEvent,
} from "../../../lib/engagement";
import { getCommentThread } from "../../../lib/comments";
import { decideCommentStatus, normalizeCommentBody } from "../../../lib/comment-rules";
import { getActiveMember, SIGN_IN_REQUIRED } from "../../../lib/member-session";
import { commentLimiter, rateLimitResponse } from "../../../lib/rate-limit";

export const dynamic = "force-dynamic";

// GET /api/comments?kind=MESSAGE&id=… — the thread as this viewer sees it.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const kind = parseContentKind(url.searchParams.get("kind"));
  const id = url.searchParams.get("id") ?? "";
  if (!kind || !id || !isDatabaseConfigured()) {
    return NextResponse.json({ data: [] });
  }

  const member = await getActiveMember();
  const data = await getCommentThread(kind, id, member?.id ?? null);
  return NextResponse.json({ data });
}

// POST /api/comments { kind, id, body, parentId? }
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Comments are unavailable right now." }, { status: 503 });
  }

  const member = await getActiveMember();
  if (!member) return NextResponse.json(SIGN_IN_REQUIRED, { status: 401 });

  const limit = commentLimiter.check(`comment:${member.id}`);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = parseContentKind(input?.kind);
  const rawId = typeof input?.id === "string" ? input.id : "";
  const body = normalizeCommentBody(input?.body);

  if (!kind || !rawId) return NextResponse.json({ error: "Invalid target" }, { status: 422 });
  if (!body) return NextResponse.json({ error: "Write something first." }, { status: 422 });

  const content = await findPublishedContent(kind, rawId).catch(() => null);
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // One level of replies: replying to a reply attaches to its top-level parent.
  let parentId: string | null = null;
  if (typeof input?.parentId === "string" && input.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: input.parentId, targetKind: kind, targetId: content.id, status: "VISIBLE" },
      select: { id: true, parentId: true },
    });
    if (!parent) return NextResponse.json({ error: "That comment is no longer available." }, { status: 404 });
    parentId = parent.parentId ?? parent.id;
  }

  const hasApprovedBefore =
    (await prisma.comment.count({ where: { userId: member.id, status: "VISIBLE" } })) > 0;
  const decision = decideCommentStatus({ body, hasApprovedBefore });

  const comment = await prisma.comment.create({
    data: {
      targetKind: kind,
      targetId: content.id,
      userId: member.id,
      parentId,
      body,
      status: decision.status,
      heldReason: decision.reason,
    },
    select: { id: true, status: true },
  });

  after(() =>
    recordEvent({
      type: "COMMENT",
      kind,
      targetId: content.id,
      userId: member.id,
      context: getRequestContext(request),
    }),
  );

  return NextResponse.json(
    { id: comment.id, pending: comment.status === "HELD" },
    { status: 201 },
  );
}
