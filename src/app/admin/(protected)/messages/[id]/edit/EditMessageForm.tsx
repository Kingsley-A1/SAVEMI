"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Save, Send, Trash2, X } from "lucide-react";
import AdminUploadField from "../../../../../../components/AdminUploadField";
import { uploadAdminFile } from "../../../../../../lib/admin-upload-client";

const MESSAGE_TYPES = [
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "IMAGE", label: "Image" },
] as const;

const MESSAGE_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

type MessageType = (typeof MESSAGE_TYPES)[number]["value"];
type MessageStatus = (typeof MESSAGE_STATUSES)[number]["value"];
type SaveAction = "draft" | "preview" | "publish";
type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadSlot {
  state: UploadState;
  progress: number;
  error: string;
}

interface MessageData {
  id: string;
  title: string;
  summary: string;
  description: string;
  type: MessageType;
  status: MessageStatus;
  speaker: string | null;
  scriptureReference: string | null;
  eventDate: Date | null;
  durationSeconds: number | null;
  mediaKey: string | null;
  coverImageKey: string | null;
  externalMediaUrl: string | null;
  audioDownloadKey: string | null;
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

export default function EditMessageForm({ message }: { message: MessageData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    title: message.title,
    summary: message.summary,
    description: message.description,
    type: message.type,
    status: message.status,
    speaker: message.speaker ?? "",
    scriptureReference: message.scriptureReference ?? "",
    eventDate: message.eventDate
      ? new Date(message.eventDate).toISOString().slice(0, 10)
      : "",
    durationSeconds: message.durationSeconds?.toString() ?? "",
  });

