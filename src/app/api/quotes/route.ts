import { NextRequest, NextResponse } from "next/server";
import { getQuotes } from "../../../lib/quotes";

export const dynamic = "force-dynamic";

/** Guard against NaN, Infinity, and negative values from user input. */
function parseLimit(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(Math.floor(n), 96);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const quotes = await getQuotes({
    search: searchParams.get("search") ?? undefined,
    featured: searchParams.get("featured") === "true" ? true : undefined,
    limit: parseLimit(searchParams.get("limit")),
  });

  // Return consistent envelope: { data, meta }
  return NextResponse.json({
    data: quotes,
    meta: { count: quotes.length },
  });
}
