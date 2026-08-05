import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../lib/db";
import { audit } from "../../../../lib/audit";
import { createUniqueResourceSlug } from "../../../../lib/slugs";
import { isResourceType } from "../../../../lib/resources";

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  return null;
}

// GET /api/admin/resources — list all (all statuses)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  try {
    const resources = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(resources);
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}

// POST /api/admin/resources — create
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
    tagline,
    description,
    author,
    coverImageKey,
    downloadKey,
    downloadFileName,
    downloadUrl,
    purchaseUrl,
    priceLabel,
    format,
    pageCount,
    featured,
    availability,
    resourceType,
    status,
  } = body as Record<string, unknown>;

  if (!title || !tagline || !description || !author) {
    return NextResponse.json(
      { error: "title, tagline, description, and author are required" },
      { status: 422 },
    );
  }

  const resolvedSlug = await createUniqueResourceSlug(String(title));

  const resolvedAvailability =
    availability === "PAID" ? "PAID" : "FREE";

  const resolvedResourceType =
    typeof resourceType === "string" && isResourceType(resourceType.toLowerCase())
      ? (resourceType.toUpperCase() as "BOOK" | "DEVOTIONAL" | "PULPIT" | "ARTICLE")
      : "BOOK";

  const resolvedStatus =
    status === "PUBLISHED"
      ? "PUBLISHED"
      : status === "ARCHIVED"
        ? "ARCHIVED"
        : "DRAFT";

  try {
    const resource = await prisma.book.create({
      data: {
        title: String(title),
        slug: resolvedSlug,
        tagline: String(tagline),
        description: String(description),
        author: String(author),
        coverImageKey: typeof coverImageKey === "string" ? coverImageKey || null : null,
        downloadKey: typeof downloadKey === "string" ? downloadKey || null : null,
        downloadFileName:
          typeof downloadFileName === "string" ? downloadFileName || null : null,
        downloadUrl: typeof downloadUrl === "string" ? downloadUrl || null : null,
        purchaseUrl: typeof purchaseUrl === "string" ? purchaseUrl || null : null,
        priceLabel: typeof priceLabel === "string" ? priceLabel || null : null,
        format: typeof format === "string" ? format || null : null,
        pageCount: pageCount ? Number(pageCount) : null,
        featured: featured === true,
        availability: resolvedAvailability,
        resourceType: resolvedResourceType,
        status: resolvedStatus,
        publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
      },
    });
    // Audit: record resource creation.
    await audit({
      session,
      request: req,
      action: "book.create",
      entityType: "Book",
      entityId: resource.id,
      detail: { title: resource.title, status: resource.status, availability: resource.availability },
    });
    return NextResponse.json(resource, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "A generated slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
