import Link from "next/link";
import { notFound } from "next/navigation";
import { isDatabaseConfigured, prisma } from "../../../../../../lib/db";
import { getRecentActivity } from "../../../../../../lib/analytics";
import { lookupContent } from "../../../../../../lib/engagement";
import ActivityFeed, { timeAgo } from "../../ActivityFeed";

export const dynamic = "force-dynamic";

export const metadata = { title: "Member activity | SAVEMI Admin" };

const STATUS_LABEL = { VISIBLE: "Live", HELD: "Awaiting review", HIDDEN: "Hidden" } as const;

export default async function MemberActivityPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDatabaseConfigured()) notFound();
  const { id } = await params;

  const member = await prisma.siteUser.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, status: true, createdAt: true, lastLoginAt: true },
  });
  if (!member) notFound();

  const [counts, activity, comments] = await Promise.all([
    prisma.engagementEvent.groupBy({ by: ["type"], where: { userId: id }, _count: { _all: true } }),
    getRecentActivity(100, { userId: id }, true),
    prisma.comment.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, body: true, status: true, createdAt: true, targetKind: true, targetId: true },
    }),
  ]);

  const total = (type: string) => counts.find((c) => c.type === type)?._count._all ?? 0;
  const content = await lookupContent(comments.map((c) => ({ kind: c.targetKind, id: c.targetId })));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/analytics" className="text-brand-muted text-sm hover:text-brand-primary">
          ← Analytics
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{member.name}</h1>
        <p className="text-brand-muted mt-1 text-sm">
          {member.email} · joined {member.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          {member.lastLoginAt ? ` · last signed in ${timeAgo(member.lastLoginAt)}` : ""}
          {member.status === "SUSPENDED" ? " · suspended" : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[["Views", "VIEW"], ["Plays", "PLAY"], ["Downloads", "DOWNLOAD"], ["Likes", "LIKE"], ["Comments", "COMMENT"]].map(([label, type]) => (
          <div key={type} className="site-panel p-3">
            <p className="text-brand-muted text-xs">{label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{total(type)}</p>
          </div>
        ))}
      </div>

      {comments.length > 0 ? (
        <section className="site-panel overflow-hidden">
          <h2 className="border-b px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-border)" }}>
            Comments
          </h2>
          <ul className="divide-y divide-[color:var(--brand-border)]">
            {comments.map((c) => {
              const meta = content.get(`${c.targetKind}:${c.targetId}`);
              return (
                <li key={c.id} className="px-5 py-3 text-sm">
                  <p className="text-brand-muted text-xs">
                    {meta ? (
                      <Link href={meta.path} target="_blank" className="hover:underline">{meta.title}</Link>
                    ) : "Removed content"}
                    {" · "}{timeAgo(c.createdAt)}{" · "}{STATUS_LABEL[c.status]}
                  </p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line">{c.body}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="site-panel overflow-hidden">
        <h2 className="border-b px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-border)" }}>
          Activity
        </h2>
        <ActivityFeed rows={activity} empty="No activity recorded yet." />
      </section>
    </div>
  );
}
