"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AudioRow from "./AudioRow";
import { CardGridSkeleton } from "./ui/Loading";

interface AudioItem {
  id: string;
  title: string;
  summary: string;
  speaker?: string | null;
  coverImageUrl?: string | null;
  slug: string;
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">Audio Messages</h2>
        </div>
        <Link
          href="/audio"
          className="button-tertiary flex items-center gap-1.5"
        >
          All
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && displayItems.length === 0 ? (
        <CardGridSkeleton
          count={6}
          variant="text"
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          label="Loading featured audio messages"
        />
      ) : displayItems.length === 0 ? (
        <div className="site-panel p-5 text-sm text-brand-muted">
          No published audio messages are available yet.
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item) => (
            <li key={item.id}>
              <AudioRow
                slug={item.slug}
                title={item.title}
                speaker={item.speaker}
                coverImageUrl={item.coverImageUrl}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
