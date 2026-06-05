"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import AdminUploadField from "../../../../../components/AdminUploadField";
import { uploadAdminFile } from "../../../../../lib/admin-upload-client";

const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadSlot {
  state: UploadState;
  progress: number;
  error: string;
}

function initialUploadSlot(): UploadSlot {
  return { state: "idle", progress: 0, error: "" };
}

export default function NewQuotePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    text: "",
    attribution: "",
    source: "",
    scriptureReference: "",
    featured: false,
    status: "DRAFT" as (typeof STATUSES)[number]["value"],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageKey, setImageKey] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadState, setUploadState] = useState<UploadSlot>(initialUploadSlot);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function uploadImage(file: File) {
    setUploadState({ state: "uploading", progress: 0, error: "" });
    try {
      const result = await uploadAdminFile({
        file,
          fileName: `quote-image-${Date.now()}-${file.name}`,
        onProgress: (progress) =>
          setUploadState({ state: "uploading", progress, error: "" }),
      });

      setImageKey(result.objectKey);
      setUploadState({ state: "done", progress: 100, error: "" });
    } catch (err) {
      setUploadState({
        state: "error",
        progress: 0,
        error: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageKey: imageKey || (imageUrl || undefined),
          attribution: form.attribution || undefined,
          source: form.source || undefined,
          scriptureReference: form.scriptureReference || undefined,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save");
      }

      router.push("/admin/quotes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Quote</h1>
        <p className="text-brand-muted mt-1 text-sm">Add a quote to the gallery.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div
            className="rounded p-3 text-sm"
            style={{ background: "rgba(220,38,38,0.07)", color: "#b91c1c" }}
          >
            {error}
          </div>
        ) : null}

        <div className="site-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold">Quote Image</h2>
          <AdminUploadField
            label="Image"
            mediaKind="image"
            accept="image/*"
            file={imageFile}
            objectKey={imageKey}
            externalUrl={imageUrl}
            uploadState={uploadState.state}
            progress={uploadState.progress}
            showUrlInput={true}
            urlPlaceholder="https://example.com/quote-image.jpg"
            successLabel="Image uploaded"
            errorMessage={uploadState.error}
            onFileChange={(file) => {
              setImageFile(file);
              setImageUrl("");
              setImageKey("");
              setUploadState(initialUploadSlot());
              if (file) void uploadImage(file);
            }}
            onUrlChange={(url) => {
              setImageUrl(url);
              if (url) {
                setImageFile(null);
                setImageKey("");
                setUploadState(initialUploadSlot());
              }
            }}
            onRetry={() => {
              if (imageFile) void uploadImage(imageFile);
            }}
            onValidationError={(message) => {
              setUploadState({ state: "error", progress: 0, error: message });
              setError(message);
            }}
          />
        </div>

        {/* Quote content */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Quote Content</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Title *</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Quote Text *</span>
              <textarea
                name="text"
                value={form.text}
                onChange={handleChange}
                required
                rows={4}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}
              />
            </label>

            <label className="block">
              <span className="field-label">Attribution</span>
              <input
                name="attribution"
                value={form.attribution}
                onChange={handleChange}
                placeholder="e.g. C.S. Lewis"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}
              />
            </label>

            <label className="block">
              <span className="field-label">Source</span>
              <input
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="e.g. Mere Christianity"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Scripture Reference</span>
              <input
                name="scriptureReference"
                value={form.scriptureReference}
                onChange={handleChange}
                placeholder="e.g. Matthew 11:28"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}
              />
            </label>
          </div>
        </div>

        {/* Publish settings */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Publish Settings</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="rounded"
              />
              <span className="text-sm">Featured quote</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving || uploadState.state === "uploading"}
            className="button-primary flex items-center gap-1.5"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Quote"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="button-tertiary flex items-center gap-1.5"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
