"use client";

import Image from "next/image";
import { getEmbedInfo } from "../lib/embed";

interface MediaPlayerProps {
  /** Direct file URL or external platform URL (YouTube, Facebook, etc.) */
  src: string;
  type: string;
  title: string;
  /** Shown as cover art above an audio player — audio has no visual of its own. */
  coverImageUrl?: string | null;
}

/**
 * Unified media player.
 *
 * - YouTube / Facebook URLs → responsive iframe embed
 * - Direct file URLs → native <video>, <audio>, or <img>
 */
export default function MediaPlayer({ src, type, title, coverImageUrl }: MediaPlayerProps) {
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
      <div className="flex flex-col items-center gap-4 py-4">
        {coverImageUrl ? (
          <div
            className="relative aspect-square w-full max-w-[220px] overflow-hidden rounded-xl"
            style={{ background: "var(--brand-primary-deep)" }}
          >
            <Image
              src={coverImageUrl}
              alt=""
              fill
              sizes="220px"
              className="object-cover"
            />
          </div>
        ) : null}
        <p className="text-brand-primary px-4 text-center text-sm font-medium">
          {title}
        </p>
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
