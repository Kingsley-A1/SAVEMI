"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Trash2, Upload } from "lucide-react";

const MESSAGE_TYPES = ["VIDEO", "AUDIO", "IMAGE"] as const;
const MESSAGE_PLACEMENTS = ["STANDARD", "HERO"] as const;
const MESSAGE_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

type UploadState = "idle" | "uploading" | "done" | "error";

interface MessageData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  type: "VIDEO" | "AUDIO" | "IMAGE";
  placement: "STANDARD" | "HERO";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  speaker: string | null;
  scriptureReference: string | null;
  eventDate: Date | null;
  durationSeconds: number | null;
  mediaKey: string | null;
  coverImageKey: string | null;
}

export default function EditMessageForm({ message }: { message: MessageData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: message.title,
    slug: message.slug,
    summary: message.summary,
    description: message.description,
    type: message.type,
    placement: message.placement,
    status: message.status,
    speaker: message.speaker ?? "",
    scriptureReference: message.scriptureReference ?? "",
    eventDate: message.eventDate
      ? new Date(message.eventDate).toISOString().slice(0, 10)
      : "",
    durationSeconds: message.durationSeconds?.toString() ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaKey, setMediaKey] = useState(message.mediaKey ?? "");
  const [coverKey, setCoverKey] = useState(message.coverImageKey ?? "");
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "type" && value === "AUDIO"
        ? { placement: "STANDARD" }
        : {}),
    }));
  }

  async function uploadFile(uploadedFile: File, field: "media" | "cover") {
    setUploadState("uploading");

    try {
      const response = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: `${form.placement.toLowerCase()}-${field}-${Date.now()}-${uploadedFile.name}`,
          contentType: uploadedFile.type,
          contentLength: uploadedFile.size,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Upload URL failed");
      }

      const payload = await response.json();
      const uploadUrl = payload?.data?.uploadUrl;
      const objectKey = payload?.data?.objectKey;

      if (!uploadUrl || !objectKey) {
        throw new Error("Upload URL failed");
      }

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": uploadedFile.type },
        body: uploadedFile,
      });

      if (!put.ok) {
        throw new Error("Upload to storage failed");
      }

      if (field === "media") {
        setMediaKey(objectKey);
      } else {
        setCoverKey(objectKey);
      }

      setUploadState("done");
      return objectKey as string;
    } catch (err) {
      setUploadState("error");
      setError(err instanceof Error ? err.message : "Upload error");
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    let nextMediaKey = mediaKey;
    let nextCoverKey = coverKey;

    if (file) {
      nextMediaKey = (await uploadFile(file, "media")) ?? "";
    }

    if (coverFile) {
      nextCoverKey = (await uploadFile(coverFile, "cover")) ?? "";
    }

    if (file && !nextMediaKey) {
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      durationSeconds: form.durationSeconds
        ? Number(form.durationSeconds)
        : null,
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
      mediaKey: nextMediaKey || null,
      coverImageKey: nextCoverKey || null,
    };

    const res = await fetch(`/api/admin/messages/${message.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update message.");
      return;
    }

    router.push("/admin/messages");
  }

  async function handleDelete() {
    if (!confirm("Delete this message permanently?")) return;
    setDeleting(true);

    const res = await fetch(`/api/admin/messages/${message.id}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!res.ok) {
      setError("Failed to delete message.");
      return;
    }

    router.push("/admin/messages");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Edit Message</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="button-tertiary flex items-center gap-1.5 text-red-600 border-red-200"
            disabled={deleting}
          >
            <Trash2 size={13} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="button-tertiary flex items-center gap-1.5"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Basic Info</h2>

          <div>
            <label htmlFor="title" className="field-label">
              Title *
            </label>
            <input
              id="title"
              name="title"
              required
              className="field-input"
              value={form.title}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="slug" className="field-label">
              Slug *
            </label>
            <input
              id="slug"
              name="slug"
              required
              className="field-input"
              value={form.slug}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="summary" className="field-label">
              Summary *
            </label>
            <textarea
              id="summary"
              name="summary"
              required
              rows={2}
              className="field-input"
              value={form.summary}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="description" className="field-label">
              Full Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={5}
              className="field-input"
              value={form.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Classification</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="field-label">
                Type *
              </label>
              <select
                id="type"
                name="type"
                className="field-input"
                value={form.type}
                onChange={handleChange}
              >
                {MESSAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="placement" className="field-label">
                Placement *
              </label>
              <select
                id="placement"
                name="placement"
                className="field-input"
                value={form.placement}
                onChange={handleChange}
                disabled={form.type === "AUDIO"}
              >
                {MESSAGE_PLACEMENTS.map((placement) => (
                  <option key={placement} value={placement}>
                    {placement}
                  </option>
                ))}
              </select>
              <p className="text-brand-muted mt-1 text-xs">
                Hero placement is available for video and image uploads only.
              </p>
            </div>
            <div>
              <label htmlFor="status" className="field-label">
                Status *
              </label>
              <select
                id="status"
                name="status"
                className="field-input"
                value={form.status}
                onChange={handleChange}
              >
                {MESSAGE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="speaker" className="field-label">
                Speaker
              </label>
              <input
                id="speaker"
                name="speaker"
                className="field-input"
                value={form.speaker}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="scriptureReference" className="field-label">
                Scripture Reference
              </label>
              <input
                id="scriptureReference"
                name="scriptureReference"
                className="field-input"
                value={form.scriptureReference}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="eventDate" className="field-label">
                Event Date
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                className="field-input"
                value={form.eventDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="durationSeconds" className="field-label">
                Duration (seconds)
              </label>
              <input
                id="durationSeconds"
                name="durationSeconds"
                type="number"
                min="0"
                className="field-input"
                value={form.durationSeconds}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="site-panel space-y-4 p-5">
          <h2 className="text-sm font-semibold">Media Files</h2>

          <div>
            <label className="field-label">
              {form.type === "IMAGE" ? "Image File" : `${form.type} File`}
            </label>
            <div
              className="rounded border border-dashed px-4 py-4 text-center text-sm"
              style={{
                borderColor: "var(--brand-border)",
                color: "var(--brand-text-soft)",
              }}
            >
              {mediaKey ? (
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: "#16a34a" }}>
                    Current media linked
                  </p>
                  <p className="truncate text-xs">{mediaKey}</p>
                </div>
              ) : (
                <Upload size={20} className="mx-auto mb-1 opacity-40" />
              )}
              <label className="mt-2 inline-block cursor-pointer underline text-xs">
                {mediaKey ? "Replace file" : "Choose file"}
                <input
                  type="file"
                  className="sr-only"
                  accept={
                    form.type === "VIDEO"
                      ? "video/*"
                      : form.type === "AUDIO"
                        ? "audio/*"
                        : "image/*"
                  }
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </label>
              {file ? <p className="mt-1 text-xs">{file.name}</p> : null}
            </div>
          </div>

          <div>
            <label className="field-label">Cover Image</label>
            <div
              className="rounded border border-dashed px-4 py-4 text-center text-sm"
              style={{
                borderColor: "var(--brand-border)",
                color: "var(--brand-text-soft)",
              }}
            >
              {coverKey ? (
                <div className="space-y-1">
                  <p className="text-xs" style={{ color: "#16a34a" }}>
                    Current cover linked
                  </p>
                  <p className="truncate text-xs">{coverKey}</p>
                </div>
              ) : (
                <Upload size={20} className="mx-auto mb-1 opacity-40" />
              )}
              <label className="mt-2 inline-block cursor-pointer underline text-xs">
                {coverKey ? "Replace cover" : "Choose image"}
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={(event) =>
                    setCoverFile(event.target.files?.[0] ?? null)
                  }
                />
              </label>
              {coverFile ? (
                <p className="mt-1 text-xs">{coverFile.name}</p>
              ) : null}
            </div>
          </div>

          {uploadState === "uploading" ? (
            <p className="text-xs" style={{ color: "var(--brand-text-soft)" }}>
              Uploading...
            </p>
          ) : null}
        </div>

        {error && (
          <p
            className="rounded px-3 py-2 text-xs"
            style={{
              background: "rgba(220,38,38,0.07)",
              color: "#b91c1c",
              border: "1px solid rgba(220,38,38,0.2)",
            }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="button-tertiary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary flex items-center gap-1.5"
            disabled={saving || uploadState === "uploading"}
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
