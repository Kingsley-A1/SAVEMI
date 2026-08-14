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
      <section className="audio-player" aria-label={`Audio player for ${title}`}>
        <div className="audio-player__art">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 639px) 208px, 168px"
              className="object-cover"
            />
          ) : (
            <div className="audio-player__fallback" aria-hidden="true" />
          )}
        </div>
        <div className="audio-player__content">
          <p className="audio-player__eyebrow">Audio message</p>
          <h2 className="audio-player__title">{title}</h2>
          <audio controls src={src} aria-label={title} preload="metadata" />
        </div>
      </section>
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
