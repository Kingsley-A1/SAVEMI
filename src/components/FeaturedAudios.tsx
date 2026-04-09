'use client';

import Link from 'next/link';
import { Headphones, ArrowRight } from 'lucide-react';

interface AudioItem {
  id: string;
  title: string;
  summary: string;
  speaker?: string | null;
  scriptureReference?: string | null;
  durationSeconds?: number | null;
  slug: string;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function AudioCard({ item }: { item: AudioItem }) {
  return (
    <article className="site-panel flex items-start gap-3 p-4">
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
        style={{ background: 'rgba(10,79,60,0.08)' }}
      >
        <Headphones size={19} style={{ color: 'var(--brand-primary)' }} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {item.speaker && (
          <p className="eyebrow text-brand-primary mb-0.5">{item.speaker}</p>
        )}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
        {item.scriptureReference && (
          <p className="text-brand-muted mt-0.5 text-xs italic">
            {item.scriptureReference}
          </p>
        )}
        {item.durationSeconds && (
          <p className="text-brand-muted mt-1 text-xs">
            {formatDuration(item.durationSeconds)}
          </p>
        )}
        <Link
          href={`/messages/${item.slug}`}
          className="text-brand-primary mt-2 inline-flex items-center gap-1 text-xs font-medium hover:underline"
          aria-label={`Listen to ${item.title}`}
        >
          <Headphones size={11} />
          Listen
        </Link>
      </div>
    </article>
  );
}

const PLACEHOLDER_AUDIOS: AudioItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `a${i + 1}`,
  slug: `audio-message-${i + 1}`,
  title: [
    'Draw Near to God',
    'The Still Small Voice',
    'Vesper Prayers',
    'Songs of the Night',
    'Eventide Devotion',
    'Rest in His Presence',
  ][i],
  summary: 'A quiet audio devotional for Sabbath evening.',
  speaker: 'The Covener',
  scriptureReference: [
    'James 4:8',
    '1 Kings 19:12',
    'Psalm 141:2',
    'Psalm 77:6',
    'Psalm 104:23',
    'Matthew 11:29',
  ][i],
  durationSeconds: [1320, 1560, 980, 1140, 1240, 1080][i],
}));

export default function FeaturedAudios({
  items = PLACEHOLDER_AUDIOS,
}: {
  items?: AudioItem[];
}) {
  const displayItems = items.length > 0 ? items.slice(0, 6) : PLACEHOLDER_AUDIOS;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow text-brand-primary">Featured</p>
          <h2 className="section-title mt-1">Audio Messages</h2>
        </div>
        <Link
          href="/messages?type=audio"
          className="button-tertiary flex items-center gap-1.5"
        >
          See more
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayItems.map((item) => (
          <AudioCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
