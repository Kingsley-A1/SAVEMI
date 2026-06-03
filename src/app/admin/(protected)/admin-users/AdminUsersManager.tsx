"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Save, Trash2, UserPlus } from "lucide-react";

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  auditCount: number;
  lastAction: string | null;
  lastActionAt: string | null;
  isSuperAdmin: boolean;
  isCurrentUser: boolean;
}

interface AdminUsersManagerProps {
  admins: AdminUserRow[];
  superAdminEmail: string | null;
}

async function readError(response: Response, fallback: string): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);

  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }

  return fallback;
}

function formatDate(value: string | null): string {
  if (!value) return "No activity";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminUsersManager({
  admins,
  superAdminEmail,
}: AdminUsersManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreating(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");
    const accessCode = String(formData.get("accessCode") ?? "");

    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name, accessCode }),
    });

    setCreating(false);

    if (!response.ok) {
      setError(await readError(response, "Unable to create admin."));
      return;
    }

    event.currentTarget.reset();
    setSuccess("Admin user created.");
    router.refresh();
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusyId(id);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const name = String(formData.get("name") ?? "");

    const response = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, name }),
    });

    setBusyId(null);

    if (!response.ok) {
      setError(await readError(response, "Unable to update admin."));
      return;
    }

    setSuccess("Admin user updated.");
    router.refresh();
  }

  async function handleDelete(admin: AdminUserRow) {
    const confirmed = confirm(
      `Delete admin ${admin.email}? This removes their login access.`,
    );
    if (!confirmed) return;

    setError("");
    setSuccess("");
    setBusyId(admin.id);

    const response = await fetch(`/api/admin/users/${admin.id}`, {
      method: "DELETE",
    });

    setBusyId(null);

    if (!response.ok) {
      setError(await readError(response, "Unable to delete admin."));
      return;
    }

    setSuccess("Admin user deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
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

      {success ? (
        <div
          className="rounded border px-4 py-3 text-sm"
          style={{
            background: "rgba(22,163,74,0.08)",
            borderColor: "rgba(22,163,74,0.2)",
            color: "#15803d",
          }}
        >
          {success}
        </div>
      ) : null}

      <form onSubmit={handleCreate} className="site-panel space-y-4 p-5">
        <div>
          <h2 className="text-sm font-semibold">Create Admin</h2>
          <p className="text-brand-muted mt-1 text-xs">
            The new admin signs in with their email and the current six-character
            admin access code.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="field-label">Email *</span>
            <input
              name="email"
              type="email"
              required
              className="field-input mt-1"
              placeholder="admin@example.com"
            />
          </label>
          <label className="block">
            <span className="field-label">Name</span>
            <input
              name="name"
              className="field-input mt-1"
              placeholder="SAVEMI Admin"
            />
          </label>
          <label className="block">
            <span className="field-label">Admin Access Code *</span>
            <input
              name="accessCode"
              required
              minLength={6}
              maxLength={6}
              className="field-input mt-1"
              placeholder="6 characters"
            />
          </label>
        </div>

        <button
          type="submit"
          className="button-primary inline-flex items-center gap-1.5"
          disabled={creating}
        >
          <UserPlus size={14} />
          {creating ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <div className="site-panel overflow-hidden">
        <div className="border-b px-5 py-4" style={{ borderColor: "var(--brand-border)" }}>
          <h2 className="text-sm font-semibold">Admin Accounts</h2>
          <p className="text-brand-muted mt-1 text-xs">
            Super admin: {superAdminEmail ?? "not configured"}
          </p>
        </div>

        <div className="divide-y md:hidden">
          {admins.map((admin) => (
            <div key={admin.id} className="space-y-3 px-4 py-4">
              <div>
                <p className="text-sm font-semibold">{admin.name}</p>
                <p className="text-brand-muted text-xs">{admin.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {admin.isSuperAdmin ? <span className="type-badge">Super Admin</span> : null}
                {admin.isCurrentUser ? <span className="type-badge">You</span> : null}
                <span className="text-brand-muted text-xs">
                  {admin.auditCount} audit event{admin.auditCount === 1 ? "" : "s"}
                </span>
              </div>
              <form
                onSubmit={(event) => handleUpdate(event, admin.id)}
                className="space-y-2"
              >
                <input name="name" defaultValue={admin.name} className="field-input" />
                {admin.isSuperAdmin ? (
                  <input type="hidden" name="email" value={admin.email} />
                ) : (
                  <input
                    name="email"
                    type="email"
                    defaultValue={admin.email}
                    className="field-input"
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="button-tertiary inline-flex items-center gap-1.5"
                    disabled={busyId === admin.id}
                  >
                    <Save size={13} />
                    Save
                  </button>
                  <button
                    type="button"
                    className="button-tertiary inline-flex items-center gap-1.5"
                    style={{ borderColor: "rgba(220,38,38,0.3)", color: "#dc2626" }}
                    disabled={admin.isCurrentUser || admin.isSuperAdmin || busyId === admin.id}
                    onClick={() => handleDelete(admin)}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{ borderColor: "var(--brand-border)" }}
              >
                {["Admin", "Access", "Last Activity", "Audit", "Actions"].map(
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
            <tbody className="divide-y" style={{ borderColor: "var(--brand-border)" }}>
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-5 py-4 align-top">
                    <form
                      id={`admin-form-${admin.id}`}
                      onSubmit={(event) => handleUpdate(event, admin.id)}
                      className="grid gap-2"
                    >
                      <input
                        name="name"
                        defaultValue={admin.name}
                        className="field-input"
                      />
                      {admin.isSuperAdmin ? (
                        <input type="hidden" name="email" value={admin.email} />
                      ) : (
                        <input
                          name="email"
                          type="email"
                          defaultValue={admin.email}
                          className="field-input"
                        />
                      )}
                      {admin.isSuperAdmin ? (
                        <p className="text-brand-muted text-xs">{admin.email}</p>
                      ) : null}
                    </form>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      {admin.isSuperAdmin ? <span className="type-badge">Super Admin</span> : null}
                      {admin.isCurrentUser ? <span className="type-badge">You</span> : null}
                    </div>
                    <p className="text-brand-muted mt-2 text-xs">
                      Created {formatDate(admin.createdAt)}
                    </p>
                  </td>
                  <td className="text-brand-muted px-5 py-4 align-top text-xs">
                    <p>{admin.lastAction ?? "No activity"}</p>
                    <p>{formatDate(admin.lastActionAt)}</p>
                  </td>
                  <td className="text-brand-muted px-5 py-4 align-top text-xs">
                    {admin.auditCount} event{admin.auditCount === 1 ? "" : "s"}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        form={`admin-form-${admin.id}`}
                        className="button-tertiary inline-flex items-center gap-1.5"
                        disabled={busyId === admin.id}
                      >
                        <Save size={13} />
                        Save
                      </button>
                      <button
                        type="button"
                        className="button-tertiary inline-flex items-center gap-1.5"
                        style={{ borderColor: "rgba(220,38,38,0.3)", color: "#dc2626" }}
                        disabled={admin.isCurrentUser || admin.isSuperAdmin || busyId === admin.id}
                        onClick={() => handleDelete(admin)}
                      >
                        <Trash2 size={13} />
                        Delete
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
