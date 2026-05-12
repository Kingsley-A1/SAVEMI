"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Trash2, Upload } from "lucide-react";

const AVAILABILITIES = ["FREE", "PAID"] as const;
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const FORMATS = ["PDF", "EPUB", "MOBI", "Paperback", "Hardcover"] as const;

type UploadState = "idle" | "uploading" | "done" | "error";

interface BookData {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  coverImageKey: string | null;
  downloadUrl: string | null;
  purchaseUrl: string | null;
  priceLabel: string | null;
  format: string | null;
  pageCount: number | null;
  featured: boolean;
  availability: "FREE" | "PAID";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function EditBookForm({ book }: { book: BookData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: book.title,
    slug: book.slug,
    tagline: book.tagline,
    description: book.description,
    author: book.author,
    downloadUrl: book.downloadUrl ?? "",
    purchaseUrl: book.purchaseUrl ?? "",
    priceLabel: book.priceLabel ?? "",
    format: book.format ?? "",
    pageCount: book.pageCount?.toString() ?? "",
    featured: book.featured,
    availability: book.availability,
    status: book.status,
  });

  const [coverKey, setCoverKey] = useState(book.coverImageKey ?? "");
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

  async function uploadCover(file: File) {
    setUploadState("uploading");
    try {
      const res = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fileName: `book-cover-${Date.now()}-${file.name}`,
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

      setCoverKey(objectKey);
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
      const res = await fetch(`/api/admin/books/${book.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImageKey: coverKey || null,
          pageCount: form.pageCount ? Number(form.pageCount) : null,
          downloadUrl: form.downloadUrl || null,
          purchaseUrl: form.purchaseUrl || null,
          priceLabel: form.priceLabel || null,
          format: form.format || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Failed to save");
      }

      router.push("/admin/books");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this book? This cannot be undone.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/books/${book.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Delete failed");
      }
      router.push("/admin/books");
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
          <h1 className="text-2xl font-semibold">Edit Book</h1>
          <p className="text-brand-muted mt-1 text-sm truncate max-w-xs">{book.title}</p>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="button-tertiary flex items-center gap-1.5 text-red-600 border-red-200"
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

        {/* Cover upload */}
        <div className="site-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold">Cover Image</h2>
          {coverKey ? (
            <p className="text-brand-muted text-xs">Current key: <code>{coverKey}</code></p>
          ) : null}
          <label className="block">
            <span className="field-label">Replace cover (optional)</span>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-brand-muted"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file) uploadCover(file);
              }}
            />
          </label>
          {uploadState === "uploading" && (
            <p className="text-brand-muted text-xs">Uploading…</p>
          )}
          {uploadState === "done" && (
            <p className="text-xs" style={{ color: "#15803d" }}>Cover uploaded ✓</p>
          )}
          {uploadState === "error" && (
            <p className="text-xs" style={{ color: "#b91c1c" }}>Upload failed.</p>
          )}
        </div>

        {/* Core fields */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Book Details</h2>

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
              <span className="field-label">Tagline *</span>
              <input name="tagline" value={form.tagline} onChange={handleChange} required
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block">
              <span className="field-label">Author *</span>
              <input name="author" value={form.author} onChange={handleChange} required
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block">
              <span className="field-label">Format</span>
              <select name="format" value={form.format} onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}>
                <option value="">Select format…</option>
                {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="field-label">Page Count</span>
              <input name="pageCount" type="number" min={1} value={form.pageCount} onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Description *</span>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={5}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>
          </div>
        </div>

        {/* Availability + Links */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Availability &amp; Links</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Availability</span>
              <select name="availability" value={form.availability} onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}>
                {AVAILABILITIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="field-label">Price Label</span>
              <input name="priceLabel" value={form.priceLabel} onChange={handleChange} placeholder="e.g. $9.99"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Download URL (for free books)</span>
              <input name="downloadUrl" type="url" value={form.downloadUrl} onChange={handleChange} placeholder="https://…"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Purchase URL (for paid books)</span>
              <input name="purchaseUrl" type="url" value={form.purchaseUrl} onChange={handleChange} placeholder="https://…"
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
              <span className="text-sm">Featured book</span>
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
          <button type="button" onClick={() => router.back()} className="button-tertiary flex items-center gap-1.5">
            <X size={14} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
