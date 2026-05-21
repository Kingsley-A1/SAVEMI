import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "../../../lib/db";
import { buildPageMeta, parsePaginationParams } from "../../../lib/pagination";
import { resolveAssetUrl } from "../../../lib/r2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Message data is not available until the database is configured." },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const { take, cursor } = parsePaginationParams({
    limit: searchParams.get("limit"),
    cursor: searchParams.get("cursor"),
  });

  // Filter params
  const search = searchParams.get("search")?.trim() || undefined;
  const type = searchParams.get("type")?.toUpperCase() || undefined;
  const category = searchParams.get("category")?.trim() || undefined;
  const speaker = searchParams.get("speaker")?.trim() || undefined;

  const validTypes = ["VIDEO", "AUDIO", "IMAGE"];
  const typeFilter = type && validTypes.includes(type)
    ? (type as "VIDEO" | "AUDIO" | "IMAGE")
    : undefined;

  try {
    const raw = await prisma.message.findMany({
      where: {
        status: "PUBLISHED",
        placement: "STANDARD",
        ...(typeFilter && { type: typeFilter }),
        ...(speaker && { speaker: { contains: speaker, mode: "insensitive" } }),
        ...(category && { category: { slug: category } }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { summary: { contains: search, mode: "insensitive" } },
            { speaker: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor.id } } : {}),
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        type: true,
        speaker: true,
        coverImageKey: true,
        mediaKey: true,
        eventDate: true,
        publishedAt: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });

    const { items, meta } = buildPageMeta(raw, take);

    const data = await Promise.all(
      items.map(async (m) => ({
        id: m.id,
        slug: m.slug,
        title: m.title,
        summary: m.summary,
        type: m.type.toLowerCase(),
        speaker: m.speaker,
        category: m.category?.name ?? null,
        coverImageUrl: await resolveAssetUrl(m.coverImageKey),
        downloadUrl: await resolveAssetUrl(m.mediaKey),
        date: new Intl.DateTimeFormat("en-US", {
          month: "long", day: "numeric", year: "numeric",
        }).format(m.eventDate ?? m.publishedAt ?? m.createdAt),
      }))
    );

    return NextResponse.json({ data, meta });
  } catch {
    return NextResponse.json({ data: [], meta: { count: 0, hasNextPage: false, nextCursor: null } });
  }
}
