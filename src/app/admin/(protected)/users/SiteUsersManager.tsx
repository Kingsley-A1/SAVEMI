"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle2, Mail, Trash2 } from "lucide-react";

export interface SiteUserRow {
  id: string;
  email: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  lastLoginAt: string | null;
  createdAt: string;
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

const STATUS_STYLE: Record<string, { background: string; color: string }> = {
  ACTIVE: { background: "rgba(22,163,74,0.1)", color: "#15803d" },
  SUSPENDED: { background: "rgba(220,38,38,0.08)", color: "#b91c1c" },
};

export default function SiteUsersManager({ users }: { users: SiteUserRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function request(
    user: SiteUserRow,
    init: RequestInit,
    fallback: string,
  ) {
    setError("");
    setBusyId(user.id);

    const response = await fetch(`/api/admin/site-users/${user.id}`, init);

    setBusyId(null);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(payload?.error ?? fallback);
      return;
    }

    router.refresh();
  }

  function toggleStatus(user: SiteUserRow) {
    const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    if (
      nextStatus === "SUSPENDED" &&
      !confirm(`Suspend ${user.email}? They will not be able to sign in.`)
    ) {
      return;
    }

    void request(
      user,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      },
      "Unable to update this member.",
    );
  }

  function remove(user: SiteUserRow) {
    if (
      !confirm(
        `Delete ${user.email}? Their account is removed permanently and cannot be recovered.`,
      )
    ) {
      return;
    }

    void request(
      user,
      { method: "DELETE" },
      "Unable to delete this member.",
    );
  }

  if (users.length === 0) {
    return (
      <div className="site-panel px-6 py-12 text-center">
        <p className="text-brand-muted text-sm">
          No members have registered yet.
        </p>
        <p className="text-brand-muted mt-1 text-xs">
          People who sign up at /register will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div
          role="alert"
          className="rounded border px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.07)",
            borderColor: "rgba(220,38,38,0.2)",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="site-panel overflow-hidden">
        {/* Mobile */}
        <div className="divide-y md:hidden">
          {users.map((user) => (
            <div key={user.id} className="space-y-3 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-brand-muted truncate text-xs">
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className="rounded px-2 py-0.5 font-semibold"
                  style={STATUS_STYLE[user.status]}
                >
                  {user.status}
                </span>
                <span className="text-brand-muted">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`mailto:${user.email}`}
                  className="button-tertiary inline-flex items-center gap-1.5"
                >
                  <Mail size={13} /> Email
                </a>
                <button
                  type="button"
                  onClick={() => toggleStatus(user)}
                  disabled={busyId === user.id}
                  className="button-tertiary inline-flex items-center gap-1.5"
                >
                  {user.status === "ACTIVE" ? (
                    <>
                      <Ban size={13} /> Suspend
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Reactivate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => remove(user)}
                  disabled={busyId === user.id}
                  className="button-tertiary inline-flex items-center gap-1.5"
                  style={{
                    borderColor: "rgba(220,38,38,0.3)",
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{ borderColor: "var(--brand-border)" }}
              >
                {["Member", "Status", "Last sign-in", "Joined", "Actions"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="text-brand-muted px-5 py-3 text-xs font-medium"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--brand-border)" }}
            >
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-white/40">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-brand-muted text-xs">{user.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                      style={STATUS_STYLE[user.status]}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="text-brand-muted px-5 py-3 text-xs">
                    {formatDate(user.lastLoginAt)}
                  </td>
                  <td className="text-brand-muted px-5 py-3 text-xs">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={`mailto:${user.email}`}
                        className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                      >
                        <Mail size={13} /> Email
                      </a>
                      <button
                        type="button"
                        onClick={() => toggleStatus(user)}
                        disabled={busyId === user.id}
                        className="text-brand-muted hover:text-brand-primary inline-flex items-center gap-1 text-xs"
                      >
                        {user.status === "ACTIVE" ? (
                          <>
                            <Ban size={13} /> Suspend
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={13} /> Reactivate
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(user)}
                        disabled={busyId === user.id}
                        className="inline-flex items-center gap-1 text-xs"
                        style={{ color: "#dc2626" }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
