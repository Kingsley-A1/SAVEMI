import { Download, ExternalLink, Film, Music } from "lucide-react";

interface MessageDownloadActionsProps {
  type: "video" | "audio" | "image";
  title: string;
  mediaDownloadUrl: string | null;
  audioDownloadUrl?: string | null;
  originalUrl?: string | null;
}

function buildDownloadName(title: string, label: string) {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "savemi-message";

  return `${slug}-${label}`;
}

function downloadLabel(type: MessageDownloadActionsProps["type"]) {
  if (type === "audio") return "Download audio";
  if (type === "image") return "Download image";
  return "Download";
}

export default function MessageDownloadActions({
  type,
  title,
  mediaDownloadUrl,
  audioDownloadUrl,
  originalUrl,
}: MessageDownloadActionsProps) {
  if (type !== "video") {
    if (!mediaDownloadUrl) return null;

    return (
      <a
        href={mediaDownloadUrl}
        download={buildDownloadName(title, type)}
        className="button-tertiary mt-4 inline-flex items-center gap-1.5"
      >
        <Download size={14} aria-hidden="true" />
        {downloadLabel(type)}
      </a>
    );
  }

  return (
    <details className="group mt-4 w-full max-w-xs">
      <summary className="button-tertiary inline-flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
        <Download size={14} aria-hidden="true" />
        Download
      </summary>

      <div
        className="mt-2 overflow-hidden rounded-lg border bg-white p-1.5 shadow-sm"
        style={{ borderColor: "var(--brand-border)" }}
      >
        {audioDownloadUrl ? (
          <a
            href={audioDownloadUrl}
            download={buildDownloadName(title, "audio")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgba(10,79,60,0.06)] focus:bg-[rgba(10,79,60,0.06)] focus:outline-none"
          >
            <Music size={15} aria-hidden="true" />
            Download audio
          </a>
        ) : (
          <p className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-muted">
            <Music size={15} aria-hidden="true" />
            Audio download not added
          </p>
        )}

        {mediaDownloadUrl ? (
          <a
            href={mediaDownloadUrl}
            download={buildDownloadName(title, "video")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgba(10,79,60,0.06)] focus:bg-[rgba(10,79,60,0.06)] focus:outline-none"
          >
            <Film size={15} aria-hidden="true" />
            Download video
          </a>
        ) : originalUrl ? (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgba(10,79,60,0.06)] focus:bg-[rgba(10,79,60,0.06)] focus:outline-none"
          >
            <ExternalLink size={15} aria-hidden="true" />
            Open video source
          </a>
        ) : (
          <p className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-muted">
            <Film size={15} aria-hidden="true" />
            Video download not added
          </p>
        )}
      </div>
    </details>
  );
}
