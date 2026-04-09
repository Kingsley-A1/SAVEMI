import Link from "next/link";

interface MessageCardProps {
  id: string;
  slug: string;
  title: string;
  type: string;
  date: string;
  speaker?: string | null;
  summary?: string | null;
}

export default function MessageCard({
  slug,
  title,
  type,
  date,
  speaker,
  summary,
}: MessageCardProps) {
  return (
    <article className="site-panel flex flex-col p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="type-badge">{type}</span>
        <span className="text-brand-muted text-xs">{date}</span>
      </div>

      <h2 className="mt-3 text-sm font-semibold leading-snug sm:text-base">
        {title}
      </h2>

      {summary ? (
        <p className="text-brand-muted mt-1.5 line-clamp-3 text-xs leading-5 sm:text-sm">
          {summary}
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="text-brand-muted text-xs">
          {speaker ?? "SAVEMI Ministry"}
        </span>
        <Link href={`/messages/${slug}`} className="button-tertiary shrink-0">
          View →
        </Link>
      </div>
    </article>
  );
}
