import Image from "next/image";
import Link from "next/link";
import { Headphones, Image as ImageIcon, Play, ArrowRight } from "lucide-react";

interface MessageCardProps {
  id: string;
  slug: string;
  title: string;
  type: string;
  date: string;
  speaker?: string | null;
  summary?: string | null;
  coverImageUrl?: string | null;
}

export default function MessageCard({
  slug,
  title,
  type,
  date,
  speaker,
  summary,
  coverImageUrl,
}: MessageCardProps) {
  const normalizedType = type.toLowerCase();
  const Icon =
    normalizedType === "audio"
      ? Headphones
      : normalizedType === "image"
        ? ImageIcon
        : Play;
  const typeLabel =
    normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);

  return (
    <article className="site-panel flex h-full flex-col overflow-hidden">
      <Link href={`/messages/${slug}`} className="group block">
        <div
          className="relative aspect-video overflow-hidden"
          style={{ background: "var(--brand-primary-deep)" }}
        >
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon size={34} style={{ color: "#86efac" }} />
            </div>
          )}

          <span className="type-badge absolute left-3 top-3 inline-flex items-center gap-1.5">
            <Icon size={12} />
            {typeLabel}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-brand-muted text-xs">{date}</span>
        </div>

        <Link href={`/messages/${slug}`} className="group">
          <h2 className="mt-3 text-base font-semibold leading-snug transition-colors group-hover:text-brand-primary">
            {title}
          </h2>
        </Link>

        {summary ? (
          <p className="text-brand-muted mt-2 line-clamp-3 text-sm leading-6">
            {summary}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="text-brand-muted min-w-0 truncate text-xs">
            {speaker ?? "SAVEMI Ministry"}
          </span>
          <Link
            href={`/messages/${slug}`}
            className="button-tertiary shrink-0 gap-1.5"
          >
            View
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}
