/**
 * Cursor-based pagination utilities.
 *
 * Cursors are opaque Base64-encoded JSON objects containing the last
 * seen record's { id, createdAt } values.  This gives stable ordering
 * even when rows are inserted between page requests.
 *
 * Usage in a lib query:
 *   const { cursor, take } = parsePaginationParams({ cursor: req.cursor, limit: req.limit });
 *   const records = await prisma.book.findMany({
 *     take: take + 1,        // fetch one extra to detect hasNextPage
 *     ...(cursor ? { skip: 1, cursor: { id: cursor.id } } : {}),
 *     orderBy: [{ createdAt: "desc" }, { id: "desc" }],
 *   });
 *   return buildPage(records, take);
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 96;

export interface CursorPayload {
  id: string;
  createdAt: string; // ISO string
}

export interface PageMeta {
  count: number;
  hasNextPage: boolean;
  nextCursor: string | null;
}

/** Encode a cursor payload to a URL-safe Base64 string. */
export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/** Decode a cursor string. Returns null if invalid. */
export function decodeCursor(raw: string | null | undefined): CursorPayload | null {
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "createdAt" in parsed &&
      typeof (parsed as Record<string, unknown>).id === "string" &&
      typeof (parsed as Record<string, unknown>).createdAt === "string"
    ) {
      return parsed as CursorPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse pagination params from API query strings.
 * Returns a safe `take` value and a decoded cursor (or null).
 */
export function parsePaginationParams(params: {
  limit?: string | null;
  cursor?: string | null;
}): { take: number; cursor: CursorPayload | null } {
  let take = DEFAULT_PAGE_SIZE;
  if (params.limit) {
    const n = Number(params.limit);
    if (Number.isFinite(n) && n > 0) {
      take = Math.min(Math.floor(n), MAX_PAGE_SIZE);
    }
  }
  return { take, cursor: decodeCursor(params.cursor) };
}

/**
 * Given an array of records fetched with (take + 1), trim the extra record
 * and build the page meta.
 */
export function buildPageMeta<T extends { id: string; createdAt: Date }>(
  records: T[],
  take: number,
): { items: T[]; meta: PageMeta } {
  const hasNextPage = records.length > take;
  const items = hasNextPage ? records.slice(0, take) : records;
  const last = items[items.length - 1];

  return {
    items,
    meta: {
      count: items.length,
      hasNextPage,
      nextCursor: hasNextPage && last
        ? encodeCursor({ id: last.id, createdAt: last.createdAt.toISOString() })
        : null,
    },
  };
}
