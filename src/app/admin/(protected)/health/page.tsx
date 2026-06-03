import { Activity, AlertTriangle, CheckCircle2, Database, Shield } from "lucide-react";
import {
  getConfiguredAdminAccessCode,
} from "../../../../lib/admin-access";
import { getConfiguredSuperAdminEmail } from "../../../../lib/admin-permissions";
import { isDatabaseConfigured, prisma } from "../../../../lib/db";
import { isStorageConfigured } from "../../../../lib/r2";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Health | SAVEMI Admin",
  description: "Database-backed platform health and admin activity analytics.",
};

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  adminEmail: string;
  ip: string | null;
  detail: string | null;
  createdAt: Date;
}

interface AggregateRow {
  label: string;
  count: number;
  lastAt: Date | null;
  lastAction?: string;
}

function formatDate(value: Date | null): string {
  if (!value) return "No data";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function labelAction(action: string): string {
  return action
    .replace(/\./g, " -> ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function aggregateEvents(
  events: AuditEvent[],
  key: (event: AuditEvent) => string,
): AggregateRow[] {
  const map = new Map<string, AggregateRow>();

  for (const event of events) {
    const label = key(event);
    const existing = map.get(label);

    if (existing) {
      existing.count += 1;
      if (!existing.lastAt || event.createdAt > existing.lastAt) {
        existing.lastAt = event.createdAt;
        existing.lastAction = event.action;
      }
    } else {
      map.set(label, {
        label,
        count: 1,
        lastAt: event.createdAt,
        lastAction: event.action,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function parseDetail(detail: string | null): string {
  if (!detail) return "-";

  try {
    const parsed: unknown = JSON.parse(detail);
    if (!parsed || typeof parsed !== "object") return detail;

    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  } catch {
    return detail;
  }
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail?: string;
}) {
  return (
    <div className="site-panel p-4">
      <p className="text-brand-muted text-xs font-medium">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {detail ? <p className="text-brand-muted mt-1 text-xs">{detail}</p> : null}
    </div>
  );
}

function CheckCard({
  label,
  healthy,
  detail,
}: {
  label: string;
  healthy: boolean;
  detail: string;
}) {
  const Icon = healthy ? CheckCircle2 : AlertTriangle;

  return (
    <div className="site-panel flex gap-3 p-4">
      <Icon
        size={18}
        className="mt-0.5 shrink-0"
        style={{ color: healthy ? "#15803d" : "#b45309" }}
      />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-brand-muted mt-1 text-xs">{detail}</p>
      </div>
    </div>
  );
}

function AggregateTable({
  title,
  rows,
}: {
  title: string;
  rows: AggregateRow[];
}) {
  return (
    <div className="site-panel overflow-hidden">
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--brand-border)" }}>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-brand-muted p-4 text-sm">No activity recorded.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-brand-muted border-b text-left text-xs" style={{ borderColor: "var(--brand-border)" }}>
                <th className="px-4 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Count</th>
                <th className="px-4 py-3 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3">{row.count}</td>
                  <td className="text-brand-muted px-4 py-3 text-xs">{formatDate(row.lastAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default async function AdminHealthPage() {
  const dbConfigured = isDatabaseConfigured();
  const storageConfigured = isStorageConfigured();
  const authConfigured = Boolean(
    getConfiguredAdminAccessCode() &&
      (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
  );
  const superAdminEmail = getConfiguredSuperAdminEmail();

  if (!dbConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Platform Health</h1>
          <p className="text-brand-muted mt-1 text-sm">
            Database-backed analytics require `DATABASE_URL`.
          </p>
        </div>
        <CheckCard
          label="Database"
          healthy={false}
          detail="Database connection is not configured."
        />
      </div>
    );
  }

  const [
    totalMessages,
    publishedMessages,
    draftMessages,
    archivedMessages,
    videoMessages,
    audioMessages,
    imageMessages,
    publishedHeroMessages,
    totalBooks,
    publishedBooks,
    draftBooks,
    archivedBooks,
    freeBooks,
    paidBooks,
    publishedFreeBooksMissingLinks,
    publishedPaidBooksMissingLinks,
    totalQuotes,
    publishedQuotes,
    draftQuotes,
    archivedQuotes,
    featuredQuotes,
    contacts,
    admins,
    latestMessage,
    latestBook,
    latestQuote,
    latestContact,
    superAdminRecord,
  ] = await Promise.all([
    prisma.message.count(),
    prisma.message.count({ where: { status: "PUBLISHED" } }),
    prisma.message.count({ where: { status: "DRAFT" } }),
    prisma.message.count({ where: { status: "ARCHIVED" } }),
    prisma.message.count({ where: { type: "VIDEO" } }),
    prisma.message.count({ where: { type: "AUDIO" } }),
    prisma.message.count({ where: { type: "IMAGE" } }),
    prisma.message.count({ where: { status: "PUBLISHED", placement: "HERO" } }),
    prisma.book.count(),
    prisma.book.count({ where: { status: "PUBLISHED" } }),
    prisma.book.count({ where: { status: "DRAFT" } }),
    prisma.book.count({ where: { status: "ARCHIVED" } }),
    prisma.book.count({ where: { availability: "FREE" } }),
    prisma.book.count({ where: { availability: "PAID" } }),
    prisma.book.count({
      where: {
        status: "PUBLISHED",
        availability: "FREE",
        downloadUrl: null,
      },
    }),
    prisma.book.count({
      where: {
        status: "PUBLISHED",
        availability: "PAID",
        purchaseUrl: null,
      },
    }),
    prisma.quote.count(),
    prisma.quote.count({ where: { status: "PUBLISHED" } }),
    prisma.quote.count({ where: { status: "DRAFT" } }),
    prisma.quote.count({ where: { status: "ARCHIVED" } }),
    prisma.quote.count({ where: { featured: true } }),
    prisma.contactSubmission.count(),
    prisma.adminUser.count(),
    prisma.message.findFirst({
      orderBy: { createdAt: "desc" },
      select: { title: true, createdAt: true, status: true },
    }),
    prisma.book.findFirst({
      orderBy: { createdAt: "desc" },
      select: { title: true, createdAt: true, status: true },
    }),
    prisma.quote.findFirst({
      orderBy: { createdAt: "desc" },
      select: { title: true, createdAt: true, status: true },
    }),
    prisma.contactSubmission.findFirst({
      orderBy: { createdAt: "desc" },
      select: { email: true, createdAt: true },
    }),
    superAdminEmail
      ? prisma.adminUser.findUnique({
          where: { email: superAdminEmail },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  let auditAvailable = true;
  let auditEventsCount = 0;
  let recentEvents: AuditEvent[] = [];

  try {
    [auditEventsCount, recentEvents] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          adminEmail: true,
          ip: true,
          detail: true,
          createdAt: true,
        },
      }),
    ]);
  } catch {
    auditAvailable = false;
  }

  let messageMediaCheckAvailable = true;
  let publishedMessagesMissingMedia = 0;

  try {
    publishedMessagesMissingMedia = await prisma.message.count({
      where: {
        status: "PUBLISHED",
        mediaKey: null,
        externalMediaUrl: null,
      },
    });
  } catch {
    messageMediaCheckAvailable = false;
  }

  const qualityIssues = [
    {
      label: "Published messages without media",
      value: publishedMessagesMissingMedia,
    },
    {
      label: "Published free books without download link",
      value: publishedFreeBooksMissingLinks,
    },
    {
      label: "Published paid books without purchase link",
      value: publishedPaidBooksMissingLinks,
    },
    {
      label: "Published hero records",
      value: publishedHeroMessages,
      expected: "1 recommended",
    },
    {
      label: "Audit migration available",
      value: auditAvailable ? 1 : 0,
      expected: "1 required",
    },
    {
      label: "Message media schema check",
      value: messageMediaCheckAvailable ? 1 : 0,
      expected: "1 required",
    },
  ];

  const byAdmin = aggregateEvents(recentEvents, (event) => event.adminEmail);
  const byAction = aggregateEvents(recentEvents, (event) => labelAction(event.action));
  const byEntity = aggregateEvents(recentEvents, (event) => event.entityType);
  const byIp = aggregateEvents(recentEvents, (event) => event.ip ?? "unknown");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Platform Health</h1>
          <p className="text-brand-muted mt-1 text-sm">
            Database-backed health, content readiness, and admin activity
            analytics for launch operations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded px-3 py-2 text-xs font-semibold" style={{ background: "rgba(10,79,60,0.08)", color: "var(--brand-primary)" }}>
          <Activity size={14} />
          Last 100 audit events
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <CheckCard
          label="Database"
          healthy={dbConfigured}
          detail="Database is configured and this page successfully queried platform records."
        />
        <CheckCard
          label="Auth"
          healthy={authConfigured}
          detail={authConfigured ? "Admin code and auth secret are configured." : "Admin code or auth secret is missing."}
        />
        <CheckCard
          label="Super Admin"
          healthy={Boolean(superAdminEmail && superAdminRecord)}
          detail={
            superAdminEmail && superAdminRecord
              ? `${superAdminEmail} exists as the configured super admin.`
              : "Configured super admin email is missing or not registered."
          }
        />
        <CheckCard
          label="Storage"
          healthy={storageConfigured}
          detail={storageConfigured ? "Cloudflare R2 upload settings are configured." : "R2 settings are incomplete; uploads may fail."}
        />
        <CheckCard
          label="Audit Trail"
          healthy={auditAvailable}
          detail={
            auditAvailable
              ? "Audit table is available for admin action analytics."
              : "Audit table is missing; run migrations before launch."
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Messages" value={totalMessages} detail={`${publishedMessages} published`} />
        <StatCard label="Books" value={totalBooks} detail={`${publishedBooks} published`} />
        <StatCard label="Quotes" value={totalQuotes} detail={`${publishedQuotes} published`} />
        <StatCard label="Contacts" value={contacts} detail="Visitor submissions" />
        <StatCard label="Admins" value={admins} detail="Registered operators" />
        <StatCard label="Audit Events" value={auditEventsCount} detail="Recorded admin actions" />
        <StatCard label="Published Hero" value={publishedHeroMessages} detail="One is recommended" />
        <StatCard label="Storage" value={storageConfigured ? "Ready" : "Check"} detail="R2 media pipeline" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="site-panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database size={16} style={{ color: "var(--brand-primary)" }} />
            <h2 className="text-sm font-semibold">Content State</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p>Messages: {publishedMessages} published, {draftMessages} draft, {archivedMessages} archived.</p>
            <p>Books: {publishedBooks} published, {draftBooks} draft, {archivedBooks} archived.</p>
            <p>Quotes: {publishedQuotes} published, {draftQuotes} draft, {archivedQuotes} archived.</p>
            <p className="text-brand-muted text-xs">
              Message mix: {videoMessages} video, {audioMessages} audio, {imageMessages} image.
            </p>
            <p className="text-brand-muted text-xs">
              Book mix: {freeBooks} free, {paidBooks} paid. Featured quotes: {featuredQuotes}.
            </p>
          </div>
        </div>

        <div className="site-panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--brand-primary)" }} />
            <h2 className="text-sm font-semibold">Latest Records</h2>
          </div>
          <div className="space-y-2 text-sm">
            <p>Message: {latestMessage?.title ?? "None"} <span className="text-brand-muted text-xs">({latestMessage?.status ?? "n/a"})</span></p>
            <p>Book: {latestBook?.title ?? "None"} <span className="text-brand-muted text-xs">({latestBook?.status ?? "n/a"})</span></p>
            <p>Quote: {latestQuote?.title ?? "None"} <span className="text-brand-muted text-xs">({latestQuote?.status ?? "n/a"})</span></p>
            <p>Contact: {latestContact?.email ?? "None"} <span className="text-brand-muted text-xs">({formatDate(latestContact?.createdAt ?? null)})</span></p>
          </div>
        </div>

        <div className="site-panel p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: "#b45309" }} />
            <h2 className="text-sm font-semibold">Launch Warnings</h2>
          </div>
          <div className="space-y-2">
            {qualityIssues.map((issue) => (
              <div key={issue.label} className="flex items-center justify-between gap-3 text-sm">
                <span>{issue.label}</span>
                <span className="text-right">
                  <span className="block font-semibold">{issue.value}</span>
                  {"expected" in issue ? (
                    <span className="text-brand-muted text-[11px]">{issue.expected}</span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
          <p className="text-brand-muted mt-3 text-xs">
            Public page-view analytics are not counted because this build does
            not add a tracking service or analytics table.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AggregateTable title="Who: Admin Activity" rows={byAdmin} />
        <AggregateTable title="What: Action Types" rows={byAction} />
        <AggregateTable title="Where: IP Sources" rows={byIp} />
        <AggregateTable title="How: Entity Work" rows={byEntity} />
      </div>

      <div className="site-panel overflow-hidden">
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--brand-border)" }}>
          <h2 className="text-sm font-semibold">When: Recent Admin Events</h2>
          <p className="text-brand-muted mt-1 text-xs">
            Shows who did what, where it came from, when it happened, and the
            recorded action detail.
          </p>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-brand-muted p-4 text-sm">No admin activity recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-muted border-b text-left text-xs" style={{ borderColor: "var(--brand-border)" }}>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Who</th>
                  <th className="px-4 py-3 font-medium">What</th>
                  <th className="px-4 py-3 font-medium">Where</th>
                  <th className="px-4 py-3 font-medium">How</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
                {recentEvents.slice(0, 50).map((event) => (
                  <tr key={event.id}>
                    <td className="text-brand-muted whitespace-nowrap px-4 py-3 text-xs">{formatDate(event.createdAt)}</td>
                    <td className="px-4 py-3 font-medium">{event.adminEmail}</td>
                    <td className="px-4 py-3">
                      <span className="type-badge">{labelAction(event.action)}</span>
                      <p className="text-brand-muted mt-1 text-xs">{event.entityType}{event.entityId ? ` #${event.entityId.slice(-6)}` : ""}</p>
                    </td>
                    <td className="text-brand-muted px-4 py-3 text-xs">{event.ip ?? "unknown"}</td>
                    <td className="text-brand-muted max-w-[320px] truncate px-4 py-3 text-xs" title={event.detail ?? ""}>
                      {parseDetail(event.detail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
