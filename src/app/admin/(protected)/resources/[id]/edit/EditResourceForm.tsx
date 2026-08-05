"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Trash2 } from "lucide-react";
import AdminUploadField from "../../../../../../components/AdminUploadField";
import { LoadingButton } from "../../../../../../components/ui/Loading";
import {
  toUploadErrorDisplay,
  uploadAdminFile,
} from "../../../../../../lib/admin-upload-client";
import {
  RESOURCE_FILE_ACCEPT,
  RESOURCE_FILE_HELPER_TEXT,
} from "../../../../../../lib/resource-uploads";
import {
  RESOURCE_TYPE_LABEL,
  RESOURCE_TYPE_ORDER,
} from "../../../../../../lib/resources";

const AVAILABILITIES = [
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
] as const;
const STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;
const RESOURCE_TYPES = RESOURCE_TYPE_ORDER.map((value) => ({
  value: value.toUpperCase() as "BOOK" | "DEVOTIONAL" | "PULPIT" | "ARTICLE",
  label: RESOURCE_TYPE_LABEL[value],
}));
const FORMATS = ["PDF", "EPUB", "MOBI", "Paperback", "Hardcover"] as const;

type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadSlot {
  state: UploadState;
  progress: number;
  error: string;
  /** What the admin can do about it. */
  remedy?: string;
  /** One-line technical trace for a bug report. */
  technical?: string;
}

function initialUploadSlot(): UploadSlot {
  return { state: "idle", progress: 0, error: "" };
}

interface ResourceData {
  id: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  coverImageKey: string | null;
  downloadKey: string | null;
  downloadFileName: string | null;
  downloadUrl: string | null;
  purchaseUrl: string | null;
  priceLabel: string | null;
  format: string | null;
  pageCount: number | null;
  featured: boolean;
  availability: "FREE" | "PAID";
  resourceType: "BOOK" | "DEVOTIONAL" | "PULPIT" | "ARTICLE";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function EditResourceForm({ resource }: { resource: ResourceData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: resource.title,
    tagline: resource.tagline,
    description: resource.description,
    author: resource.author,
    downloadUrl: resource.downloadUrl ?? "",
    purchaseUrl: resource.purchaseUrl ?? "",
    priceLabel: resource.priceLabel ?? "",
    format: resource.format ?? "",
    pageCount: resource.pageCount?.toString() ?? "",
    featured: resource.featured,
    availability: resource.availability,
    resourceType: resource.resourceType,
    status: resource.status,
  });

