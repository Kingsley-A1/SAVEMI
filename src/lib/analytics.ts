/**
 * Read models for the admin Analytics page. All ranges are rolling windows
 * ending now, compared against the window of equal length before it.
 */

import { Prisma, type EngagementType } from "@prisma/client";
import { prisma } from "./db";
import { lookupContent, type ContentKind } from "./engagement";

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(value: unknown): RangeDays {
  const n = Number(value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

const DAY = 86_400_000;

export interface Kpi {
  label: string;
  value: number;
  previous: number;
}

export interface DayPoint {
  day: string; // YYYY-MM-DD (UTC)
  visitors: number;
  views: number;
}

export interface ContentRow {
  key: string;
  kind: ContentKind;
  title: string;
  path: string;
  views: number;
  plays: number;
  downloads: number;
  likes: number;
  comments: number;
}

export interface PersonRow {
  id: string;
  name: string;
  email: string;
  lastActive: Date;
  actions: number;
}

export interface ActivityRow {
  id: string;
  type: EngagementType;
  createdAt: Date;
  who: { kind: "member"; id: string; name: string } | { kind: "visitor"; country: string | null; device: string | null };
  content: { title: string; path: string } | null;
}

export interface AudienceSlice {
  label: string;
  count: number;
}

async function distinctVisitors(from: Date, to: Date): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ n: bigint }>>(Prisma.sql`
    SELECT count(DISTINCT "visitorId") AS n
    FROM "EngagementEvent"
    WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
  `);
  return Number(rows[0]?.n ?? 0);
}

async function typeCounts(from: Date, to: Date): Promise<Map<EngagementType, number>> {
  const rows = await prisma.engagementEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: from, lt: to } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.type, r._count._all]));
}

export async function getKpis(days: RangeDays): Promise<Kpi[]> {
  const now = new Date();
  const from = new Date(now.getTime() - days * DAY);
  const prevFrom = new Date(from.getTime() - days * DAY);

  const [visitors, prevVisitors, counts, prevCounts] = await Promise.all([
    distinctVisitors(from, now),
    distinctVisitors(prevFrom, from),
    typeCounts(from, now),
    typeCounts(prevFrom, from),
  ]);

  const pick = (m: Map<EngagementType, number>, t: EngagementType) => m.get(t) ?? 0;
  return [
    { label: "Visitors", value: visitors, previous: prevVisitors },
    { label: "Plays", value: pick(counts, "PLAY"), previous: pick(prevCounts, "PLAY") },
    { label: "Downloads", value: pick(counts, "DOWNLOAD"), previous: pick(prevCounts, "DOWNLOAD") },
    { label: "Comments", value: pick(counts, "COMMENT"), previous: pick(prevCounts, "COMMENT") },
  ];
}

export async function getDailySeries(days: RangeDays): Promise<DayPoint[]> {
  const from = new Date(Date.now() - (days - 1) * DAY);
  from.setUTCHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<Array<{ day: Date; visitors: bigint; views: bigint }>>(Prisma.sql`
    SELECT date_trunc('day', "createdAt") AS day,
           count(DISTINCT "visitorId") AS visitors,
           sum(CASE WHEN "type" = 'VIEW' THEN 1 ELSE 0 END) AS views
    FROM "EngagementEvent"
    WHERE "createdAt" >= ${from}
    GROUP BY 1
    ORDER BY 1
  `);

  const byDay = new Map(
    rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r]),
  );

  // Every day present, including the quiet ones.
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(from.getTime() + i * DAY).toISOString().slice(0, 10);
    const row = byDay.get(day);
    return { day, visitors: Number(row?.visitors ?? 0), views: Number(row?.views ?? 0) };
  });
}

