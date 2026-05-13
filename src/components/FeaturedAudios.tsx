"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, ArrowRight } from "lucide-react";

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
  return `${m}:${String(s).padStart(2, "0")}`;
}

function AudioCard({ item }: { item: AudioItem }) {
  return (
    <article className="site-panel flex items-start gap-3 p-4">
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
        style={{ background: "rgba(10,79,60,0.08)" }}
      >
        <Headphones size={19} style={{ color: "var(--brand-primary)" }} />
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
          href="/messages?type=audio"
          className="button-tertiary flex items-center gap-1.5"
        >
          See more
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && displayItems.length === 0 ? (
        <div className="site-panel p-5 text-sm text-brand-muted">
          Loading published audio messages...
        </div>
      ) : displayItems.length === 0 ? (
        <div className="site-panel p-5 text-sm text-brand-muted">
          No published audio messages are available yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item) => (
            <AudioCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
