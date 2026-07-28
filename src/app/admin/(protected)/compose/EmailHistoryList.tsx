"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, MailCheck, AlertTriangle } from "lucide-react";

export interface SentEmailRow {
  id: string;
  subject: string;
  bodyText: string;
  scriptureReference: string | null;
  recipients: string[];
  sentCount: number;
  failedCount: number;
  sentByName: string | null;
  sentByEmail: string;
  createdAt: string;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function EmailHistoryList({
  history,
}: {
  history: SentEmailRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDelete(entry: SentEmailRow) {
    const confirmed = confirm(
      `Remove "${entry.subject}" from your sent history? This does not recall the email from recipients' inboxes.`,
    );
    if (!confirmed) return;

    setError("");
    setBusyId(entry.id);

    const response = await fetch(`/api/admin/email/${entry.id}`, {
      method: "DELETE",
    });

    setBusyId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? "Unable to delete this entry.");
      return;
    }

    router.refresh();
  }

  if (history.length === 0) {
    return (
      <div className="site-panel p-5 sm:p-6">
        <p className="field-label">Sent history</p>
        <p className="text-brand-muted mt-2 text-sm">
          Emails you compose and send will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="site-panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="field-label">Sent history</p>
        <span className="text-brand-muted text-xs">
          {history.length} message{history.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(220,38,38,0.07)",
            color: "#b91c1c",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          {error}
        </p>
      ) : null}

      <ul className="mt-3 divide-y" style={{ borderColor: "var(--brand-border)" }}>
        {history.map((entry) => (
          <li key={entry.id} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{entry.subject}</p>
              <p className="text-brand-muted mt-0.5 truncate text-xs">
                To {entry.recipients.length} recipient
                {entry.recipients.length === 1 ? "" : "s"} · {formatDate(entry.createdAt)}
              </p>
              <p className="text-brand-muted mt-0.5 truncate text-xs">
                Sent by {entry.sentByName ?? entry.sentByEmail}
              </p>
              <p
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium"
                style={{
                  color: entry.failedCount > 0 ? "#b45309" : "#15803d",
                }}
              >
                {entry.failedCount > 0 ? (
                  <>
                    <AlertTriangle size={12} />
                    {entry.sentCount} delivered, {entry.failedCount} failed
                  </>
                ) : (
                  <>
                    <MailCheck size={12} />
                    Delivered to all {entry.sentCount}
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDelete(entry)}
              disabled={busyId === entry.id}
              className="button-tertiary inline-flex shrink-0 items-center gap-1.5"
              style={{ borderColor: "rgba(220,38,38,0.3)", color: "#dc2626" }}
              aria-label={`Delete "${entry.subject}" from history`}
            >
              <Trash2 size={13} />
              {busyId === entry.id ? "Removing…" : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
