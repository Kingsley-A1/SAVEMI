/**
 * Comment and like reads, shaped for the public engagement UI.
 *
 * Visibility: everyone sees VISIBLE comments; an author also sees their own
 * HELD ones (marked "awaiting review"). HIDDEN comments are admin-only.
 */

import type { Prisma, TargetKind } from "@prisma/client";
import { prisma } from "./db";
import type { ContentKind } from "./engagement";

export interface CommentView {
  id: string;
  body: string;
  authorName: string;
  /** Written by someone on the ministry team (an admin). */
  isTeam: boolean;
  createdAt: string;
  pending: boolean;
  isMine: boolean;
  likeCount: number;
  liked: boolean;
  replies: CommentView[];
}

export interface EngagementSummary {
  likeCount: number;
  liked: boolean;
  commentCount: number;
}

function visibleTo(viewerId: string | null): Prisma.CommentWhereInput {
  return viewerId
    ? { OR: [{ status: "VISIBLE" }, { status: "HELD", userId: viewerId }] }
    : { status: "VISIBLE" };
}

async function likeStats(
  kind: TargetKind,
  ids: string[],
  viewerId: string | null,
): Promise<{ counts: Map<string, number>; mine: Set<string> }> {
  if (ids.length === 0) return { counts: new Map(), mine: new Set() };

  const [grouped, own] = await Promise.all([
    prisma.like.groupBy({
      by: ["targetId"],
      where: { targetKind: kind, targetId: { in: ids } },
      _count: { _all: true },
    }),
    viewerId
      ? prisma.like.findMany({
          where: { targetKind: kind, targetId: { in: ids }, userId: viewerId },
          select: { targetId: true },
        })
      : Promise.resolve([] as Array<{ targetId: string }>),
  ]);

  return {
    counts: new Map(grouped.map((g) => [g.targetId, g._count._all])),
    mine: new Set(own.map((l) => l.targetId)),
  };
}

export async function getEngagementSummary(
  kind: ContentKind,
  targetId: string,
  viewerId: string | null,
): Promise<EngagementSummary> {
  try {
    const [stats, commentCount] = await Promise.all([
      likeStats(kind, [targetId], viewerId),
      prisma.comment.count({ where: { targetKind: kind, targetId, status: "VISIBLE" } }),
    ]);
    return {
      likeCount: stats.counts.get(targetId) ?? 0,
      liked: stats.mine.has(targetId),
      commentCount,
    };
  } catch {
    return { likeCount: 0, liked: false, commentCount: 0 };
  }
}

export async function getCommentThread(
  kind: ContentKind,
  targetId: string,
  viewerId: string | null,
): Promise<CommentView[]> {
  try {
    const rows = await prisma.comment.findMany({
      where: { targetKind: kind, targetId, parentId: null, ...visibleTo(viewerId) },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        body: true,
        status: true,
        userId: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        replies: {
          where: visibleTo(viewerId),
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            body: true,
            status: true,
            userId: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    const ids = rows.flatMap((r) => [r.id, ...r.replies.map((x) => x.id)]);
    const emails = [...new Set(rows.flatMap((r) => [r.user.email, ...r.replies.map((x) => x.user.email)]))];
    const [{ counts, mine }, team] = await Promise.all([
      likeStats("COMMENT", ids, viewerId),
      emails.length
        ? prisma.adminUser.findMany({ where: { email: { in: emails } }, select: { email: true } })
        : Promise.resolve([] as Array<{ email: string }>),
    ]);
    const teamEmails = new Set(team.map((t) => t.email));

    const toView = (r: (typeof rows)[number]["replies"][number]): CommentView => ({
      id: r.id,
      body: r.body,
      authorName: r.user.name,
      isTeam: teamEmails.has(r.user.email),
      createdAt: r.createdAt.toISOString(),
      pending: r.status === "HELD",
      isMine: r.userId === viewerId,
      likeCount: counts.get(r.id) ?? 0,
      liked: mine.has(r.id),
      replies: [],
    });

    return rows.map((r) => ({ ...toView(r), replies: r.replies.map(toView) }));
  } catch (error) {
    console.error("[comments] getCommentThread failed", error);
    return [];
  }
}
