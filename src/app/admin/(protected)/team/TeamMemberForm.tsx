"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, X } from "lucide-react";
import AdminUploadField from "../../../../components/AdminUploadField";
import { LoadingButton } from "../../../../components/ui/Loading";
import { uploadAdminFile } from "../../../../lib/admin-upload-client";
import {
  TEAM_ROLE_LABEL,
  TEAM_ROLE_ORDER,
  type TeamRole,
} from "../../../../lib/team";
// The form's shape and its blank value live in a plain module so the server
// components that render this form can build initial values without calling
// into a client module.
import type { TeamMemberFormValues } from "../../../../lib/team-form";

type UploadState = "idle" | "uploading" | "done" | "error";

export type { TeamMemberFormValues };

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export default function TeamMemberForm({
  initial,
  mode,
}: {
  initial: TeamMemberFormValues;
  mode: "create" | "edit";
}) {
  const router = useRouter();

  const [form, setForm] = useState<TeamMemberFormValues>(initial);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUpload, setPhotoUpload] = useState<{
    state: UploadState;
    progress: number;
    error: string;
  }>({ state: "idle", progress: 0, error: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const isUploading = photoUpload.state === "uploading";

  function update<K extends keyof TeamMemberFormValues>(
    key: K,
    value: TeamMemberFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoChange(file: File | null) {
    setPhotoFile(file);

    if (!file) {
      update("photoKey", "");
      return;
    }

    setError("");
    setPhotoUpload({ state: "uploading", progress: 0, error: "" });

    try {
      const result = await uploadAdminFile({
        file,
        fileName: `team-${Date.now()}-${file.name}`,
        onProgress: (progress) =>
          setPhotoUpload({ state: "uploading", progress, error: "" }),
      });

      update("photoKey", result.objectKey);
      setPhotoUpload({ state: "done", progress: 100, error: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setPhotoUpload({ state: "error", progress: 0, error: message });
      setError(message);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name: form.name,
      title: form.title,
      role: form.role,
      status: form.status,
      sortOrder: Number(form.sortOrder) || 0,
      bio: form.bio,
      photoKey: form.photoKey,
      email: form.email,
      phone: form.phone,
      facebookUrl: form.facebookUrl,
      youtubeUrl: form.youtubeUrl,
      whatsappNumber: form.whatsappNumber,
      scriptureVerse: form.scriptureVerse,
      scriptureReference: form.scriptureReference,
    };

    const response = await fetch(
      mode === "create" ? "/api/admin/team" : `/api/admin/team/${form.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Failed to save team member.");
      return;
    }

    router.push("/admin/team");
    router.refresh();
  }

  async function handleDelete() {
    if (!form.id) return;

    const confirmed = confirm(
      `Remove ${form.name} from the ministry team? This cannot be undone.`,
    );
    if (!confirmed) return;

    setError("");
    setDeleting(true);

    const response = await fetch(`/api/admin/team/${form.id}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Failed to delete team member.");
      return;
    }

    router.push("/admin/team");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="site-panel space-y-5 p-5">
        <div>
          <p className="eyebrow text-brand-primary">Identity</p>
          <h2 className="mt-1 text-base font-semibold">Who they are</h2>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="name" className="field-label">
              Full name *
            </label>
            <input
              id="name"
              required
              className="field-input"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="title" className="field-label">
              Title *
            </label>
            <input
              id="title"
              required
              className="field-input"
              placeholder="e.g. Ministry Anchor"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="role" className="field-label">
              Role band
            </label>
            <select
              id="role"
              className="field-input"
              value={form.role}
              onChange={(e) => update("role", e.target.value as TeamRole)}
            >
              {TEAM_ROLE_ORDER.map((role) => (
                <option key={role} value={role}>
                  {TEAM_ROLE_LABEL[role]}
                </option>
              ))}
            </select>
            <p className="text-brand-muted mt-1 text-xs">
              Determines placement on the public page. The Ministry Anchor
              leads with the largest card.
            </p>
          </div>

          <div className="min-w-0">
            <label htmlFor="sortOrder" className="field-label">
              Order within band
            </label>
            <input
              id="sortOrder"
              type="number"
              className="field-input"
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", Number(e.target.value))}
            />
            <p className="text-brand-muted mt-1 text-xs">
              Lower numbers come first. Ties fall back to name order.
            </p>
          </div>

          <div className="min-w-0 sm:col-span-2">
            <AdminUploadField
              label="Photo"
              mediaKind="cover"
              accept="image/*"
              file={photoFile}
              objectKey={form.photoKey}
              externalUrl={form.photoKey ? "" : form.photoUrl}
              uploadState={photoUpload.state}
              progress={photoUpload.progress}
              successLabel="Photo uploaded"
              helperText="A clear head-and-shoulders portrait works best"
              errorMessage={photoUpload.error}
              onFileChange={handlePhotoChange}
              onRetry={() => {
                if (photoFile) void handlePhotoChange(photoFile);
              }}
              onValidationError={(message) => {
                setPhotoUpload({ state: "error", progress: 0, error: message });
                setError(message);
              }}
            />
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="bio" className="field-label">
              Biography
            </label>
            <textarea
              id="bio"
              rows={4}
              className="field-input"
              placeholder="A short paragraph about their service to the ministry."
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
            />
          </div>
        </div>
      </section>

      <details className="site-panel group p-5">
        <summary className="text-brand-primary cursor-pointer list-none text-sm font-semibold">
          Contact, handles, and scripture
          <span className="text-brand-muted ml-2 font-normal">
            Optional — blank fields simply don&apos;t show
          </span>
        </summary>

        <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="phone" className="field-label">
              Phone
            </label>
            <input
              id="phone"
              className="field-input"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="whatsappNumber" className="field-label">
              WhatsApp
            </label>
            <input
              id="whatsappNumber"
              className="field-input"
              placeholder="2348012345678 or a wa.me link"
              value={form.whatsappNumber}
              onChange={(e) => update("whatsappNumber", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="facebookUrl" className="field-label">
              Facebook URL
            </label>
            <input
              id="facebookUrl"
              type="url"
              className="field-input"
              value={form.facebookUrl}
              onChange={(e) => update("facebookUrl", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="youtubeUrl" className="field-label">
              YouTube URL
            </label>
            <input
              id="youtubeUrl"
              type="url"
              className="field-input"
              value={form.youtubeUrl}
              onChange={(e) => update("youtubeUrl", e.target.value)}
            />
          </div>

          <div className="min-w-0">
            <label htmlFor="scriptureReference" className="field-label">
              Scripture reference
            </label>
            <input
              id="scriptureReference"
              className="field-input"
              placeholder="e.g. Psalm 23:1"
              value={form.scriptureReference}
              onChange={(e) => update("scriptureReference", e.target.value)}
            />
          </div>

          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="scriptureVerse" className="field-label">
              Scripture verse
            </label>
            <textarea
              id="scriptureVerse"
              rows={2}
              className="field-input"
              placeholder="A verse this member is known for."
              value={form.scriptureVerse}
              onChange={(e) => update("scriptureVerse", e.target.value)}
            />
          </div>
        </div>
      </details>

      <section className="site-panel space-y-4 p-5">
        <div>
          <p className="eyebrow text-brand-primary">Visibility</p>
          <h2 className="mt-1 text-base font-semibold">Publish settings</h2>
        </div>

        <div className="max-w-xs">
          <label htmlFor="status" className="field-label">
            Status
          </label>
          <select
            id="status"
            className="field-input"
            value={form.status}
            onChange={(e) =>
              update("status", e.target.value as TeamMemberFormValues["status"])
            }
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <p className="text-brand-muted mt-1 text-xs">
            Only published members appear on the public team page.
          </p>
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {mode === "edit" ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="button-tertiary inline-flex items-center gap-1.5 sm:mr-auto"
            style={{ borderColor: "rgba(220,38,38,0.3)", color: "#dc2626" }}
          >
            <Trash2 size={14} />
            {deleting ? "Removing…" : "Remove member"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => router.push("/admin/team")}
          className="button-tertiary inline-flex items-center gap-1.5"
        >
          <X size={14} />
          Cancel
        </button>

        <LoadingButton
          type="submit"
          loading={saving}
          loadingLabel="Saving…"
          icon={<Save size={14} />}
          disabled={saving || deleting || isUploading}
        >
          {mode === "create" ? "Add member" : "Save changes"}
        </LoadingButton>
      </div>
    </form>
  );
}
