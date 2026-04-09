'use client';

import Link from 'next/link';
import { Play, Mail } from 'lucide-react';

/**
 * Full-viewport video hero.
 * Pass `videoSrc` as a publicly accessible URL or leave blank
 * to get a dark gradient fallback while a video is pending upload.
 */
export default function VideoHero({ videoSrc }: { videoSrc?: string }) {
  return (
    <div className="video-hero">
      {/* ── Background video (or fallback gradient) ── */}
      {videoSrc ? (
        <video
          className="video-hero__video"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        <div className="video-hero__fallback" aria-hidden="true" />
      )}

      {/* ── Overlay ── */}
      <div className="video-hero__overlay" aria-hidden="true" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
        <p
          className="eyebrow mb-3"
          style={{ color: 'rgba(241,231,201,0.7)' }}
        >
          Sabbath Vesper Ministry
        </p>
        <h1
          className="font-semibold tracking-tight"
          style={{ fontSize: 'clamp(2.8rem,9vw,5.5rem)', color: '#fff8ea' }}
        >
          SAVEMI
        </h1>
        <p
          className="mt-2 text-base font-light tracking-wider sm:text-lg"
          style={{ color: 'rgba(241,231,201,0.75)' }}
        >
          Repose&nbsp;·&nbsp;Renewal&nbsp;·&nbsp;Restoration
        </p>
        <p
          className="mt-4 max-w-md text-sm leading-6 sm:text-base sm:leading-7"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          Reflective worship at eventide — sermons, music, and devotional
          messages for quiet hearts.
        </p>

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
