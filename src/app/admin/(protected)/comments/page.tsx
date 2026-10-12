import Link from "next/link";
import type { CommentStatus } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { lookupContent } from "../../../../lib/engagement";
import { timeAgo } from "../analytics/ActivityFeed";
import CommentActions from "./CommentActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Comments | SAVEMI Admin" };

const TABS: Array<{ key: CommentStatus; label: string }> = [
  { key: "HELD", label: "Needs review" },
  { key: "VISIBLE", label: "Live" },
  { key: "HIDDEN", label: "Hidden" },
];

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!isDatabaseConfigured()) {
    return <div className="site-panel p-6 text-sm">Database not configured.</div>;
  }

  const requested = (await searchParams).status;
  const status: CommentStatus =
    requested === "VISIBLE" || requested === "HIDDEN" ? requested : "HELD";

  const [counts, comments] = await Promise.all([
    prisma.comment.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.comment.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        body: true,
        status: true,
        heldReason: true,
        reportCount: true,
        parentId: true,
        createdAt: true,
        targetKind: true,
        targetId: true,
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const count = (s: CommentStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const content = await lookupContent(comments.map((c) => ({ kind: c.targetKind, id: c.targetId })));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Comments</h1>

      <nav className="flex gap-1 border-b" style={{ borderColor: "var(--brand-border)" }} aria-label="Comment status">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/comments?status=${tab.key}`}
            aria-current={tab.key === status ? "page" : undefined}
            className="-mb-px border-b-2 px-3 py-2 text-sm"
            style={{
              borderColor: tab.key === status ? "var(--brand-primary)" : "transparent",
              fontWeight: tab.key === status ? 600 : 400,
            }}
          >
            {tab.label}
            <span className="text-brand-muted ml-1.5 tabular-nums">{count(tab.key)}</span>
          </Link>
        ))}
      </nav>

      {comments.length === 0 ? (
        <p className="text-brand-muted py-10 text-center text-sm">
          {status === "HELD" ? "Nothing waiting for review." : "No comments here."}
        </p>
      ) : (
        <ul className="site-panel divide-y divide-[color:var(--brand-border)] overflow-hidden">
          {comments.map((c) => {
            const meta = content.get(`${c.targetKind}:${c.targetId}`);
            return (
              <li key={c.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-xs">
                    <Link href={`/admin/analytics/people/${c.user.id}`} className="font-semibold hover:underline">
                      {c.user.name}
                    </Link>
                    <span className="text-brand-muted"> · {c.user.email} · {timeAgo(c.createdAt)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-6">{c.body}</p>
                  <p className="text-brand-muted mt-1 text-xs">
                    {c.parentId ? "Reply on " : "On "}
                    {meta ? (
                      <Link href={meta.path} target="_blank" className="hover:underline">{meta.title}</Link>
                    ) : "removed content"}
                    {c.heldReason ? ` · held: ${c.heldReason}` : ""}
                    {c.reportCount > 0 ? ` · ${c.reportCount} report${c.reportCount === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
                <CommentActions id={c.id} status={c.status} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
