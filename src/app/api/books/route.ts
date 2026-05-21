import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import { buildPageMeta, parsePaginationParams } from "../../../lib/pagination";
import { resolveAssetUrl } from "../../../lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Book data is not available until the database is configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const { take, cursor } = parsePaginationParams({
    limit: searchParams.get("limit"),
    cursor: searchParams.get("cursor"),
  });

  const search = searchParams.get("search")?.trim() || undefined;
  const availability = searchParams.get("availability")?.toUpperCase() || undefined;
  const featuredParam = searchParams.get("featured");
  const featured = featuredParam === "true" ? true : undefined;

  const validAvailability = ["FREE", "PAID"];
  const availabilityFilter = availability && validAvailability.includes(availability)
    ? (availability as "FREE" | "PAID")
    : undefined;

  try {
    const raw = await prisma.book.findMany({
      where: {
        status: "PUBLISHED",
        ...(availabilityFilter && { availability: availabilityFilter }),
        ...(featured !== undefined && { featured }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { tagline: { contains: search, mode: "insensitive" } },
            { author: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
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
        tagline: true,
        author: true,
        coverImageKey: true,
        downloadUrl: true,
        purchaseUrl: true,
        priceLabel: true,
        format: true,
        pageCount: true,
        featured: true,
        availability: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    const { items, meta } = buildPageMeta(raw, take);

    const data = await Promise.all(
      items.map(async (b) => ({
        id: b.id,
        slug: b.slug,
        title: b.title,
        tagline: b.tagline,
        author: b.author,
        coverImageUrl: await resolveAssetUrl(b.coverImageKey),
        downloadUrl: b.downloadUrl,
        purchaseUrl: b.purchaseUrl,
        priceLabel: b.priceLabel,
        format: b.format,
        pageCount: b.pageCount,
        featured: b.featured,
        availability: b.availability.toLowerCase(),
        publishedAt: b.publishedAt?.toISOString() ?? null,
      }))
    );

    return NextResponse.json({ data, meta });
  } catch {
    return NextResponse.json({ data: [], meta: { count: 0, hasNextPage: false, nextCursor: null } });
  }
}
