import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../lib/db";

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  return null;
}

function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// GET /api/admin/books — list all (all statuses)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  try {
    const books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(books);
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}

// POST /api/admin/books — create
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    slug,
    tagline,
    description,
    author,
    coverImageKey,
    downloadUrl,
    purchaseUrl,
    priceLabel,
    format,
    pageCount,
    featured,
    availability,
    status,
  } = body as Record<string, unknown>;

  if (!title || !tagline || !description || !author) {
    return NextResponse.json(
      { error: "title, tagline, description, and author are required" },
      { status: 422 },
    );
  }

  const resolvedSlug =
    typeof slug === "string" && slug.trim()
      ? slug.trim()
      : slugify(String(title));

  const resolvedAvailability =
    availability === "PAID" ? "PAID" : "FREE";

  const resolvedStatus =
    status === "PUBLISHED"
      ? "PUBLISHED"
      : status === "ARCHIVED"
        ? "ARCHIVED"
        : "DRAFT";

  try {
    const book = await prisma.book.create({
      data: {
        title: String(title),
        slug: resolvedSlug,
        tagline: String(tagline),
        description: String(description),
        author: String(author),
        coverImageKey: typeof coverImageKey === "string" ? coverImageKey || null : null,
        downloadUrl: typeof downloadUrl === "string" ? downloadUrl || null : null,
        purchaseUrl: typeof purchaseUrl === "string" ? purchaseUrl || null : null,
        priceLabel: typeof priceLabel === "string" ? priceLabel || null : null,
        format: typeof format === "string" ? format || null : null,
        pageCount: pageCount ? Number(pageCount) : null,
        featured: featured === true,
        availability: resolvedAvailability,
        status: resolvedStatus,
        publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
      },
    });
    return NextResponse.json(book, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
