"use client";

import { getEmbedInfo } from "../lib/embed";

interface MediaPlayerProps {
  /** Direct file URL or external platform URL (YouTube, Facebook, etc.) */
  src: string;
  type: string;
  title: string;
}

/**
 * Unified media player.
 *
 * - YouTube / Facebook URLs → responsive iframe embed
 * - Direct file URLs → native <video>, <audio>, or <img>
 */
export default function MediaPlayer({ src, type, title }: MediaPlayerProps) {
  // ─── Embed check ────────────────────────────────────────────────
  const embed = getEmbedInfo(src);

  if (embed) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-xl bg-black"
        style={{ paddingBottom: "56.25%" /* 16:9 */ }}
      >
        <iframe
          src={embed.embedSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  // ─── Native video ───────────────────────────────────────────────
  if (type === "video") {
    return (
      <video
        controls
        src={src}
        className="w-full rounded-xl bg-black"
        aria-label={title}
        preload="metadata"
      />
    );
  }

  // ─── Native audio ───────────────────────────────────────────────
  if (type === "audio") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-brand-primary text-sm font-medium">{title}</p>
        <audio
          controls
          src={src}
          className="w-full"
          aria-label={title}
          preload="metadata"
        />
      </div>
    );
  }

  // ─── Image ──────────────────────────────────────────────────────
  if (type === "image") {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={src} alt={title} className="w-full rounded-xl object-cover" />
    );
  }

  return null;
}
