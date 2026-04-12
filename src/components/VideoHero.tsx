"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Mail } from "lucide-react";

interface HeroMediaPayload {
  title: string;
  summary: string;
  type: "video" | "audio" | "image";
  downloadUrl: string | null;
  coverImageUrl: string | null;
}

/**
 * Full-viewport video hero.
 * Pass `videoSrc` as a publicly accessible URL or leave blank
 * to get a dark gradient fallback while a video is pending upload.
 */
export default function VideoHero({ videoSrc }: { videoSrc?: string }) {
  const [heroMedia, setHeroMedia] = useState<HeroMediaPayload | null>(null);

  useEffect(() => {
    if (videoSrc) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/messages/hero", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        const payload = await response.json().catch(() => null);
        return payload?.data ?? null;
      })
      .then((payload) => {
        setHeroMedia(payload);
      })
      .catch(() => {
        setHeroMedia(null);
      });

    return () => controller.abort();
  }, [videoSrc]);

  const resolvedVideoSrc =
    videoSrc ||
    (heroMedia?.type === "video"
      ? heroMedia.downloadUrl ?? heroMedia.coverImageUrl
      : undefined);
  const resolvedImageSrc =
    !resolvedVideoSrc && heroMedia
      ? heroMedia.type === "image"
        ? heroMedia.downloadUrl ?? heroMedia.coverImageUrl
        : heroMedia.coverImageUrl
      : undefined;

  return (
    <div className="video-hero">
      {/* ── Background video (or fallback gradient) ── */}
      {resolvedVideoSrc ? (
        <video
          className="video-hero__video"
          src={resolvedVideoSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : resolvedImageSrc ? (
        <img
          className="video-hero__video"
          src={resolvedImageSrc}
          alt=""
          aria-hidden="true"
        />
      ) : (
        <div className="video-hero__fallback" aria-hidden="true" />
      )}

      {/* ── Overlay ── */}
      <div className="video-hero__overlay" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
        <p className="eyebrow mb-3" style={{ color: "rgba(241,231,201,0.7)" }}>
          Sabbath Vesper Ministry
        </p>
        <h1
          className="font-semibold tracking-tight"
          style={{ fontSize: "clamp(2.8rem,9vw,5.5rem)", color: "#fff8ea" }}
        >
          SAVEMI
        </h1>
        <p
          className="mt-2 text-base font-light tracking-wider sm:text-lg"
          style={{ color: "rgba(241,231,201,0.75)" }}
        >
          Repose&nbsp;·&nbsp;Renewal&nbsp;·&nbsp;Restoration
        </p>
        <p
          className="mt-4 max-w-md text-sm leading-6 sm:text-base sm:leading-7"
          style={{ color: "rgba(255,255,255,0.65)" }}
        >
          {heroMedia?.summary ||
            "Reflective worship at eventide — sermons, music, and devotional messages for quiet hearts."}
        </p>

        {heroMedia?.title ? (
          <p
            className="mt-3 text-xs uppercase tracking-[0.18em]"
            style={{ color: "rgba(241,231,201,0.68)" }}
          >
            Featured Hero Media: {heroMedia.title}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/messages"
            className="hero-btn-primary"
            aria-label="Browse messages"
          >
            <Play size={16} className="mr-1.5" aria-hidden="true" />
            Messages
          </Link>
          <Link
            href="/contact"
            className="hero-btn-secondary"
            aria-label="Connect with the ministry"
          >
            <Mail size={16} className="mr-1.5" aria-hidden="true" />
            Connect
          </Link>
        </div>
      </div>
    </div>
  );
}
