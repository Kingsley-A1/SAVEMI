"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Upload,
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  RotateCcw,
} from "lucide-react";

type UploadState = "idle" | "uploading" | "done" | "error";
type MediaKind = "video" | "audio" | "image" | "cover" | "document";
type UploadSource = "file" | "url";

interface AdminUploadFieldProps {
  label: string;
  mediaKind: MediaKind;
  accept: string;
  file: File | null;
  objectKey: string;
  externalUrl?: string;
  uploadState?: UploadState;
  progress?: number;
  showUrlInput?: boolean;
  urlPlaceholder?: string;
  successLabel?: string;
  helperText?: string;
  errorMessage?: string;
  maxSizeBytes?: number;
  onFileChange: (file: File | null) => void;
  onUrlChange?: (url: string) => void;
  onRetry?: () => void;
  onValidationError?: (message: string) => void;
}

const KIND_ICONS: Record<MediaKind, ReactNode> = {
  video: <Film size={28} className="opacity-50" />,
  audio: <Music size={28} className="opacity-50" />,
  image: <ImageIcon size={28} className="opacity-50" />,
  cover: <ImageIcon size={28} className="opacity-50" />,
  document: <FileText size={28} className="opacity-50" />,
};

const DEFAULT_MAX_BYTES: Record<MediaKind, number> = {
  video: 500 * 1024 * 1024,
  audio: 100 * 1024 * 1024,
  image: 15 * 1024 * 1024,
  cover: 15 * 1024 * 1024,
  document: 15 * 1024 * 1024,
};

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${Math.round(mb)}MB`;
}

function formatAccept(accept: string) {
  if (accept === "video/*") return "Video files";
  if (accept === "audio/*") return "Audio files";
  if (accept === "image/*") return "Images";
  return accept.replace(/\*/g, "files");
}

function fileMatchesAccept(file: File, accept: string) {
  return accept
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .some((rule) => {
      if (rule.endsWith("/*")) {
        return file.type.startsWith(rule.replace("*", ""));
      }

      if (rule.startsWith(".")) {
        return file.name.toLowerCase().endsWith(rule.toLowerCase());
      }

      return file.type === rule;
    });
}

export default function AdminUploadField({
  label,
  mediaKind,
  accept,
  file,
  objectKey,
  externalUrl = "",
  uploadState = "idle",
  progress = 0,
  showUrlInput = false,
  urlPlaceholder = "https://…",
  successLabel = "Uploaded successfully",
  helperText,
  errorMessage,
  maxSizeBytes,
  onFileChange,
  onUrlChange,
  onRetry,
  onValidationError,
}: AdminUploadFieldProps) {
  const [source, setSource] = useState<UploadSource>(externalUrl ? "url" : "file");
  const resolvedMaxSize = maxSizeBytes ?? DEFAULT_MAX_BYTES[mediaKind];
  const isDone = objectKey || uploadState === "done";
  const isUploading = uploadState === "uploading";
  const isError = uploadState === "error";
  const isSelected = Boolean(file) && !isUploading && !isDone && !isError;
  const resolvedHelperText =
    helperText ?? `${formatAccept(accept)} up to ${formatBytes(resolvedMaxSize)}`;

  useEffect(() => {
    if (externalUrl) setSource("url");
  }, [externalUrl]);

  function handleSourceChange(nextSource: UploadSource) {
    setSource(nextSource);

    if (nextSource === "file" && onUrlChange) onUrlChange("");
    if (nextSource === "url") onFileChange(null);
  }

  function handleFileSelect(nextFile: File | null) {
    if (!nextFile) {
      onFileChange(null);
      return;
    }

    if (!fileMatchesAccept(nextFile, accept)) {
      onValidationError?.(`${nextFile.name} is not an accepted ${formatAccept(accept).toLowerCase()} type.`);
      return;
    }

    if (nextFile.size > resolvedMaxSize) {
      onValidationError?.(`${nextFile.name} is larger than the ${formatBytes(resolvedMaxSize)} limit.`);
      return;
    }

    onFileChange(nextFile);
    if (onUrlChange) onUrlChange("");
  }

  const statusText = isUploading
    ? `Uploading ${Math.max(0, Math.min(100, Math.round(progress)))}%`
    : isDone
      ? successLabel
      : isError
        ? errorMessage ?? "Upload failed."
        : isSelected
          ? `${file?.name} selected. Upload will start now.`
          : externalUrl
            ? "URL set."
            : "No file selected.";

  return (
    <div className="space-y-2">
      <p className="field-label">{label}</p>
      {showUrlInput && onUrlChange ? (
        <div
          className="inline-flex rounded border bg-white p-0.5"
          style={{ borderColor: "var(--brand-border)" }}
          aria-label={`${label} source`}
        >
          {(["file", "url"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleSourceChange(mode)}
              className="rounded px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: source === mode ? "var(--brand-primary)" : "transparent",
                color:
                  source === mode
                    ? "var(--brand-accent)"
                    : "var(--brand-text-soft)",
              }}
              aria-pressed={source === mode}
            >
              {mode === "file" ? "Upload file" : "Paste link"}
            </button>
          ))}
        </div>
      ) : null}

      {/* Upload drop zone */}
      {source === "file" ? (
        <label
          className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-all"
          style={{
            borderColor: isDone
              ? "#16a34a"
              : isError
                ? "#dc2626"
                : isSelected
                  ? "var(--brand-primary)"
                  : "rgba(10,79,60,0.25)",
            background: isDone
              ? "rgba(22,163,74,0.04)"
              : isError
                ? "rgba(220,38,38,0.04)"
                : isSelected
                  ? "rgba(10,79,60,0.05)"
                  : "rgba(10,79,60,0.02)",
          }}
        >
          <input
            type="file"
            className="sr-only"
            accept={accept}
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            disabled={isUploading}
          />

          {isUploading ? (
            <>
              <Loader2 size={28} className="animate-spin" style={{ color: "var(--brand-primary)" }} />
              <p className="text-xs font-medium" style={{ color: "var(--brand-primary)" }}>
                Uploading {Math.max(0, Math.min(100, Math.round(progress)))}%
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
                {errorMessage ?? "Upload failed."}
              </p>
            </>
          ) : (
            <>
              <span style={{ color: "var(--brand-primary)" }}>{KIND_ICONS[mediaKind]}</span>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--brand-primary)" }}>
                  {file ? file.name : "Click to browse or drag and drop"}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--brand-text-soft)" }}>
                  {file ? "Selected. Upload starts automatically." : resolvedHelperText}
                </p>
              </div>
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
      ) : null}

      {isError && onRetry && file ? (
        <button
          type="button"
          onClick={onRetry}
          className="button-tertiary inline-flex items-center gap-1.5"
        >
          <RotateCcw size={13} />
          Retry upload
        </button>
      ) : null}

      {isUploading ? (
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: "rgba(10,79,60,0.08)" }}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(100, Math.round(progress)))}%`,
              background: "var(--brand-primary)",
            }}
          />
        </div>
      ) : null}

      {/* Optional URL input */}
      {showUrlInput && onUrlChange && source === "url" ? (
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
                if (e.target.value) {
                  onFileChange(null);
                  setSource("url");
                }
              }}
            />
          </div>
      ) : null}

      <p
        className="text-xs"
        style={{ color: isError ? "#b91c1c" : isDone || externalUrl ? "#15803d" : "var(--brand-text-soft)" }}
        role="status"
        aria-live="polite"
      >
        {statusText}
      </p>
    </div>
  );
}
