"use client";

import { useState } from "react";
import { Download, ExternalLink, Film, Music } from "lucide-react";
import { Spinner } from "./ui/Loading";

interface MessageDownloadActionsProps {
  type: "video" | "audio" | "image";
  title: string;
  /** Same-origin endpoint that streams the media as a named attachment. */
  mediaDownloadHref: string | null;
  /** Same-origin endpoint for the companion audio track, when one exists. */
  audioDownloadHref?: string | null;
  /** External platform link, shown when the media lives off-site. */
  originalUrl?: string | null;
}

function downloadLabel(type: MessageDownloadActionsProps["type"]) {
  if (type === "audio") return "Download audio";
  if (type === "image") return "Download image";
  return "Download";
}

/**
 * Download links point at the site's own endpoint, which responds with
 * `Content-Disposition: attachment` — so a single click saves the file under
 * the title the admin gave it, and the visitor is never taken to a storage URL.
 */
function DownloadLink({
  href,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const [preparing, setPreparing] = useState(false);

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      aria-busy={preparing || undefined}
      className={className}
      onClick={() => {
        // The navigation is replaced by a download, so the page never
        // changes — clear the indicator once the transfer has begun.
        setPreparing(true);
        window.setTimeout(() => setPreparing(false), 4000);
      }}
    >
      {preparing ? <Spinner size="xs" /> : null}
      {children}
    </a>
  );
}

export default function MessageDownloadActions({
  type,
  title,
  mediaDownloadHref,
  audioDownloadHref,
  originalUrl,
}: MessageDownloadActionsProps) {
  if (type !== "video") {
    if (!mediaDownloadHref) return null;

    return (
      <DownloadLink
        href={mediaDownloadHref}
        ariaLabel={`${downloadLabel(type)} for ${title}`}
        className="button-tertiary inline-flex items-center gap-1.5"
      >
        <Download size={14} aria-hidden="true" />
        {downloadLabel(type)}
      </DownloadLink>
    );
  }

  const rowClass =
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-[rgba(10,79,60,0.06)] focus:bg-[rgba(10,79,60,0.06)] focus:outline-none";

  return (
    <details className="group relative">
      <summary className="button-tertiary inline-flex cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden">
        <Download size={14} aria-hidden="true" />
        Download
      </summary>

      <div
        className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-lg border bg-white p-1.5 shadow-lg"
        style={{ borderColor: "var(--brand-border)" }}
      >
        {audioDownloadHref ? (
          <DownloadLink
            href={audioDownloadHref}
            ariaLabel={`Download the audio of ${title}`}
            className={rowClass}
          >
            <Music size={15} aria-hidden="true" />
            Download audio
          </DownloadLink>
        ) : (
          <p className="text-brand-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm">
            <Music size={15} aria-hidden="true" />
            Audio download not added
          </p>
        )}

        {mediaDownloadHref ? (
          <DownloadLink
            href={mediaDownloadHref}
            ariaLabel={`Download the video of ${title}`}
            className={rowClass}
          >
            <Film size={15} aria-hidden="true" />
            Download video
          </DownloadLink>
        ) : originalUrl ? (
          <a
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={rowClass}
          >
            <ExternalLink size={15} aria-hidden="true" />
            Open video source
          </a>
        ) : (
          <p className="text-brand-muted flex items-center gap-2 rounded-md px-3 py-2 text-sm">
            <Film size={15} aria-hidden="true" />
            Video download not added
          </p>
        )}
      </div>
    </details>
  );
}
