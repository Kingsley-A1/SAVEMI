"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, X } from "lucide-react";
import AdminUploadField from "../../../../components/AdminUploadField";

const MESSAGE_TYPES = ["VIDEO", "AUDIO", "IMAGE"] as const;
const MESSAGE_PLACEMENTS = ["STANDARD", "HERO"] as const;
const MESSAGE_STATUSES = ["DRAFT", "PUBLISHED"] as const;

type UploadState = "idle" | "uploading" | "done" | "error";

export default function NewMessagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlacement =
    searchParams.get("placement") === "HERO" ? "HERO" : "STANDARD";

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    description: "",
    type: "VIDEO" as (typeof MESSAGE_TYPES)[number],
    placement: initialPlacement as (typeof MESSAGE_PLACEMENTS)[number],
    status: "DRAFT" as (typeof MESSAGE_STATUSES)[number],
    speaker: "",
    scriptureReference: "",
    eventDate: "",
    durationSeconds: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [mediaKey, setMediaKey] = useState("");
  const [coverKey, setCoverKey] = useState("");
  const [externalMediaUrl, setExternalMediaUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function slugify(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "title" && !prev.slug) {
        next.slug = slugify(value);
      }
      if (name === "type" && value === "AUDIO") {
        next.placement = "STANDARD";
      }
      return next;
    });
  }

  async function uploadFile(f: File, field: "media" | "cover") {
    setUploadState("uploading");
    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: `${form.placement.toLowerCase()}-${field}-${Date.now()}-${f.name}`,
          contentType: f.type,
          contentLength: f.size,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload URL failed");
      }

      const payload = await res.json();
      const uploadUrl = payload?.data?.uploadUrl;
      const objectKey = payload?.data?.objectKey;

      if (!uploadUrl || !objectKey) {
        throw new Error("Upload URL failed");
      }

      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": f.type },
        body: f,
      });

      if (!put.ok) throw new Error("Upload to storage failed");

      if (field === "media") setMediaKey(objectKey);
      else setCoverKey(objectKey);

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

    // Upload files first if selected
    let nextMediaKey = mediaKey;
    let nextCoverKey = coverKey;

    if (file && !nextMediaKey) {
      nextMediaKey = (await uploadFile(file, "media")) ?? "";
    }
    if (coverFile && !nextCoverKey) {
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
      coverImageKey: nextCoverKey || (coverImageUrl || null),
      externalMediaUrl: externalMediaUrl || null,
    };

    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to save message.");
      return;
    }

    router.push("/admin/messages");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">New Message</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="button-tertiary inline-flex items-center gap-1.5 self-start"
        >
          <X size={14} /> Cancel
        </button>
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
                placeholder="e.g. Psalm 23:1-3"
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

        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Media Files</h2>

          <AdminUploadField
            label={form.type === "IMAGE" ? "Image File" : `${form.type} File`}
            mediaKind={form.type.toLowerCase() as "video" | "audio" | "image"}
            accept={
              form.type === "VIDEO" ? "video/*" : form.type === "AUDIO" ? "audio/*" : "image/*"
            }
            file={file}
            objectKey={mediaKey}
            externalUrl={externalMediaUrl}
            uploadState={uploadState}
            showUrlInput={true}
            urlPlaceholder="https://youtube.com/watch?v=…  or  https://facebook.com/…/videos/…"
            successLabel="Media file uploaded"
            onFileChange={(f) => { setFile(f); if (f) setExternalMediaUrl(""); }}
            onUrlChange={(url) => { setExternalMediaUrl(url); if (url) { setFile(null); setMediaKey(""); } }}
          />

          <AdminUploadField
            label="Cover Image"
            mediaKind="cover"
            accept="image/*"
            file={coverFile}
            objectKey={coverKey}
            externalUrl={coverImageUrl}
            uploadState={coverKey ? "done" : "idle"}
            showUrlInput={true}
            urlPlaceholder="https://example.com/cover-image.jpg"
            successLabel="Cover image uploaded"
            onFileChange={(f) => { setCoverFile(f); if (f) setCoverImageUrl(""); }}
            onUrlChange={(url) => { setCoverImageUrl(url); if (url) { setCoverFile(null); setCoverKey(""); } }}
          />
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
            {saving ? "Saving..." : "Save Message"}
          </button>
        </div>
      </form>
    </div>
  );
}
