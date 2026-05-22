"use client";

import { Upload, Link as LinkIcon, CheckCircle, XCircle, Loader2, Image as ImageIcon, Film, Music, FileText } from "lucide-react";

type UploadState = "idle" | "uploading" | "done" | "error";
type MediaKind = "video" | "audio" | "image" | "cover" | "document";

interface AdminUploadFieldProps {
  label: string;
  mediaKind: MediaKind;
  accept: string;
  file: File | null;
  objectKey: string;
  externalUrl?: string;
  uploadState?: UploadState;
  showUrlInput?: boolean;
  urlPlaceholder?: string;
  successLabel?: string;
  onFileChange: (file: File | null) => void;
  onUrlChange?: (url: string) => void;
}

const KIND_ICONS: Record<MediaKind, React.ReactNode> = {
  video: <Film size={28} className="opacity-50" />,
  audio: <Music size={28} className="opacity-50" />,
  image: <ImageIcon size={28} className="opacity-50" />,
  cover: <ImageIcon size={28} className="opacity-50" />,
  document: <FileText size={28} className="opacity-50" />,
};

export default function AdminUploadField({
  label,
  mediaKind,
  accept,
  file,
  objectKey,
  externalUrl = "",
  uploadState = "idle",
  showUrlInput = false,
  urlPlaceholder = "https://…",
  successLabel = "Uploaded successfully",
  onFileChange,
  onUrlChange,
}: AdminUploadFieldProps) {
  const isDone = objectKey || uploadState === "done";
  const isUploading = uploadState === "uploading";
  const isError = uploadState === "error";

  return (
    <div className="space-y-2">
      <p className="field-label">{label}</p>

      {/* Upload drop zone */}
      <label
        className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-all"
        style={{
          borderColor: isDone
            ? "#16a34a"
            : isError
            ? "#dc2626"
            : "rgba(10,79,60,0.25)",
          background: isDone
            ? "rgba(22,163,74,0.04)"
            : isError
            ? "rgba(220,38,38,0.04)"
            : "rgba(10,79,60,0.02)",
        }}
      >
        <input
          type="file"
          className="sr-only"
          accept={accept}
          onChange={(e) => {
            onFileChange(e.target.files?.[0] ?? null);
            if (onUrlChange && e.target.files?.[0]) onUrlChange("");
          }}
          disabled={isUploading}
        />

        {isUploading ? (
          <>
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>
              Uploading…
            </p>
          </>
        ) : isDone ? (
          <>
            <CheckCircle size={28} style={{ color: "#16a34a" }} />
            <p className="text-xs font-semibold" style={{ color: "#16a34a" }}>
              {successLabel}
            </p>
            <p className="text-xs" style={{ color: "var(--brand-text-soft)" }}>
              Click to replace
            </p>
          </>
        ) : isError ? (
          <>
            <XCircle size={28} style={{ color: "#dc2626" }} />
            <p className="text-xs font-semibold" style={{ color: "#dc2626" }}>
              Upload failed — click to retry
            </p>
          </>
        ) : (
          <>
            <span style={{ color: "var(--brand-primary)" }}>{KIND_ICONS[mediaKind]}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>
                {file ? file.name : "Click to browse or drag & drop"}
              </p>
              {!file && (
                <p className="mt-0.5 text-xs" style={{ color: "var(--brand-text-soft)" }}>
                  {accept.replace(/\*/g, "files")}
                </p>
              )}
            </div>
            {/* Styled upload button */}
            <span
              className="inline-flex items-center gap-1.5 rounded px-4 py-1.5 text-xs font-semibold transition-opacity group-hover:opacity-80"
              style={{
                background: "var(--brand-primary)",
                color: "var(--brand-accent)",
              }}
            >
              <Upload size={13} />
              {file ? "Change file" : "Choose file"}
            </span>
          </>
        )}
      </label>

      {/* Optional URL input */}
      {showUrlInput && onUrlChange && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t" style={{ borderColor: "var(--brand-border)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--brand-text-soft)" }}>
              OR paste URL
            </span>
            <div className="flex-1 border-t" style={{ borderColor: "var(--brand-border)" }} />
          </div>

          <div className="relative">
            <LinkIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--brand-text-soft)" }}
            />
            <input
              type="url"
              className="field-input pl-8"
              placeholder={urlPlaceholder}
              value={externalUrl}
              onChange={(e) => {
                onUrlChange(e.target.value);
                if (e.target.value) onFileChange(null);
              }}
            />
          </div>

          {externalUrl && (
            <p className="text-xs" style={{ color: "#16a34a" }}>
              ✓ URL set — will be embedded automatically
            </p>
          )}
        </>
      )}
    </div>
  );
}
