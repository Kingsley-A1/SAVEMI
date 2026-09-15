"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Headphones, ArrowRight } from "lucide-react";
import { CardGridSkeleton } from "./ui/Loading";

interface AudioItem {
  id: string;
  title: string;
  summary: string;
  speaker?: string | null;
  coverImageUrl?: string | null;
  slug: string;
}

// The cover art carries the card — no title or speaker text on top of it
// until the visitor opens it, matching the audio library's gallery cards.
function AudioCard({ item }: { item: AudioItem }) {
  return (
    <Link
      href={`/messages/${item.slug}`}
      className="media-tile group block"
      aria-label={`${item.title}${item.speaker ? ` — ${item.speaker}` : ""}`}
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        style={{ background: "var(--brand-primary-deep)" }}
      >
        {item.coverImageUrl ? (
          <Image
            src={item.coverImageUrl}
            alt=""
            fill
            quality={90}
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Headphones size={30} style={{ color: "#86efac" }} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/15">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 opacity-90 backdrop-blur-sm">
            <Headphones size={16} className="text-white" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedAudios({
  items = [],
}: {
  items?: AudioItem[];
}) {
  const [fetchedItems, setFetchedItems] = useState<AudioItem[]>([]);
  const [isLoading, setIsLoading] = useState(items.length === 0);

  useEffect(() => {
    if (items.length > 0) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/messages?type=audio&limit=6", { signal: controller.signal })
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

  const displayItems = (items.length > 0 ? items : fetchedItems).slice(0, 6);

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <p className="eyebrow text-brand-primary">Featured</p>
          <h2 className="section-title mt-1">Audio Messages</h2>
        </div>
        <Link
          href="/audio"
          className="button-tertiary flex items-center gap-1.5"
        >
          See more
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && displayItems.length === 0 ? (
        <CardGridSkeleton
          count={6}
          variant="tile"
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
          label="Loading featured audio messages"
        />
      ) : displayItems.length === 0 ? (
        <div className="site-panel p-5 text-sm text-brand-muted">
          No published audio messages are available yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {displayItems.map((item) => (
            <AudioCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
