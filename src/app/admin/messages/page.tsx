import { prisma, isDatabaseConfigured } from "../../../lib/db";
import Link from "next/link";
import { PlusCircle, Edit2, Eye, Clapperboard } from "lucide-react";

export const dynamic = "force-dynamic";

async function getMessages() {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        placement: true,
        status: true,
        speaker: true,
        publishedAt: true,
        createdAt: true,
        slug: true,
      },
    });
  } catch {
    return [];
  }
}

const STATUS_STYLE: Record<string, string> = {
  PUBLISHED: "background:rgba(22,163,74,0.1);color:#15803d",
  DRAFT: "background:rgba(217,119,6,0.1);color:#b45309",
  ARCHIVED: "background:rgba(100,116,139,0.1);color:#475569",
};

const PLACEMENT_STYLE: Record<string, string> = {
  HERO: "background:rgba(10,79,60,0.1);color:#0a4f3c",
  STANDARD: "background:rgba(15,23,42,0.06);color:#334155",
};

export default async function AdminMessagesPage() {
  const messages = await getMessages();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {messages.length} total messages
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/messages/new?placement=HERO"
            className="button-tertiary flex items-center gap-1.5"
          >
            <Clapperboard size={14} />
            New Hero Media
          </Link>
          <Link
            href="/admin/messages/new"
            className="button-primary flex items-center gap-1.5"
          >
            <PlusCircle size={14} />
            New Message
          </Link>
        </div>
      </div>

      <div className="site-panel overflow-hidden">
        {messages.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-brand-muted text-sm">No messages yet.</p>
            <Link
              href="/admin/messages/new"
              className="button-primary mt-3 inline-flex items-center gap-1.5"
            >
              <PlusCircle size={14} />
              Create your first message
            </Link>
          </div>
        ) : (
          <>
            <div className="divide-y md:hidden">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{msg.title}</p>
                      <p className="text-brand-muted mt-1 text-xs">
                        {msg.speaker ?? "No speaker"}
                      </p>
                    </div>
                    <span className="text-brand-muted shrink-0 text-xs">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="type-badge">{msg.type}</span>
                    <span
                      className="inline-block rounded px-2 py-0.5 font-semibold"
                      style={Object.fromEntries(
                        (STATUS_STYLE[msg.status] ?? "")
                          .split(";")
                          .filter(Boolean)
                          .map((segment) =>
                            segment.split(":").map((value) => value.trim()),
                          ),
                      )}
                    >
                      {msg.status}
                    </span>
                    <span
                      className="inline-block rounded px-2 py-0.5 font-semibold"
                      style={Object.fromEntries(
                        (PLACEMENT_STYLE[msg.placement] ?? "")
                          .split(";")
                          .filter(Boolean)
                          .map((segment) =>
                            segment.split(":").map((value) => value.trim()),
                          ),
                      )}
                    >
                      {msg.placement}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/messages/${msg.slug}`}
                      className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                      target="_blank"
                    >
                      <Eye size={14} /> Preview
                    </Link>
                    <Link
                      href={`/admin/messages/${msg.id}/edit`}
                      className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                    >
                      <Edit2 size={14} /> Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--brand-border)",
                    background: "rgba(10,79,60,0.03)",
                  }}
                >
                  {["Title", "Type", "Placement", "Speaker", "Status", "Date", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                        style={{ color: "var(--brand-text-soft)" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{ borderBottom: "1px solid var(--brand-border)" }}
                    className="hover:bg-[rgba(10,79,60,0.02)] transition-colors"
                  >
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium">
                      {msg.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="type-badge">{msg.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                        style={Object.fromEntries(
                          (PLACEMENT_STYLE[msg.placement] ?? "")
                            .split(";")
                            .filter(Boolean)
                            .map((segment) =>
                              segment.split(":").map((value) => value.trim()),
                            ),
                        )}
                      >
                        {msg.placement}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {msg.speaker ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                        style={Object.fromEntries(
                          (STATUS_STYLE[msg.status] ?? "")
                            .split(";")
                            .filter(Boolean)
                            .map((s) => s.split(":").map((x) => x.trim())),
                        )}
                      >
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted text-xs">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/messages/${msg.slug}`}
                          className="text-brand-muted hover:text-brand-primary"
                          target="_blank"
                          aria-label="Preview"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          href={`/admin/messages/${msg.id}/edit`}
                          className="text-brand-muted hover:text-brand-primary"
                          aria-label="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
