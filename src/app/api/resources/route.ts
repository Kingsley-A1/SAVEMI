import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import { buildPageMeta, parsePaginationParams } from "../../../lib/pagination";
import { resolveAssetUrl } from "../../../lib/r2";
import { isResourceType } from "../../../lib/resources";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Resource data is not available until the database is configured." },
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
  const typeParam = searchParams.get("type")?.trim().toLowerCase();
  const featuredParam = searchParams.get("featured");
  const featured = featuredParam === "true" ? true : undefined;

  const validAvailability = ["FREE", "PAID"];
  const availabilityFilter = availability && validAvailability.includes(availability)
    ? (availability as "FREE" | "PAID")
    : undefined;
  const resourceTypeFilter =
    typeParam && isResourceType(typeParam)
      ? (typeParam.toUpperCase() as "BOOK" | "DEVOTIONAL" | "PULPIT" | "ARTICLE")
      : undefined;

  try {
    const raw = await prisma.book.findMany({
      where: {
        status: "PUBLISHED",
        ...(availabilityFilter && { availability: availabilityFilter }),
        ...(resourceTypeFilter && { resourceType: resourceTypeFilter }),
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
        downloadKey: true,
        downloadUrl: true,
        purchaseUrl: true,
        priceLabel: true,
        format: true,
        pageCount: true,
        featured: true,
        availability: true,
        resourceType: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    const { items, meta } = buildPageMeta(raw, take);

    const data = await Promise.all(
      items.map(async (r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        tagline: r.tagline,
        author: r.author,
        coverImageUrl: await resolveAssetUrl(r.coverImageKey),
        // An uploaded file downloads through this site under the resource title.
        downloadUrl: r.downloadKey
          ? `/api/download/resources/${r.slug}`
          : r.downloadUrl,
        hostedDownload: Boolean(r.downloadKey),
        purchaseUrl: r.purchaseUrl,
        priceLabel: r.priceLabel,
        format: r.format,
        pageCount: r.pageCount,
        featured: r.featured,
        availability: r.availability.toLowerCase(),
        resourceType: r.resourceType.toLowerCase(),
        publishedAt: r.publishedAt?.toISOString() ?? null,
      }))
    );

    return NextResponse.json({ data, meta });
  } catch {
    return NextResponse.json({ data: [], meta: { count: 0, hasNextPage: false, nextCursor: null } });
  }
}
