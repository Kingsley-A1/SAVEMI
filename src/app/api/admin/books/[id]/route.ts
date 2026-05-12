import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../../lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  return null;
}

// PATCH /api/admin/books/:id — update
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

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

  // Derive publishedAt only when transitioning to PUBLISHED
  let publishedAt: Date | null | undefined = undefined;
  if (status === "PUBLISHED") {
    const existing = await prisma.book.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
    if (existing && existing.status !== "PUBLISHED") {
      publishedAt = new Date();
    }
  }

  try {
    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title) }),
        ...(slug !== undefined && { slug: String(slug) }),
        ...(tagline !== undefined && { tagline: String(tagline) }),
        ...(description !== undefined && { description: String(description) }),
        ...(author !== undefined && { author: String(author) }),
        ...(coverImageKey !== undefined && { coverImageKey: typeof coverImageKey === "string" ? coverImageKey || null : null }),
        ...(downloadUrl !== undefined && { downloadUrl: typeof downloadUrl === "string" ? downloadUrl || null : null }),
        ...(purchaseUrl !== undefined && { purchaseUrl: typeof purchaseUrl === "string" ? purchaseUrl || null : null }),
        ...(priceLabel !== undefined && { priceLabel: typeof priceLabel === "string" ? priceLabel || null : null }),
        ...(format !== undefined && { format: typeof format === "string" ? format || null : null }),
        ...(pageCount !== undefined && { pageCount: pageCount ? Number(pageCount) : null }),
        ...(featured !== undefined && { featured: featured === true }),
        ...(availability !== undefined && { availability: availability === "PAID" ? "PAID" : "FREE" }),
        ...(status !== undefined && { status: status === "PUBLISHED" ? "PUBLISHED" : status === "ARCHIVED" ? "ARCHIVED" : "DRAFT" }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (code === "P2002") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
  }
}

// DELETE /api/admin/books/:id
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  try {
    await prisma.book.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
