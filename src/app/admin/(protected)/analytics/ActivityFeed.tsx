import Link from "next/link";
import type { ActivityRow } from "../../../../lib/analytics";

const VERB: Record<ActivityRow["type"], string> = {
  VIEW: "viewed",
  PLAY: "played",
  DOWNLOAD: "downloaded",
  LIKE: "liked",
  COMMENT: "commented on",
};

const COUNTRY = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return COUNTRY.of(code) ?? code;
  } catch {
    return code;
  }
}

export function timeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ActivityFeed({ rows, empty }: { rows: ActivityRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-brand-muted px-5 py-8 text-center text-sm">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-[color:var(--brand-border)]">
      {rows.map((row) => {
        const visitor =
          row.who.kind === "visitor"
            ? ["A visitor", countryName(row.who.country), row.who.device].filter(Boolean).join(" · ")
            : null;
        return (
          <li key={row.id} className="flex items-baseline gap-3 px-5 py-2.5 text-sm">
            <p className="min-w-0 flex-1 truncate">
              {row.who.kind === "member" ? (
                <Link href={`/admin/analytics/people/${row.who.id}`} className="font-semibold hover:underline">
                  {row.who.name}
                </Link>
              ) : (
                <span className="text-brand-muted">{visitor}</span>
              )}{" "}
              <span className="text-brand-muted">{VERB[row.type]}</span>{" "}
              {row.content ? (
                <Link href={row.content.path} target="_blank" className="hover:underline">
                  {row.content.title}
                </Link>
              ) : null}
            </p>
            <time className="text-brand-muted shrink-0 text-xs tabular-nums" dateTime={row.createdAt.toISOString()}>
              {timeAgo(row.createdAt)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
