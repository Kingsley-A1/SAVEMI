import { auth } from "../../../../auth";
import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Audit Log | SAVEMI Admin",
  description: "Read-only record of all admin write operations.",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Human-readable label for an audit action. */
function labelAction(action: string): string {
  return action
    .replace(/\./g, " → ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ENTITY_COLOR: Record<string, string> = {
  Message: "var(--brand-primary)",
  Book:    "#7c6cf0",
  Quote:   "#d97706",
  AdminUser: "#dc2626",
};

export default async function AuditLogPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  let logs: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    adminEmail: string;
    ip: string | null;
    detail: string | null;
    createdAt: Date;
  }[] = [];

  try {
    logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
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
    });
  } catch {
    // DB may not have run the migration yet — render gracefully.
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg-primary)" }}>
            Audit Log
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            Read-only record of all admin write operations. Last 200 events.
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
          style={{ background: "rgba(10,79,60,0.1)", color: "var(--brand-primary)" }}
        >
          {logs.length} Events
        </span>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div
          className="rounded-xl border px-6 py-14 text-center"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            No audit events recorded yet. Events are created when admins
            create, edit, or delete content.
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-xl border"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left text-xs uppercase tracking-wider"
                style={{ borderColor: "var(--border-subtle)", color: "var(--fg-muted)", background: "var(--surface-elevated)" }}
              >
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Admin</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Detail</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                let detailParsed: Record<string, unknown> = {};
                try {
                  if (log.detail) detailParsed = JSON.parse(log.detail);
                } catch { /* ignore */ }

                const entityColor = ENTITY_COLOR[log.entityType] ?? "var(--fg-secondary)";

                return (
                  <tr
                    key={log.id}
                    className="border-b transition-colors"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: idx % 2 === 0 ? "transparent" : "var(--surface-elevated)",
                    }}
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3 font-mono text-xs"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--fg-primary)" }}>
                      {log.adminEmail}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ background: `${entityColor}18`, color: entityColor }}
                      >
                        {labelAction(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--fg-secondary)" }}>
                      <span style={{ color: entityColor, fontWeight: 600 }}>
                        {log.entityType}
                      </span>
                      {log.entityId && (
                        <span
                          className="ml-1 font-mono opacity-60"
                          title={log.entityId}
                        >
                          #{log.entityId.slice(-6)}
                        </span>
                      )}
                    </td>
                    <td
                      className="max-w-[240px] truncate px-4 py-3 text-xs font-mono"
                      style={{ color: "var(--fg-muted)" }}
                      title={log.detail ?? ""}
                    >
                      {Object.entries(detailParsed)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ") || "—"}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {log.ip ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