  const [savingAction, setSavingAction] = useState<SaveAction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [mediaUpload, setMediaUpload] = useState<UploadSlot>(initialUploadSlot);
  const [coverUpload, setCoverUpload] = useState<UploadSlot>(initialUploadSlot);
  const [audioUpload, setAudioUpload] = useState<UploadSlot>(initialUploadSlot);
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioDownloadFile, setAudioDownloadFile] = useState<File | null>(null);
  const [mediaKey, setMediaKey] = useState(message.mediaKey ?? "");
  const [coverKey, setCoverKey] = useState(message.coverImageKey ?? "");
  const [audioDownloadKey, setAudioDownloadKey] = useState(
    message.audioDownloadKey?.startsWith("http") ? "" : message.audioDownloadKey ?? "",
  );
  const [externalMediaUrl, setExternalMediaUrl] = useState(
    message.externalMediaUrl ?? "",
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    (message.coverImageKey?.startsWith("http") ? message.coverImageKey : "") ??
      "",
  );
  const [audioDownloadUrl, setAudioDownloadUrl] = useState(
    (message.audioDownloadKey?.startsWith("http")
      ? message.audioDownloadKey
      : "") ?? "",
  );
  const [error, setError] = useState("");

  const isUploading =
    mediaUpload.state === "uploading" ||
    coverUpload.state === "uploading" ||
    audioUpload.state === "uploading";

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function uploadFile(uploadedFile: File, field: "media" | "cover" | "audio") {
    const setSlot =
      field === "media"
        ? setMediaUpload
        : field === "cover"
          ? setCoverUpload
          : setAudioUpload;
    const setKey =
      field === "media"
        ? setMediaKey
        : field === "cover"
          ? setCoverKey
          : setAudioDownloadKey;

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
      const nextError = err instanceof Error ? err.message : "Upload failed.";
      setSlot({ state: "error", progress: 0, error: nextError });
      setError(nextError);
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

  function handleAudioDownloadFileChange(nextFile: File | null) {
    setAudioDownloadFile(nextFile);
    setAudioDownloadUrl("");
    setAudioDownloadKey("");
    setAudioUpload(initialUploadSlot());
    if (nextFile) void uploadFile(nextFile, "audio");
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

    if (form.type === "VIDEO" && audioDownloadFile && !audioDownloadKey) {
      setError("Wait for the audio download upload to finish before saving.");
      return;
    }

    if (form.type === "VIDEO" && audioUpload.state === "uploading") {
      setError("Wait for the audio download upload to finish before saving.");
      return;
    }

    setSavingAction(action);

    const summary = form.summary.trim() || title;
    const description = form.description.trim() || summary;
    const status =
      action === "publish"
        ? "PUBLISHED"
        : action === "draft"
          ? "DRAFT"
          : form.status;

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
      audioDownloadKey:
        form.type === "VIDEO"
          ? audioDownloadKey || (audioDownloadUrl || null)
          : null,
    };

    const response = await fetch(`/api/admin/messages/${message.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSavingAction(null);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Failed to update message.");
      return;
    }

    const saved = (await response.json()) as SavedMessage;

    if (action === "publish") {
      router.push(`/messages/${saved.slug}`);
      return;
    }

    if (action === "preview") {
      router.push(`/admin/messages/${message.id}/preview`);
      return;
    }

    router.push(`/admin/messages/${message.id}/edit`);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this message permanently?")) return;
    setDeleting(true);

    const response = await fetch(`/api/admin/messages/${message.id}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!response.ok) {
      setError("Failed to delete message.");
      return;
    }

    router.push("/admin/messages");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Message</h1>
          <p className="text-brand-muted mt-1 text-sm">
            Replace media, adjust title/details, then save, preview, or publish.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="button-tertiary flex items-center gap-1.5 text-red-600 border-red-200"
            disabled={deleting}
          >
            <Trash2 size={13} />
            {deleting ? "Deleting..." : "Delete"}
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
        <section className="site-panel space-y-5 p-5">
          <div>
            <p className="eyebrow text-brand-primary">Fast upload</p>
            <h2 className="mt-1 text-base font-semibold">Message setup</h2>
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
                successLabel={mediaKey ? "Current media linked" : "Media uploaded"}
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
                onValidationError={(validationError) => {
                  setMediaUpload({
                    state: "error",
                    progress: 0,
                    error: validationError,
                  });
                  setError(validationError);
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
                  setAudioDownloadFile(null);
                  setAudioDownloadKey("");
                  setAudioDownloadUrl("");
                  setAudioUpload(initialUploadSlot());
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
              <label htmlFor="status" className="field-label">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="field-input"
                value={form.status}
                onChange={handleChange}
              >
                {MESSAGE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
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

            {form.type === "VIDEO" ? (
              <AdminUploadField
                label="Audio download"
                mediaKind="audio"
                accept="audio/*"
                file={audioDownloadFile}
                objectKey={audioDownloadKey}
                externalUrl={audioDownloadUrl}
                uploadState={audioUpload.state}
                progress={audioUpload.progress}
                showUrlInput={true}
                urlPlaceholder="https://example.com/message-audio.mp3"
                successLabel={
                  audioDownloadKey ? "Current audio download linked" : "Audio download ready"
                }
                helperText="Optional MP3, M4A, or WAV for public audio download"
                errorMessage={audioUpload.error}
                onFileChange={handleAudioDownloadFileChange}
                onUrlChange={(url) => {
                  setAudioDownloadUrl(url);
                  if (url) {
                    setAudioDownloadFile(null);
                    setAudioDownloadKey("");
                    setAudioUpload(initialUploadSlot());
                  }
                }}
                onRetry={() => {
                  if (audioDownloadFile) void uploadFile(audioDownloadFile, "audio");
                }}
                onValidationError={(validationError) => {
                  setAudioUpload({
                    state: "error",
                    progress: 0,
                    error: validationError,
                  });
                  setError(validationError);
                }}
              />
            ) : null}

            <AdminUploadField
              label="Cover image"
              mediaKind="cover"
              accept="image/*"
              file={coverFile}
              objectKey={coverKey && !coverKey.startsWith("http") ? coverKey : ""}
              externalUrl={coverImageUrl}
              uploadState={coverUpload.state}
              progress={coverUpload.progress}
              showUrlInput={true}
              urlPlaceholder="https://example.com/cover-image.jpg"
              successLabel={coverKey ? "Current cover linked" : "Cover uploaded"}
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
              onValidationError={(validationError) => {
                setCoverUpload({
                  state: "error",
                  progress: 0,
                  error: validationError,
                });
                setError(validationError);
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
