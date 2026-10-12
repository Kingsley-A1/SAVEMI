import Image from "next/image";
import Link from "next/link";
import { Headphones, Play } from "lucide-react";

/**
 * One audio message as a compact row: square art, title, speaker. Reads like
 * a playlist, so a column of them stays legible at any width.
 */
export default function AudioRow({
  slug,
  title,
  speaker,
  coverImageUrl,
}: {
  slug: string;
  title: string;
  speaker?: string | null;
  coverImageUrl?: string | null;
}) {
  return (
    <Link
      href={`/messages/${slug}`}
      className="audio-row group"
      aria-label={`Listen to ${title}${speaker ? ` — ${speaker}` : ""}`}
    >
      <span className="audio-row__art">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <Headphones size={20} aria-hidden="true" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-brand-primary">
          {title}
        </span>
        {speaker ? (
          <span className="text-brand-muted mt-0.5 block truncate text-xs">
            {speaker}
          </span>
        ) : null}
      </span>

      <span className="audio-row__play" aria-hidden="true">
        <Play size={14} className="ml-0.5 fill-current" />
      </span>
    </Link>
  );
}
