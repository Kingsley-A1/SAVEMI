"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Trash2 } from "lucide-react";

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

type UploadState = "idle" | "uploading" | "done" | "error";

interface QuoteData {
  id: string;
  slug: string;
  title: string;
  text: string;
  attribution: string | null;
  source: string | null;
  scriptureReference: string | null;
  imageKey: string | null;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function EditQuoteForm({ quote }: { quote: QuoteData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: quote.title,
    slug: quote.slug,
    text: quote.text,
    attribution: quote.attribution ?? "",
    source: quote.source ?? "",
    scriptureReference: quote.scriptureReference ?? "",
    featured: quote.featured,
    status: quote.status,
  });

  const [imageKey, setImageKey] = useState(quote.imageKey ?? "");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    setUploadState("uploading");
    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: `quote-image-${Date.now()}-${file.name}`,
          contentType: file.type,
          contentLength: file.size,
        }),
      });
      if (!res.ok) throw new Error("Upload URL failed");
      const payload = await res.json();
      const { uploadUrl, objectKey } = payload?.data ?? {};
      if (!uploadUrl || !objectKey) throw new Error("Upload URL failed");

      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "content-type": file.type },
      });
      if (!put.ok) throw new Error("Upload failed");

      setImageKey(objectKey);
      setUploadState("done");
    } catch {
      setUploadState("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageKey: imageKey || null,
          attribution: form.attribution || null,
          source: form.source || null,
          scriptureReference: form.scriptureReference || null,
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

  async function handleDelete() {
    if (!confirm("Permanently delete this quote? This cannot be undone.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/quotes/${quote.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Delete failed");
      }
      router.push("/admin/quotes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Quote</h1>
          <p className="text-brand-muted mt-1 text-sm truncate max-w-xs">{quote.title}</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="button-tertiary flex items-center gap-1.5"
          style={{ borderColor: "rgba(220,38,38,0.3)", color: "#dc2626" }}
        >
          <Trash2 size={14} />
          {deleting ? "Deleting…" : "Delete"}
        </button>
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

        {/* Image upload */}
        <div className="site-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold">Quote Image (optional)</h2>
          {imageKey ? (
            <p className="text-brand-muted text-xs">Current key: <code>{imageKey}</code></p>
          ) : null}
          <label className="block">
            <span className="field-label">Replace image</span>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-brand-muted"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) uploadImage(file);
              }}
            />
          </label>
          {uploadState === "uploading" && (
            <p className="text-brand-muted text-xs">Uploading…</p>
          )}
          {uploadState === "done" && (
            <p className="text-xs" style={{ color: "#15803d" }}>Image uploaded ✓</p>
          )}
          {uploadState === "error" && (
            <p className="text-xs" style={{ color: "#b91c1c" }}>Upload failed.</p>
          )}
        </div>

        {/* Quote content */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Quote Content</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Title *</span>
              <input name="title" value={form.title} onChange={handleChange} required
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Slug</span>
              <input name="slug" value={form.slug} onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm font-mono"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Quote Text *</span>
              <textarea name="text" value={form.text} onChange={handleChange} required rows={4}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block">
              <span className="field-label">Attribution</span>
              <input name="attribution" value={form.attribution} onChange={handleChange}
                placeholder="e.g. C.S. Lewis"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block">
              <span className="field-label">Source</span>
              <input name="source" value={form.source} onChange={handleChange}
                placeholder="e.g. Mere Christianity"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Scripture Reference</span>
              <input name="scriptureReference" value={form.scriptureReference} onChange={handleChange}
                placeholder="e.g. Matthew 11:28"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>
          </div>
        </div>

        {/* Publish settings */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Publish Settings</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Status</span>
              <select name="status" value={form.status} onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="rounded" />
              <span className="text-sm">Featured quote</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving || uploadState === "uploading"}
            className="button-primary flex items-center gap-1.5">
            <Save size={14} />
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="button-tertiary flex items-center gap-1.5">
            <X size={14} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
