"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Info, Save, Send, Trash2, X } from "lucide-react";
import AdminUploadField from "../../../../../../components/AdminUploadField";
import { LoadingButton } from "../../../../../../components/ui/Loading";
import { isEmbeddableUrl } from "../../../../../../lib/embed";
import {
  toUploadErrorDisplay,
  uploadAdminFile,
} from "../../../../../../lib/admin-upload-client";

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
  /** What the admin can do about it. */
  remedy?: string;
  /** One-line technical trace for a bug report. */
  technical?: string;
  /** Live narration from the upload client, e.g. a retry notice. */
  status?: string;
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
          setSlot((slot) => ({ ...slot, state: "uploading", progress, error: "" })),
        onStatus: (status) =>
          setSlot((slot) => ({ ...slot, status: status.message })),
      });

      setKey(result.objectKey);
      setSlot({ state: "done", progress: 100, error: "" });
      return result.objectKey;
    } catch (err) {
      const display = toUploadErrorDisplay(err);
      // Shown by the field itself — deliberately not mirrored into the
      // form banner, which is for problems saving the record.
      setSlot({
        state: "error",
        progress: 0,
        error: display.message,
        remedy: display.remedy,
        technical: display.technical,
      });
      return null;
    }
  }

  /**
   * The Type select used to clear `mediaKey`/`audioDownloadKey` unconditionally
   * on every change, with no way back. Picking a different type by mistake —
   * or just exploring the dropdown — then saving would silently null out a
   * live message's video and its audio companion, because those cleared
   * values are exactly what gets sent to the PATCH endpoint.
   *
   * Switching to a genuinely different type still clears the fields, since a
   * file uploaded for one media kind isn't valid for another. But landing
   * back on the type the message actually has restores exactly what was
   * loaded from the database, so idle clicking through the options — or
   * reconsidering — costs nothing.
   */
  function handleTypeChange(nextType: MessageType) {
    if (nextType === message.type) {
      setFile(null);
      setMediaKey(message.mediaKey ?? "");
      setExternalMediaUrl(message.externalMediaUrl ?? "");
      setMediaUpload(initialUploadSlot());

      setAudioDownloadFile(null);
      setAudioDownloadKey(
        message.audioDownloadKey?.startsWith("http")
          ? ""
          : (message.audioDownloadKey ?? ""),
      );
      setAudioDownloadUrl(
        message.audioDownloadKey?.startsWith("http")
          ? message.audioDownloadKey
          : "",
      );
      setAudioUpload(initialUploadSlot());
      return;
    }

    setFile(null);
    setMediaKey("");
    setExternalMediaUrl("");
    setMediaUpload(initialUploadSlot());

    setAudioDownloadFile(null);
    setAudioDownloadKey("");
    setAudioDownloadUrl("");
    setAudioUpload(initialUploadSlot());
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
            className="button-tertiary flex items-center gap-1.5 text-attention border-[var(--state-attention-border)]"
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

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
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
                statusMessage={mediaUpload.status}
                showUrlInput={true}
                urlPlaceholder="https://youtube.com/watch?v=... or https://facebook.com/.../videos/..."
                successLabel={mediaKey ? "Current media linked" : "Media uploaded"}
                errorMessage={mediaUpload.error}
                errorRemedy={mediaUpload.remedy}
                errorDetails={mediaUpload.technical}
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
                }}
              />

              {/* YouTube/Facebook links always embed as a video player,
                  whatever the declared type — the ministry's audio content
                  often only exists as a short Facebook video, and that's a
                  reasonable choice, but it should be a seen choice. */}
              {form.type === "AUDIO" && externalMediaUrl && isEmbeddableUrl(externalMediaUrl) ? (
                <p className="notice-info mt-2 flex items-start gap-2">
                  <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    This link plays as a video on the site — YouTube and
                    Facebook links always embed their own video player,
                    regardless of the Audio type. That&apos;s fine if this is
                    a short devotional posted as a video; upload an audio
                    file above instead if you want a listen-only page.
                  </span>
                </p>
              ) : null}
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
                  handleTypeChange(event.target.value as MessageType);
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

            {/* Kept beside the main media field, not buried under Advanced
                details — a video message with no companion audio file is
                easy to publish and forget when this is out of sight. */}
            {form.type === "VIDEO" ? (
              <div className="min-w-0 sm:col-span-2">
                <AdminUploadField
                  label="Audio download (optional)"
                  mediaKind="audio"
                  accept="audio/*"
                  file={audioDownloadFile}
                  objectKey={audioDownloadKey}
                  externalUrl={audioDownloadUrl}
                  uploadState={audioUpload.state}
                  progress={audioUpload.progress}
                  statusMessage={audioUpload.status}
                  showUrlInput={true}
                  urlPlaceholder="https://example.com/message-audio.mp3"
                  successLabel={
                    audioDownloadKey
                      ? "Current audio download linked"
                      : "Audio download ready"
                  }
                  helperText="Adds a separate audio-only download for this video — MP3, M4A, or WAV. Skip this if the video has no standalone audio version."
                  errorMessage={audioUpload.error}
                  errorRemedy={audioUpload.remedy}
                  errorDetails={audioUpload.technical}
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
                  }}
                />
              </div>
            ) : null}
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
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="min-w-0 sm:col-span-2">
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

            <AdminUploadField
              label="Cover image"
              mediaKind="cover"
              accept="image/*"
              file={coverFile}
              objectKey={coverKey && !coverKey.startsWith("http") ? coverKey : ""}
              externalUrl={coverImageUrl}
              uploadState={coverUpload.state}
              progress={coverUpload.progress}
                statusMessage={coverUpload.status}
              showUrlInput={true}
              urlPlaceholder="https://example.com/cover-image.jpg"
              successLabel={coverKey ? "Current cover linked" : "Cover uploaded"}
              errorMessage={coverUpload.error}
              errorRemedy={coverUpload.remedy}
              errorDetails={coverUpload.technical}
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
              }}
            />
          </div>
        </details>

        {error ? (
          <p
            className="rounded px-3 py-2 text-xs"
            style={{
              background: "var(--state-attention-surface)",
              color: "var(--state-attention)",
              border: "1px solid var(--state-attention-border)",
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
          <LoadingButton
            type="submit"
            name="intent"
            value="draft"
            className="button-tertiary"
            spinnerTone="primary"
            loading={savingAction === "draft"}
            loadingLabel="Saving…"
            icon={<Save size={14} />}
            disabled={Boolean(savingAction) || isUploading}
          >
            Save draft
          </LoadingButton>
          <LoadingButton
            type="submit"
            name="intent"
            value="preview"
            className="button-tertiary"
            spinnerTone="primary"
            loading={savingAction === "preview"}
            loadingLabel="Saving…"
            icon={<Eye size={14} />}
            disabled={Boolean(savingAction) || isUploading}
          >
            Save and preview
          </LoadingButton>
          <LoadingButton
            type="submit"
            name="intent"
            value="publish"
            loading={savingAction === "publish"}
            loadingLabel="Publishing…"
            icon={<Send size={14} />}
            disabled={Boolean(savingAction) || isUploading}
          >
            Publish
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}
