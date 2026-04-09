'use client';

import { useState, useCallback } from 'react';
import { BookOpen, Moon, Sunrise, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const WelcomeAnimation = dynamic(() => import('../components/WelcomeAnimation'), {
  ssr: false,
});
const VideoHero = dynamic(() => import('../components/VideoHero'), {
  ssr: false,
  loading: () => (
    <div
      className="relative flex min-h-[92vh] w-full items-center justify-center"
      style={{ background: 'var(--brand-primary-deep)' }}
    />
  ),
});
const FeaturedVideos = dynamic(() => import('../components/FeaturedVideos'));
const FeaturedAudios = dynamic(() => import('../components/FeaturedAudios'));

/* ── Scripture-backed pillars ───────────────────────────────── */
const pillars = [
  {
    label: 'Repose',
    icon: Moon,
    heading: '"Come to Me and I will give you rest"',
    verse: 'Matthew 11:28',
    body: 'A quiet place shaped for the soul at day\'s end — unhurried, undistracted, fully present.',
  },
  {
    label: 'Renewal',
    icon: Sunrise,
    heading: '"They shall mount up with wings like eagles"',
    verse: 'Isaiah 40:31',
    body: 'Strength replenished by the Word — minds renewed, spirits refreshed, hope confirmed.',
  },
  {
    label: 'Restoration',
    icon: Heart,
    heading: '"He restores my soul"',
    verse: 'Psalm 23:3',
    body: 'The ministry that gathers in brokenness and sends out whole — because the Shepherd never fails.',
  },
];

/* ── Facebook video placeholders ───────────────────────────── */
// Replace VIDEO_ID_1 etc. with real numeric video IDs from your Facebook page
const FACEBOOK_VIDEOS: { id: string; label: string }[] = [
  { id: 'VIDEO_ID_1', label: 'Featured Message 1' },
  { id: 'VIDEO_ID_2', label: 'Featured Message 2' },
  { id: 'VIDEO_ID_3', label: 'Featured Message 3' },
];

function FacebookEmbed({ videoId, label }: { videoId: string; label: string }) {
  if (!videoId || videoId.startsWith('VIDEO_ID')) {
    return (
      <div
        className="site-panel flex aspect-video w-full items-center justify-center text-xs"
        style={{ color: 'var(--brand-text-soft)' }}
      >
        <div className="text-center">
          <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
          <p>Video embed coming soon</p>
        </div>
      </div>
    );
  }
  const src = `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fvideo%2F${videoId}&show_text=false&width=560&t=0`;
  return (
    <iframe
      src={src}
      title={label}
      className="site-panel aspect-video w-full border-0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      scrolling="no"
      loading="lazy"
    />
  );
}

export default function HomePage() {
  const [animDone, setAnimDone] = useState(false);
  const handleAnimDone = useCallback(() => setAnimDone(true), []);

  return (
    <>
      {!animDone && <WelcomeAnimation onDone={handleAnimDone} />}

      <div
        className={`space-y-16 transition-opacity duration-500 ${
          animDone ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* 1. Video hero */}
        <VideoHero />

        {/* 2. Brand statement */}
        <section className="site-container">
          <div className="hero-surface px-6 py-10 sm:px-10 sm:py-12">
            <div className="max-w-2xl">
              <p className="eyebrow" style={{ color: 'rgba(241,231,201,0.65)' }}>
                About the Ministry
              </p>
              <h2
                className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl"
                style={{ color: '#fff8ea' }}
              >
                Vesper worship for the quiet heart
              </h2>
              <p
                className="mt-3 max-w-lg text-sm leading-6 sm:text-base sm:leading-7"
                style={{ color: 'rgba(241,231,201,0.72)' }}
              >
                Sabbath Vesper Ministry (SAVEMI) companions believers at day&apos;s close
                through Scripture, song, and prayer — holding space for the soul to
                come home to God.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/about" className="button-secondary">
                  Our story
                </Link>
                <Link href="/messages" className="button-secondary">
                  All messages
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Scripture pillars */}
        <section className="site-container">
          <div className="mb-6 text-center">
            <p className="eyebrow text-brand-primary">Our Foundation</p>
            <h2 className="section-title mt-2">Rooted in the Word</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {pillars.map(({ label, icon: Icon, heading, verse, body }) => (
              <article key={label} className="site-panel p-5">
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded"
                  style={{ background: 'rgba(10,79,60,0.08)' }}
                >
                  <Icon size={20} style={{ color: 'var(--brand-primary)' }} />
                </div>
                <p className="eyebrow text-brand-primary">{label}</p>
                <h3 className="mt-2 text-sm font-semibold italic leading-snug">
                  {heading}
                </h3>
                <p
                  className="mt-1 text-xs font-medium"
                  style={{ color: 'var(--brand-primary-soft)' }}
                >
                  — {verse}
                </p>
                <p className="text-brand-muted mt-3 text-xs leading-5">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* 4. Featured videos */}
        <section className="site-container">
          <FeaturedVideos />
        </section>

        {/* 5. Facebook feed */}
        <section className="site-container">
          <div className="mb-5">
            <p className="eyebrow text-brand-primary">Live Feed</p>
            <h2 className="section-title mt-1">From Our Facebook Page</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {FACEBOOK_VIDEOS.map(({ id, label }) => (
              <FacebookEmbed key={id} videoId={id} label={label} />
            ))}
          </div>
          <div className="mt-4 text-center">
            <a
              href="https://web.facebook.com/profile.php?id=61586401769698"
              target="_blank"
              rel="noopener noreferrer"
              className="button-tertiary inline-flex items-center gap-1.5"
            >
              Visit our Facebook page
              <ArrowRight size={14} />
            </a>
          </div>
        </section>

        {/* 6. Featured audios */}
        <section className="site-container">
          <FeaturedAudios />
        </section>

        {/* 7. CTA strip */}
        <section className="site-container pb-12">
          <div
            className="rounded-lg px-6 py-10 text-center sm:px-10"
            style={{
              background:
                'linear-gradient(135deg, var(--brand-primary-deep) 0%, var(--brand-primary) 100%)',
            }}
          >
            <p className="eyebrow" style={{ color: 'rgba(241,231,201,0.65)' }}>
              Stay Connected
            </p>
            <h2
              className="mt-3 text-2xl font-semibold sm:text-3xl"
              style={{ color: '#fff8ea' }}
            >
              Join the vesper community
            </h2>
            <p
              className="mx-auto mt-3 max-w-md text-sm leading-6"
              style={{ color: 'rgba(241,231,201,0.72)' }}
            >
              Reach out with a prayer request, testimony, or any question — the
              ministry door is always open.
            </p>
            <Link href="/contact" className="hero-btn-primary mt-6 inline-flex">
              Send a message
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
