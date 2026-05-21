import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../../lib/db";
import { audit } from "../../../../../lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  return null;
}

// PATCH /api/admin/quotes/:id — update
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
    text,
    attribution,
    source,
    scriptureReference,
    imageKey,
    featured,
    status,
  } = body as Record<string, unknown>;

  // Derive publishedAt only when transitioning to PUBLISHED
  let publishedAt: Date | null | undefined = undefined;
  if (status === "PUBLISHED") {
    const existing = await prisma.quote.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
    if (existing && existing.status !== "PUBLISHED") {
      publishedAt = new Date();
    }
  }

  try {
    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title) }),
        ...(slug !== undefined && { slug: String(slug) }),
        ...(text !== undefined && { text: String(text) }),
        ...(attribution !== undefined && { attribution: typeof attribution === "string" ? attribution || null : null }),
        ...(source !== undefined && { source: typeof source === "string" ? source || null : null }),
        ...(scriptureReference !== undefined && { scriptureReference: typeof scriptureReference === "string" ? scriptureReference || null : null }),
        ...(imageKey !== undefined && { imageKey: typeof imageKey === "string" ? imageKey || null : null }),
        ...(featured !== undefined && { featured: featured === true }),
        ...(status !== undefined && { status: status === "PUBLISHED" ? "PUBLISHED" : status === "ARCHIVED" ? "ARCHIVED" : "DRAFT" }),
        ...(publishedAt !== undefined && { publishedAt }),
      },
    });
    // Audit: record quote update.
    await audit({
      session,
      request: req,
      action: "quote.update",
      entityType: "Quote",
      entityId: updated.id,
      detail: { title: updated.title, status: updated.status },
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
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}

// DELETE /api/admin/quotes/:id
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  const { id } = await params;

  try {
    const deleted = await prisma.quote.findUnique({ where: { id }, select: { id: true, title: true } });
    await prisma.quote.delete({ where: { id } });

    // Audit: record quote deletion.
    await audit({
      session,
      request: _req,
      action: "quote.delete",
      entityType: "Quote",
      entityId: id,
      detail: { title: deleted?.title },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete quote" }, { status: 500 });
  }
}
