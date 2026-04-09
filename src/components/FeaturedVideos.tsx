'use client';

import Link from 'next/link';
import { Play, Volume2, ArrowRight } from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  summary: string;
  speaker?: string | null;
  scriptureReference?: string | null;
  coverImageKey?: string | null;
  slug: string;
  type: 'VIDEO' | 'AUDIO';
}

function VideoCard({ item }: { item: MediaItem }) {
  return (
    <article className="site-panel overflow-hidden group">
      {/* Thumbnail placeholder */}
      <div
        className="relative aspect-video w-full overflow-hidden"
        style={{ background: 'var(--brand-primary-deep)' }}
      >
        {item.coverImageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImageKey}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play
              size={36}
              className="opacity-40"
              style={{ color: '#4ade80' }}
            />
          </div>
        )}
        <span className="type-badge absolute left-2 top-2">Video</span>
      </div>

      <div className="p-4">
        {item.speaker && (
          <p className="eyebrow text-brand-primary mb-1">{item.speaker}</p>
        )}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
        {item.scriptureReference && (
          <p className="text-brand-muted mt-1 text-xs italic">
            {item.scriptureReference}
          </p>
        )}
        <p className="text-brand-muted mt-2 text-xs leading-5 line-clamp-2">
          {item.summary}
        </p>
        <Link
          href={`/messages/${item.slug}`}
          className="button-tertiary mt-3 w-full"
          aria-label={`Watch ${item.title}`}
        >
          <Play size={13} className="mr-1.5" />
          Watch
        </Link>
      </div>
    </article>
  );
}

const PLACEHOLDER_VIDEOS: MediaItem[] = Array.from({ length: 8 }, (_, i) => ({
  id: `v${i + 1}`,
  slug: `video-message-${i + 1}`,
  type: 'VIDEO' as const,
  title: [
    'The Rest That God Provides',
    'Be Still and Know',
    'Evening Grace',
    'Renewing the Weary Soul',
    'Light at Eventide',
    "The Shepherd's Rest",
    'Sabbath Peace',
    'Coming Home',
  ][i],
  summary: 'A devotional message for the close of day.',
  speaker: 'The Covener',
  scriptureReference: [
    'Matthew 11:28',
    'Psalm 46:10',
    'Isaiah 40:31',
    'Psalm 23:2–3',
    'John 14:27',
    'Psalm 62:1',
    'Exodus 20:8–11',
    'Luke 15:20',
  ][i],
  coverImageKey: null,
}));

export default function FeaturedVideos({
  items = PLACEHOLDER_VIDEOS,
}: {
  items?: MediaItem[];
}) {
  const displayItems = items.length > 0 ? items.slice(0, 8) : PLACEHOLDER_VIDEOS;

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow text-brand-primary">Featured</p>
          <h2 className="section-title mt-1">Video Messages</h2>
        </div>
        <Link
          href="/messages?type=video"
          className="button-tertiary flex items-center gap-1.5"
        >
          See more
          <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayItems.map((item) => (
          <VideoCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
