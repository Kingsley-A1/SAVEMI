"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";

interface MediaItem {
  id: string;
  title: string;
  summary: string;
  speaker?: string | null;
  scriptureReference?: string | null;
  coverImageUrl?: string | null;
  slug: string;
}

function VideoCard({ item }: { item: MediaItem }) {
  return (
    <article className="site-panel overflow-hidden group">
      {/* Thumbnail placeholder */}
      <div
        className="relative aspect-video w-full overflow-hidden"
        style={{ background: "var(--brand-primary-deep)" }}
      >
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play
              size={36}
              className="opacity-40"
              style={{ color: "#4ade80" }}
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

export default function FeaturedVideos({
  items = [],
}: {
  items?: MediaItem[];
}) {
  const [fetchedItems, setFetchedItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(items.length === 0);

  useEffect(() => {
    if (items.length > 0) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/messages?type=video&limit=8", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          return [];
        }

        const payload = await response.json().catch(() => null);
        return Array.isArray(payload?.data) ? payload.data : [];
      })
      .then((data) => {
        setFetchedItems(data);
      })
      .catch(() => {
        setFetchedItems([]);
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [items]);

  const displayItems = (items.length > 0 ? items : fetchedItems).slice(0, 8);

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

      {isLoading && displayItems.length === 0 ? (
        <div className="site-panel p-5 text-sm text-brand-muted">
          Loading published video messages...
        </div>
      ) : displayItems.length === 0 ? (
        <div className="site-panel p-5 text-sm text-brand-muted">
          No published video messages are available yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {displayItems.map((item) => (
            <VideoCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
