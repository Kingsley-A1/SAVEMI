import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { isDatabaseConfigured } from "../../../../lib/db";
import {
  getAudience,
  getDailySeries,
  getKpis,
  getPeople,
  getRecentActivity,
  getTopContent,
  parseRange,
  RANGES,
  type DayPoint,
  type Kpi,
} from "../../../../lib/analytics";
import ActivityFeed, { timeAgo } from "./ActivityFeed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics | SAVEMI Admin",
};

const KIND_LABEL = { MESSAGE: "Message", RESOURCE: "Resource", QUOTE: "Quote" } as const;
const nf = new Intl.NumberFormat("en-US");

function KpiTile({ kpi, days }: { kpi: Kpi; days: number }) {
  const delta = kpi.previous === 0 ? null : (kpi.value - kpi.previous) / kpi.previous;
  const up = delta !== null && delta >= 0;
  return (
    <div className="site-panel p-4">
      <p className="text-brand-muted text-xs font-medium">{kpi.label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{nf.format(kpi.value)}</p>
      <p className="text-brand-muted mt-1 flex items-center gap-1 text-xs">
        {delta === null ? (
          kpi.value > 0 ? "New this period" : `Last ${days} days`
        ) : (
          <>
            {up ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
            <span>
              {up ? "+" : "−"}
              {Math.abs(Math.round(delta * 100))}% vs previous {days} days
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/** Daily visitors — one series, one hue, a tooltip per bar. */
function VisitorsChart({ points }: { points: DayPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.visitors));
  const fmt = (day: string) =>
    new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const labelIdx = new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]);

  return (
    <div>
      <div className="relative h-40">
        <div className="text-brand-muted absolute inset-x-0 top-0 border-t border-dashed text-[10px]" style={{ borderColor: "var(--brand-border)" }}>
          <span className="absolute -top-2 right-0 bg-white pl-1 tabular-nums">{nf.format(max)}</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 border-t" style={{ borderColor: "var(--brand-border)" }} />
        <ol className="absolute inset-0 flex items-end gap-[2px] pr-8" aria-label="Visitors per day">
          {points.map((p) => (
            <li key={p.day} className="group relative flex h-full flex-1 items-end" tabIndex={0} aria-label={`${fmt(p.day)}: ${p.visitors} visitors, ${p.views} page views`}>
              <span
                className="block w-full rounded-t-[4px] transition-opacity group-hover:opacity-80"
                style={{
                  height: p.visitors === 0 ? 0 : `max(2px, ${(p.visitors / max) * 100}%)`,
                  background: "var(--brand-primary)",
                }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-white px-2 py-1 text-xs shadow-md group-hover:block group-focus:block" style={{ border: "1px solid var(--brand-border)" }}>
                <strong className="tabular-nums">{p.visitors}</strong> visitors · {p.views} views
                <span className="text-brand-muted block">{fmt(p.day)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="text-brand-muted relative mt-1.5 h-4 pr-8 text-[10px]">
        {points.map((p, i) =>
          labelIdx.has(i) ? (
            <span
              key={p.day}
              className="absolute"
              style={{
                left: `${(i / Math.max(1, points.length - 1)) * 100}%`,
                transform: i === 0 ? "none" : i === points.length - 1 ? "translateX(-100%)" : "translateX(-50%)",
              }}
            >
              {fmt(p.day)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  const total = rows.reduce((n, r) => n + r.count, 0) || 1;
  const COUNTRY = new Intl.DisplayNames(["en"], { type: "region" });
  const name = (label: string) => {
    if (/^[A-Z]{2}$/.test(label)) {
      try {
        return COUNTRY.of(label) ?? label;
      } catch {
        return label;
      }
    }
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  return (
    <div>
      <p className="text-brand-muted text-xs font-medium">{title}</p>
      {rows.length === 0 ? (
        <p className="text-brand-muted mt-2 text-sm">—</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="text-sm">
              <div className="flex justify-between gap-2">
                <span className="truncate">{name(r.label)}</span>
                <span className="text-brand-muted tabular-nums">{Math.round((r.count / total) * 100)}%</span>
              </div>
              <div className="mt-1 h-1 rounded-full" style={{ background: "rgba(0,41,27,0.08)" }}>
                <div className="h-1 rounded-full" style={{ width: `${(r.count / total) * 100}%`, background: "var(--brand-primary)" }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const days = parseRange((await searchParams).range);

  if (!isDatabaseConfigured()) {
    return <div className="site-panel p-6 text-sm">Database not configured.</div>;
  }

  const [kpis, series, top, people, audience, activity] = await Promise.all([
    getKpis(days),
    getDailySeries(days),
    getTopContent(days),
    getPeople(days),
    getAudience(days),
    getRecentActivity(20),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <nav className="flex rounded-lg border bg-white p-0.5 text-sm" style={{ borderColor: "var(--brand-border)" }} aria-label="Time range">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/analytics?range=${r}`}
              aria-current={r === days ? "page" : undefined}
              className="rounded-md px-3 py-1"
              style={r === days ? { background: "var(--brand-primary)", color: "var(--brand-accent)" } : undefined}
            >
              {r}d
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiTile key={kpi.label} kpi={kpi} days={days} />
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="site-panel p-5">
          <h2 className="text-sm font-semibold">Visitors per day</h2>
          <div className="mt-4">
            <VisitorsChart points={series} />
          </div>
        </section>
        <section className="site-panel grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-1">
          <Breakdown title="Device" rows={audience.devices} />
          <Breakdown title="Country" rows={audience.countries} />
        </section>
      </div>

      <section className="site-panel overflow-hidden">
        <h2 className="border-b px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-border)" }}>
          Top content
        </h2>
        {top.length === 0 ? (
          <p className="text-brand-muted px-5 py-8 text-center text-sm">No content activity in this period yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-muted text-left text-xs">
                  <th className="px-5 py-2 font-medium">Content</th>
                  {["Views", "Plays", "Downloads", "Likes", "Comments"].map((h) => (
                    <th key={h} className="px-3 py-2 text-right font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[color:var(--brand-border)]">
                {top.map((row) => (
                  <tr key={row.key}>
                    <td className="max-w-[18rem] px-5 py-2.5">
                      <Link href={row.path} target="_blank" className="block truncate font-medium hover:underline">
                        {row.title}
                      </Link>
                      <span className="text-brand-muted text-xs">{KIND_LABEL[row.kind]}</span>
                    </td>
                    {[row.views, row.plays, row.downloads, row.likes, row.comments].map((n, i) => (
                      <td key={i} className={`px-3 py-2.5 text-right tabular-nums ${n === 0 ? "text-brand-muted" : ""}`}>
                        {n === 0 ? "–" : nf.format(n)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="site-panel overflow-hidden">
          <h2 className="border-b px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-border)" }}>
            Members
          </h2>
          {people.length === 0 ? (
            <p className="text-brand-muted px-5 py-8 text-center text-sm">No signed-in activity in this period.</p>
          ) : (
            <ul className="divide-y divide-[color:var(--brand-border)]">
              {people.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/analytics/people/${p.id}`} className="flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-black/[0.02]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="text-brand-muted block truncate text-xs">{p.email}</span>
                    </span>
                    <span className="text-brand-muted shrink-0 text-right text-xs">
                      {p.actions} {p.actions === 1 ? "action" : "actions"}
                      <span className="block">{timeAgo(p.lastActive)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="site-panel overflow-hidden">
          <h2 className="border-b px-5 py-3 text-sm font-semibold" style={{ borderColor: "var(--brand-border)" }}>
            Recent activity
          </h2>
          <ActivityFeed rows={activity} empty="Plays, downloads, likes and comments will appear here." />
        </section>
      </div>
    </div>
  );
}
