"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CheckCircle2, LogOut, Save } from "lucide-react";
import { LoadingButton } from "../../components/ui/Loading";
import { MIN_PASSWORD_LENGTH } from "../../lib/site-users";

export default function ProfileForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Unable to update your profile.");
        return;
      }

      setSuccess(payload?.message ?? "Profile updated.");
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } catch {
      setError("The request failed. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="site-panel space-y-4 p-5 sm:p-6">
        <div>
          <p className="eyebrow text-brand-primary">Your details</p>
          <h2 className="mt-1 text-base font-semibold">Profile</h2>
        </div>

        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            className="field-input"
            value={email}
            disabled
            readOnly
          />
          <p className="text-brand-muted mt-1 text-xs">
            Contact the ministry if you need to change your email address.
          </p>
        </div>

        <div>
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <input
            id="name"
            className="field-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </div>
      </section>

      <section className="site-panel space-y-4 p-5 sm:p-6">
        <div>
          <p className="eyebrow text-brand-primary">Security</p>
          <h2 className="mt-1 text-base font-semibold">Change password</h2>
          <p className="text-brand-muted mt-1 text-xs">
            Leave these blank to keep your current password.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="currentPassword" className="field-label">
              Current password
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className="field-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="field-label">
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              className="field-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {error ? (
        <p
          role="alert"
          className="rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(220,38,38,0.07)",
            color: "#b91c1c",
            border: "1px solid rgba(220,38,38,0.2)",
          }}
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="flex items-center gap-2 rounded px-3 py-2 text-xs"
          style={{
            background: "rgba(22,163,74,0.08)",
            color: "#15803d",
            border: "1px solid rgba(22,163,74,0.18)",
          }}
        >
          <CheckCircle2 size={14} />
          {success}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="button-tertiary inline-flex items-center gap-1.5 sm:mr-auto"
        >
          <LogOut size={14} />
          Sign out
        </button>

        <LoadingButton
          type="submit"
          loading={saving}
          loadingLabel="Saving…"
          icon={<Save size={14} />}
        >
          Save changes
        </LoadingButton>
      </div>
    </form>
  );
}
