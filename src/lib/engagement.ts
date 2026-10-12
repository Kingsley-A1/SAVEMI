/**
 * Engagement core: the content people can like and comment on, and the
 * first-party analytics events recorded as they use it.
 *
 * Privacy stance: an anonymous visitor is a random first-party id plus a
 * coarse country and device class. No IP address is ever stored.
 */

import { randomUUID } from "crypto";
import type { EngagementType, TargetKind } from "@prisma/client";
import { prisma } from "./db";

export type ContentKind = Extract<TargetKind, "MESSAGE" | "RESOURCE" | "QUOTE">;

export const CONTENT_KINDS: readonly ContentKind[] = ["MESSAGE", "RESOURCE", "QUOTE"];

export function parseContentKind(value: unknown): ContentKind | null {
  return typeof value === "string" && CONTENT_KINDS.includes(value as ContentKind)
    ? (value as ContentKind)
    : null;
}

export function parseLikeKind(value: unknown): TargetKind | null {
  return value === "COMMENT" ? "COMMENT" : parseContentKind(value);
}

export interface ContentRef {
  kind: ContentKind;
  id: string;
  title: string;
  path: string;
}

/** A published item by id or slug, or null. Drafts are never engageable. */
export async function findPublishedContent(
  kind: ContentKind,
  idOrSlug: string,
): Promise<ContentRef | null> {
  const where = { status: "PUBLISHED" as const, OR: [{ id: idOrSlug }, { slug: idOrSlug }] };
  const select = { id: true, slug: true, title: true };

  const row =
    kind === "MESSAGE"
      ? await prisma.message.findFirst({ where, select })
      : kind === "RESOURCE"
        ? await prisma.book.findFirst({ where, select })
        : await prisma.quote.findFirst({ where, select });

  if (!row) return null;
  return { kind, id: row.id, title: row.title, path: contentPath(kind, row.slug) };
}

export function contentPath(kind: ContentKind, slug: string): string {
  return kind === "MESSAGE"
    ? `/messages/${slug}`
    : kind === "RESOURCE"
      ? `/resources/${slug}`
      : `/quotes/${slug}`;
}

/** Map a public page path to the content it shows, if any. */
export function contentFromPath(
  path: string,
): { kind: ContentKind; idOrSlug: string } | null {
  const match = /^\/(messages|resources|quotes)\/([^/?#]+)\/?$/.exec(path);
  if (!match) return null;
  const kind: ContentKind =
    match[1] === "messages" ? "MESSAGE" : match[1] === "resources" ? "RESOURCE" : "QUOTE";
  return { kind, idOrSlug: decodeURIComponent(match[2]) };
}

/** Titles and paths for many items at once — for admin tables. */
export async function lookupContent(
  refs: Array<{ kind: TargetKind | null; id: string | null }>,
): Promise<Map<string, { title: string; path: string; kind: ContentKind }>> {
  const ids = (kind: ContentKind) =>
    [...new Set(refs.filter((r) => r.kind === kind && r.id).map((r) => r.id as string))];

  const select = { id: true, slug: true, title: true };
  const [messages, resources, quotes] = await Promise.all([
    ids("MESSAGE").length ? prisma.message.findMany({ where: { id: { in: ids("MESSAGE") } }, select }) : [],
    ids("RESOURCE").length ? prisma.book.findMany({ where: { id: { in: ids("RESOURCE") } }, select }) : [],
    ids("QUOTE").length ? prisma.quote.findMany({ where: { id: { in: ids("QUOTE") } }, select }) : [],
  ]);

  const map = new Map<string, { title: string; path: string; kind: ContentKind }>();
  const add = (kind: ContentKind, rows: Array<{ id: string; slug: string; title: string }>) => {
    for (const row of rows) {
      map.set(`${kind}:${row.id}`, { kind, title: row.title, path: contentPath(kind, row.slug) });
    }
  };
  add("MESSAGE", messages);
  add("RESOURCE", resources);
  add("QUOTE", quotes);
  return map;
}

/* ── Request context ──────────────────────────────────────── */

export const VISITOR_COOKIE = "sv_vid";
const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|monitor/i;

export interface RequestContext {
  visitorId: string | null;
  country: string | null;
  device: "mobile" | "tablet" | "desktop";
  isBot: boolean;
}

export function deviceFromUserAgent(ua: string): RequestContext["device"] {
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "mobile";
  return "desktop";
}

export function isBotUserAgent(ua: string): boolean {
  return !ua || BOT_PATTERN.test(ua);
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function getRequestContext(request: Request): RequestContext {
  const ua = request.headers.get("user-agent") ?? "";
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null;

  return {
    visitorId: readCookie(request, VISITOR_COOKIE),
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    device: deviceFromUserAgent(ua),
    isBot: isBotUserAgent(ua),
  };
}

export function newVisitorId(): string {
  return randomUUID();
}

/** Cookie header value for a fresh visitor id — one year, first-party. */
export function visitorCookie(id: string): string {
  return `${VISITOR_COOKIE}=${id}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly; Secure`;
}

/* ── Recording ────────────────────────────────────────────── */

export interface EventInput {
  type: EngagementType;
  kind?: TargetKind | null;
  targetId?: string | null;
  path?: string | null;
  userId?: string | null;
  context: RequestContext;
}

/** Fire-and-forget: analytics must never break the thing being measured. */
export async function recordEvent(input: EventInput): Promise<void> {
  if (input.context.isBot) return;

  try {
    await prisma.engagementEvent.create({
      data: {
        type: input.type,
        targetKind: input.kind ?? null,
        targetId: input.targetId ?? null,
        path: input.path ? input.path.slice(0, 300) : null,
        userId: input.userId ?? null,
        visitorId: input.context.visitorId ?? `anon-${newVisitorId()}`,
        country: input.context.country,
        device: input.context.device,
      },
    });
  } catch (error) {
    console.error("[engagement] recordEvent failed", error);
  }
}
