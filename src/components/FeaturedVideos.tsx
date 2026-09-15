"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { CardGridSkeleton } from "./ui/Loading";

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
            quality={90}
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
            <Play size={18} className="ml-0.5 fill-white text-white" />
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold leading-snug line-clamp-2">
          {item.title}
        </h3>
        {item.speaker && (
          <p className="text-brand-muted mt-0.5 text-xs">{item.speaker}</p>
        )}
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
          href="/videos"
          className="button-tertiary flex items-center gap-1.5"
        >
          See more
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && displayItems.length === 0 ? (
        <CardGridSkeleton
          count={4}
          variant="media"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          label="Loading featured video messages"
        />
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