  const [coverKey, setCoverKey] = useState(resource.coverImageKey ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    (resource.coverImageKey?.startsWith("http") ? resource.coverImageKey : "") ?? ""
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadSlot>(initialUploadSlot);

  // The resource file itself, uploaded from the admin's device.
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceKey, setResourceKey] = useState(resource.downloadKey ?? "");
  const [resourceFileName, setResourceFileName] = useState(resource.downloadFileName ?? "");
  const [resourceUploadState, setResourceUploadState] =
    useState<UploadSlot>(initialUploadSlot);

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
    setUploadState({ state: "uploading", progress: 0, error: "" });
    try {
      const result = await uploadAdminFile({
        file,
          fileName: `resource-cover-${Date.now()}-${file.name}`,
        onProgress: (progress) =>
          setUploadState({ state: "uploading", progress, error: "" }),
      });

      setCoverKey(result.objectKey);
      setUploadState({ state: "done", progress: 100, error: "" });
    } catch (err) {
      const display = toUploadErrorDisplay(err);
      // Shown by the field itself — deliberately not mirrored into
      // the form banner, which is for problems saving the record.
      setUploadState({
        state: "error",
        progress: 0,
        error: display.message,
        remedy: display.remedy,
        technical: display.technical,
      });
    }
  }

  async function uploadResourceFile(file: File) {
    setResourceUploadState({ state: "uploading", progress: 0, error: "" });
    try {
      const result = await uploadAdminFile({
        file,
        fileName: `resource-${Date.now()}-${file.name}`,
        onProgress: (progress) =>
          setResourceUploadState({ state: "uploading", progress, error: "" }),
      });

      setResourceKey(result.objectKey);
      setResourceFileName(file.name);
      setResourceUploadState({ state: "done", progress: 100, error: "" });
    } catch (err) {
      const display = toUploadErrorDisplay(err);
      // Shown by the field itself — deliberately not mirrored into
      // the form banner, which is for problems saving the record.
      setResourceUploadState({
        state: "error",
        progress: 0,
        error: display.message,
        remedy: display.remedy,
        technical: display.technical,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImageKey: coverKey || (coverImageUrl || null),
          downloadKey: resourceKey || null,
          downloadFileName: resourceFileName || null,
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

      router.push("/admin/resources");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this resource? This cannot be undone.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/resources/${resource.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error ?? "Delete failed");
      }
      router.push("/admin/resources");
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
          <h1 className="text-2xl font-semibold">Edit Resource</h1>
          <p className="text-brand-muted mt-1 text-sm truncate max-w-xs">{resource.title}</p>
        </div>
        <LoadingButton
          type="button"
          onClick={handleDelete}
          loading={deleting}
          loadingLabel="Deleting…"
          spinnerTone="muted"
          icon={<Trash2 size={14} />}
          className="button-tertiary"
        >
          Delete
        </LoadingButton>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div
            className="rounded p-3 text-sm"
            style={{ background: "var(--state-attention-surface)", color: "var(--state-attention)" }}
          >
            {error}
          </div>
        ) : null}

        {/* Cover upload */}
        <div className="site-panel p-5 space-y-3">
          <h2 className="text-sm font-semibold">Cover Image</h2>
          <AdminUploadField
            label="Replace cover"
            mediaKind="cover"
            accept="image/*"
            file={coverFile}
            objectKey={coverKey && !coverKey.startsWith("http") ? coverKey : ""}
            externalUrl={coverImageUrl}
            uploadState={uploadState.state}
            progress={uploadState.progress}
            showUrlInput={true}
            urlPlaceholder="https://example.com/resource-cover.jpg"
            successLabel={coverKey ? "Current cover linked" : "Cover image uploaded"}
            errorMessage={uploadState.error}
            errorRemedy={uploadState.remedy}
            errorDetails={uploadState.technical}
            onFileChange={(file) => {
              setCoverFile(file);
              setCoverImageUrl("");
              setCoverKey("");
              setUploadState(initialUploadSlot());
              if (file) void uploadCover(file);
            }}
            onUrlChange={(url) => {
              setCoverImageUrl(url);
              if (url) {
                setCoverFile(null);
                setCoverKey("");
                setUploadState(initialUploadSlot());
              }
            }}
            onRetry={() => {
              if (coverFile) void uploadCover(coverFile);
            }}
            onValidationError={(message) => {
              setUploadState({ state: "error", progress: 0, error: message });
            }}
          />
        </div>

        {/* Core fields */}
        <div className="site-panel p-5 space-y-4">
          <h2 className="text-sm font-semibold">Resource Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="field-label">Section</span>
              <select name="resourceType" value={form.resourceType} onChange={handleChange}
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }}>
                {RESOURCE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              <span className="text-brand-muted mt-1 block text-xs leading-5">
                Which Resources section this appears under on the public site.
              </span>
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Title *</span>
              <input name="title" value={form.title} onChange={handleChange} required
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
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
                {AVAILABILITIES.map((availability) => <option key={availability.value} value={availability.value}>{availability.label}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="field-label">Price Label</span>
              <input name="priceLabel" value={form.priceLabel} onChange={handleChange} placeholder="e.g. $9.99"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
            </label>

            <div className="sm:col-span-2">
              <AdminUploadField
                label="Resource file (upload from your device)"
                mediaKind="document"
                accept={RESOURCE_FILE_ACCEPT}
                file={resourceFile}
                objectKey={resourceKey}
                uploadState={resourceUploadState.state}
                progress={resourceUploadState.progress}
                successLabel={
                  resourceFileName
                    ? `Resource file ready: ${resourceFileName}`
                    : "Resource file uploaded"
                }
                helperText={RESOURCE_FILE_HELPER_TEXT}
                errorMessage={resourceUploadState.error}
                errorRemedy={resourceUploadState.remedy}
                errorDetails={resourceUploadState.technical}
                onFileChange={(file) => {
                  setResourceFile(file);
                  setResourceKey("");
                  setResourceFileName("");
                  setResourceUploadState(initialUploadSlot());
                  if (file) void uploadResourceFile(file);
                }}
                onRetry={() => {
                  if (resourceFile) void uploadResourceFile(resourceFile);
                }}
                onValidationError={(message) => {
                  setResourceUploadState({ state: "error", progress: 0, error: message });
                }}
              />
              {resourceKey ? (
                <button
                  type="button"
                  onClick={() => {
                    setResourceFile(null);
                    setResourceKey("");
                    setResourceFileName("");
                    setResourceUploadState(initialUploadSlot());
                  }}
                  className="button-tertiary mt-2 gap-1.5"
                >
                  <X size={13} />
                  Remove resource file
                </button>
              ) : null}
            </div>

            <label className="block sm:col-span-2">
              <span className="field-label">
                Download URL (optional — only if no file was uploaded)
              </span>
              <input name="downloadUrl" type="url" value={form.downloadUrl} onChange={handleChange} placeholder="https://…"
                className="mt-1 block w-full rounded border px-3 py-2 text-sm"
                style={{ borderColor: "var(--brand-border)" }} />
              <span className="text-brand-muted mt-1 block text-xs leading-5">
                An uploaded file always takes precedence over this link.
              </span>
            </label>

            <label className="block sm:col-span-2">
              <span className="field-label">Purchase URL (for paid resources)</span>
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
                {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
            </label>

            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} className="rounded" />
              <span className="text-sm">Featured resource</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <LoadingButton
            type="submit"
            loading={saving}
            loadingLabel="Saving…"
            icon={<Save size={14} />}
            disabled={
              uploadState.state === "uploading" ||
              resourceUploadState.state === "uploading"
            }
          >
            Save Changes
          </LoadingButton>
          <button type="button" onClick={() => router.back()} className="button-tertiary flex items-center gap-1.5">
            <X size={14} />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
