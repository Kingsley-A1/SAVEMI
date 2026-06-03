import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../lib/db";
import { audit } from "../../../../lib/audit";
import { createUniqueQuoteSlug } from "../../../../lib/slugs";

function guardDb() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  return null;
}

// GET /api/admin/quotes — list all (all statuses)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = guardDb();
  if (guard) return guard;

  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotes);
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}

// POST /api/admin/quotes — create
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
    text,
    attribution,
    source,
    scriptureReference,
    imageKey,
    featured,
    status,
  } = body as Record<string, unknown>;

  if (!title || !text) {
    return NextResponse.json(
      { error: "title and text are required" },
      { status: 422 },
    );
  }

  const resolvedSlug = await createUniqueQuoteSlug(String(title));

  const resolvedStatus =
    status === "PUBLISHED"
      ? "PUBLISHED"
      : status === "ARCHIVED"
        ? "ARCHIVED"
        : "DRAFT";

  try {
    const quote = await prisma.quote.create({
      data: {
        title: String(title),
        slug: resolvedSlug,
        text: String(text),
        attribution: typeof attribution === "string" ? attribution || null : null,
        source: typeof source === "string" ? source || null : null,
        scriptureReference: typeof scriptureReference === "string" ? scriptureReference || null : null,
        imageKey: typeof imageKey === "string" ? imageKey || null : null,
        featured: featured === true,
        status: resolvedStatus,
        publishedAt: resolvedStatus === "PUBLISHED" ? new Date() : null,
      },
    });
    // Audit: record quote creation.
    await audit({
      session,
      request: req,
      action: "quote.create",
      entityType: "Quote",
      entityId: quote.id,
      detail: { title: quote.title, status: quote.status },
    });
    return NextResponse.json(quote, { status: 201 });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "A generated slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create quote" }, { status: 500 });
  }
}
