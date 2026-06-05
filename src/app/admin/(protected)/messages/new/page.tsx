"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Send, X } from "lucide-react";
import AdminUploadField from "../../../../../components/AdminUploadField";
import { uploadAdminFile } from "../../../../../lib/admin-upload-client";

const MESSAGE_TYPES = [
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "IMAGE", label: "Image" },
] as const;

type MessageType = (typeof MESSAGE_TYPES)[number]["value"];
type SaveAction = "draft" | "preview" | "publish";
type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadSlot {
  state: UploadState;
  progress: number;
  error: string;
}

interface SavedMessage {
  id: string;
  slug: string;
}

function initialUploadSlot(): UploadSlot {
  return { state: "idle", progress: 0, error: "" };
}

function getMessageTypeLabel(type: MessageType) {
  return MESSAGE_TYPES.find((item) => item.value === type)?.label ?? type;
}

function getSubmitAction(event: React.FormEvent<HTMLFormElement>): SaveAction {
  const submitter = (event.nativeEvent as SubmitEvent).submitter as
    | HTMLButtonElement
    | null;
  const value = submitter?.value;

  if (value === "preview" || value === "publish") return value;
  return "draft";
}

export default function NewMessagePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    type: "VIDEO" as MessageType,
    speaker: "",
    scriptureReference: "",
    eventDate: "",
    durationSeconds: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [mediaUpload, setMediaUpload] = useState<UploadSlot>(initialUploadSlot);
  const [coverUpload, setCoverUpload] = useState<UploadSlot>(initialUploadSlot);
  const [mediaKey, setMediaKey] = useState("");
  const [coverKey, setCoverKey] = useState("");
  const [externalMediaUrl, setExternalMediaUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [savingAction, setSavingAction] = useState<SaveAction | null>(null);
  const [error, setError] = useState("");

  const isUploading =
    mediaUpload.state === "uploading" || coverUpload.state === "uploading";

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadFile(uploadedFile: File, field: "media" | "cover") {
    const setSlot = field === "media" ? setMediaUpload : setCoverUpload;
    const setKey = field === "media" ? setMediaKey : setCoverKey;

    setError("");
    setSlot({ state: "uploading", progress: 0, error: "" });

    try {
      const result = await uploadAdminFile({
        file: uploadedFile,
        fileName: `message-${field}-${Date.now()}-${uploadedFile.name}`,
        onProgress: (progress) =>
          setSlot({ state: "uploading", progress, error: "" }),
      });

      setKey(result.objectKey);
      setSlot({ state: "done", progress: 100, error: "" });
      return result.objectKey;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setSlot({ state: "error", progress: 0, error: message });
      setError(message);
      return null;
    }
  }

  function handleMediaFileChange(nextFile: File | null) {
    setFile(nextFile);
    setExternalMediaUrl("");
    setMediaKey("");
    setMediaUpload(initialUploadSlot());
    if (nextFile) void uploadFile(nextFile, "media");
  }

  function handleCoverFileChange(nextFile: File | null) {
    setCoverFile(nextFile);
    setCoverImageUrl("");
    setCoverKey("");
    setCoverUpload(initialUploadSlot());
    if (nextFile) void uploadFile(nextFile, "cover");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const action = getSubmitAction(event);
    const title = form.title.trim();

    setError("");

    if (!title) {
      setError("Title is required.");
      return;
    }

    if (file && !mediaKey) {
      setError("Wait for the media upload to finish before saving.");
      return;
    }

    if (coverFile && !coverKey) {
      setError("Wait for the cover upload to finish before saving.");
      return;
    }

    setSavingAction(action);

    const summary = form.summary.trim() || title;
    const description = form.description.trim() || summary;
    const status = action === "publish" ? "PUBLISHED" : "DRAFT";

    const payload = {
      ...form,
      title,
      summary,
      description,
      status,
      durationSeconds: form.durationSeconds
        ? Number(form.durationSeconds)
        : null,
      eventDate: form.eventDate ? new Date(form.eventDate).toISOString() : null,
      mediaKey: mediaKey || null,
      coverImageKey: coverKey || (coverImageUrl || null),
      externalMediaUrl: externalMediaUrl || null,
    };

    const response = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingAction(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Failed to save message.");
      return;
    }

    const saved = (await response.json()) as SavedMessage;

    if (action === "publish") {
      router.push(`/messages/${saved.slug}`);
      return;
    }

    if (action === "preview") {
      router.push(`/admin/messages/${saved.id}/preview`);
      return;
    }

    router.push(`/admin/messages/${saved.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New Message</h1>
          <p className="text-brand-muted mt-1 text-sm">
            Upload or paste a media link, add a title, then save or publish.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="button-tertiary inline-flex items-center gap-1.5 self-start"
        >
          <X size={14} /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="site-panel space-y-5 p-5">
          <div>
            <p className="eyebrow text-brand-primary">Fast upload</p>
            <h2 className="mt-1 text-base font-semibold">Publish setup</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <AdminUploadField
                label={`${getMessageTypeLabel(form.type)} media`}
                mediaKind={form.type.toLowerCase() as "video" | "audio" | "image"}
                accept={
                  form.type === "VIDEO"
                    ? "video/*"
                    : form.type === "AUDIO"
                      ? "audio/*"
                      : "image/*"
                }
                file={file}
                objectKey={mediaKey}
                externalUrl={externalMediaUrl}
                uploadState={mediaUpload.state}
                progress={mediaUpload.progress}
                showUrlInput={true}
                urlPlaceholder="https://youtube.com/watch?v=... or https://facebook.com/.../videos/..."
                successLabel="Media uploaded"
                errorMessage={mediaUpload.error}
                onFileChange={handleMediaFileChange}
                onUrlChange={(url) => {
                  setExternalMediaUrl(url);
                  if (url) {
                    setFile(null);
                    setMediaKey("");
                    setMediaUpload(initialUploadSlot());
                  }
                }}
                onRetry={() => {
                  if (file) void uploadFile(file, "media");
                }}
                onValidationError={(message) => {
                  setMediaUpload({ state: "error", progress: 0, error: message });
                  setError(message);
                }}
              />
            </div>

            <div>
              <label htmlFor="type" className="field-label">
                Type
              </label>
              <select
                id="type"
                name="type"
                className="field-input"
                value={form.type}
                onChange={(event) => {
                  handleChange(event);
                  setFile(null);
                  setMediaKey("");
                  setMediaUpload(initialUploadSlot());
                }}
              >
                {MESSAGE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

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
          </div>
        </section>

        <details className="site-panel group p-5">
          <summary className="cursor-pointer list-none text-sm font-semibold text-brand-primary">
            Advanced details
            <span className="text-brand-muted ml-2 font-normal">
              Summary, description, cover, speaker, scripture, date, duration
            </span>
          </summary>

          <div className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="summary" className="field-label">
                  Summary
                </label>
                <textarea
                  id="summary"
                  name="summary"
                  rows={2}
                  className="field-input"
                  placeholder="Optional. If blank, the title is used."
                  value={form.summary}
                  onChange={handleChange}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="field-label">
                  Full description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  className="field-input"
                  placeholder="Optional. Add full notes when available."
                  value={form.description}
                  onChange={handleChange}
                />
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
                  Scripture reference
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
                  Event date
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
                  Duration in seconds
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

            <AdminUploadField
              label="Cover image"
              mediaKind="cover"
              accept="image/*"
              file={coverFile}
              objectKey={coverKey}
              externalUrl={coverImageUrl}
              uploadState={coverUpload.state}
              progress={coverUpload.progress}
              showUrlInput={true}
              urlPlaceholder="https://example.com/cover-image.jpg"
              successLabel="Cover uploaded"
              errorMessage={coverUpload.error}
              onFileChange={handleCoverFileChange}
              onUrlChange={(url) => {
                setCoverImageUrl(url);
                if (url) {
                  setCoverFile(null);
                  setCoverKey("");
                  setCoverUpload(initialUploadSlot());
                }
              }}
              onRetry={() => {
                if (coverFile) void uploadFile(coverFile, "cover");
              }}
              onValidationError={(message) => {
                setCoverUpload({ state: "error", progress: 0, error: message });
                setError(message);
              }}
            />
          </div>
        </details>

        {error ? (
          <p
            className="rounded px-3 py-2 text-xs"
            style={{
              background: "rgba(220,38,38,0.07)",
              color: "#b91c1c",
              border: "1px solid rgba(220,38,38,0.2)",
            }}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="button-tertiary"
          >
            Cancel
          </button>
          <button
            type="submit"
            name="intent"
            value="draft"
            className="button-tertiary flex items-center gap-1.5"
            disabled={Boolean(savingAction) || isUploading}
          >
            <Save size={14} />
            {savingAction === "draft" ? "Saving..." : "Save draft"}
          </button>
          <button
            type="submit"
            name="intent"
            value="preview"
            className="button-tertiary flex items-center gap-1.5"
            disabled={Boolean(savingAction) || isUploading}
          >
            <Eye size={14} />
            {savingAction === "preview" ? "Saving..." : "Save and preview"}
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
            className="button-primary flex items-center gap-1.5"
            disabled={Boolean(savingAction) || isUploading}
          >
            <Send size={14} />
            {savingAction === "publish" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
