import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import { buildPageMeta, parsePaginationParams } from "../../../lib/pagination";
import { resolveAssetUrl } from "../../../lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Quote data is not available until the database is configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const { take, cursor } = parsePaginationParams({
    limit: searchParams.get("limit"),
    cursor: searchParams.get("cursor"),
  });

  const search = searchParams.get("search")?.trim() || undefined;
  const featuredParam = searchParams.get("featured");
  const featured = featuredParam === "true" ? true : undefined;

  try {
    const raw = await prisma.quote.findMany({
      where: {
        status: "PUBLISHED",
        ...(featured !== undefined && { featured }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { text: { contains: search, mode: "insensitive" } },
            { attribution: { contains: search, mode: "insensitive" } },
            { scriptureReference: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor.id } } : {}),
      select: {
        id: true,
        slug: true,
        title: true,
        text: true,
        attribution: true,
        source: true,
        scriptureReference: true,
        imageKey: true,
        featured: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    const { items, meta } = buildPageMeta(raw, take);

    const data = await Promise.all(
      items.map(async (q) => ({
        id: q.id,
        slug: q.slug,
        title: q.title,
        text: q.text,
        attribution: q.attribution,
        source: q.source,
        scriptureReference: q.scriptureReference,
        imageUrl: await resolveAssetUrl(q.imageKey),
        featured: q.featured,
        publishedAt: q.publishedAt?.toISOString() ?? null,
      }))
    );

    return NextResponse.json({ data, meta });
  } catch {
    return NextResponse.json({ data: [], meta: { count: 0, hasNextPage: false, nextCursor: null } });
  }
}
