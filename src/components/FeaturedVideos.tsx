"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import VideoThumbnail from "./VideoThumbnail";
import { CardGridSkeleton } from "./ui/Loading";

interface MediaItem {
  id: string;
  title: string;
  summary: string;
  speaker?: string | null;
  scriptureReference?: string | null;
  coverImageUrl?: string | null;
  thumbnailUrl?: string | null;
  previewVideoUrl?: string | null;
  slug: string;
}

// The video's own thumbnail is the card; title and speaker sit beneath it.
function VideoCard({ item }: { item: MediaItem }) {
  return (
    <Link
      href={`/messages/${item.slug}`}
      className="group block"
      aria-label={`Watch ${item.title}`}
    >
      <div
        className="relative aspect-video w-full overflow-hidden rounded-xl"
        style={{ background: "var(--brand-primary-deep)" }}
      >
        <VideoThumbnail
          imageUrl={item.thumbnailUrl ?? item.coverImageUrl}
          videoUrl={item.previewVideoUrl}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
            <Play size={18} className="ml-0.5 fill-white text-white" />
          </span>
        </div>
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-brand-primary">
        {item.title}
      </h3>
      {item.speaker ? (
        <p className="text-brand-muted mt-0.5 truncate text-xs">{item.speaker}</p>
      ) : null}
    </Link>
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">Video Messages</h2>
        </div>
        <Link
          href="/videos"
          className="button-tertiary flex items-center gap-1.5"
        >
          All
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
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayItems.map((item) => (
            <VideoCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
