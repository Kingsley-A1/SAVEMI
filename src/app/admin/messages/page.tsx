import { prisma, isDatabaseConfigured } from '../../../lib/db';
import Link from 'next/link';
import { PlusCircle, Edit2, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getMessages() {
  if (!isDatabaseConfigured()) return [];
  try {
    return await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
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
  PUBLISHED: 'background:rgba(22,163,74,0.1);color:#15803d',
  DRAFT: 'background:rgba(217,119,6,0.1);color:#b45309',
  ARCHIVED: 'background:rgba(100,116,139,0.1);color:#475569',
};

export default async function AdminMessagesPage() {
  const messages = await getMessages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-brand-muted mt-1 text-sm">
            {messages.length} total messages
          </p>
        </div>
        <Link
          href="/admin/messages/new"
          className="button-primary flex items-center gap-1.5"
        >
          <PlusCircle size={14} />
          New Message
        </Link>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--brand-border)',
                    background: 'rgba(10,79,60,0.03)',
                  }}
                >
                  {['Title', 'Type', 'Speaker', 'Status', 'Date', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide"
                        style={{ color: 'var(--brand-text-soft)' }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{ borderBottom: '1px solid var(--brand-border)' }}
                    className="hover:bg-[rgba(10,79,60,0.02)] transition-colors"
                  >
                    <td className="max-w-[200px] truncate px-4 py-3 font-medium">
                      {msg.title}
                    </td>
                    <td className="px-4 py-3">
                      <span className="type-badge">{msg.type}</span>
                    </td>
                    <td className="px-4 py-3 text-brand-muted">
                      {msg.speaker ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                        style={Object.fromEntries(
                          (STATUS_STYLE[msg.status] ?? '')
                            .split(';')
                            .filter(Boolean)
                            .map((s) => s.split(':').map((x) => x.trim()))
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
        )}
      </div>
    </div>
  );
}