export async function getTopContent(days: RangeDays, limit = 15): Promise<ContentRow[]> {
  const from = new Date(Date.now() - days * DAY);
  const rows = await prisma.engagementEvent.groupBy({
    by: ["targetKind", "targetId", "type"],
    where: { createdAt: { gte: from }, targetId: { not: null } },
    _count: { _all: true },
  });

  const lookup = await lookupContent(rows.map((r) => ({ kind: r.targetKind, id: r.targetId })));
  const table = new Map<string, ContentRow>();

  for (const r of rows) {
    const key = `${r.targetKind}:${r.targetId}`;
    const meta = lookup.get(key);
    if (!meta) continue; // deleted since
    const row =
      table.get(key) ??
      { key, kind: meta.kind, title: meta.title, path: meta.path, views: 0, plays: 0, downloads: 0, likes: 0, comments: 0 };
    const n = r._count._all;
    if (r.type === "VIEW") row.views += n;
    if (r.type === "PLAY") row.plays += n;
    if (r.type === "DOWNLOAD") row.downloads += n;
    if (r.type === "LIKE") row.likes += n;
    if (r.type === "COMMENT") row.comments += n;
    table.set(key, row);
  }

  return [...table.values()]
    .sort((a, b) => b.views - a.views || b.plays + b.downloads - (a.plays + a.downloads))
    .slice(0, limit);
}

export async function getPeople(days: RangeDays, limit = 12): Promise<PersonRow[]> {
  const from = new Date(Date.now() - days * DAY);
  const rows = await prisma.engagementEvent.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: from }, userId: { not: null } },
    _count: { _all: true },
    _max: { createdAt: true },
  });

  const ids = rows.map((r) => r.userId as string);
  const users = ids.length
    ? await prisma.siteUser.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } })
    : [];
  const byId = new Map(users.map((u) => [u.id, u]));

  return rows
    .map((r) => {
      const user = byId.get(r.userId as string);
      return user && r._max.createdAt
        ? { ...user, lastActive: r._max.createdAt, actions: r._count._all }
        : null;
    })
    .filter((r): r is PersonRow => r !== null)
    .sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime())
    .slice(0, limit);
}

export async function getAudience(days: RangeDays): Promise<{ devices: AudienceSlice[]; countries: AudienceSlice[] }> {
  const from = new Date(Date.now() - days * DAY);
  const [devices, countries] = await Promise.all([
    prisma.$queryRaw<Array<{ label: string | null; n: bigint }>>(Prisma.sql`
      SELECT "device" AS label, count(DISTINCT "visitorId") AS n FROM "EngagementEvent"
      WHERE "createdAt" >= ${from} GROUP BY 1 ORDER BY 2 DESC
    `),
    prisma.$queryRaw<Array<{ label: string | null; n: bigint }>>(Prisma.sql`
      SELECT "country" AS label, count(DISTINCT "visitorId") AS n FROM "EngagementEvent"
      WHERE "createdAt" >= ${from} GROUP BY 1 ORDER BY 2 DESC LIMIT 6
    `),
  ]);
  const map = (rows: Array<{ label: string | null; n: bigint }>) =>
    rows.map((r) => ({ label: r.label ?? "Unknown", count: Number(r.n) }));
  return { devices: map(devices), countries: map(countries) };
}

/** Meaningful actions only — page views would drown the feed. */
export async function getRecentActivity(
  limit = 20,
  where: Prisma.EngagementEventWhereInput = {},
  includeViews = false,
): Promise<ActivityRow[]> {
  const events = await prisma.engagementEvent.findMany({
    where: { ...(includeViews ? {} : { type: { not: "VIEW" } }), ...where },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const userIds = [...new Set(events.map((e) => e.userId).filter(Boolean))] as string[];
  const [users, content] = await Promise.all([
    userIds.length
      ? prisma.siteUser.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [],
    lookupContent(events.map((e) => ({ kind: e.targetKind, id: e.targetId }))),
  ]);
  const names = new Map(users.map((u) => [u.id, u.name]));

  return events.map((e) => {
    const meta = e.targetId ? content.get(`${e.targetKind}:${e.targetId}`) : undefined;
    return {
      id: e.id,
      type: e.type,
      createdAt: e.createdAt,
      who:
        e.userId && names.has(e.userId)
          ? { kind: "member", id: e.userId, name: names.get(e.userId) as string }
          : { kind: "visitor", country: e.country, device: e.device },
      content: meta ? { title: meta.title, path: meta.path } : e.path ? { title: e.path, path: e.path } : null,
    };
  });
}
