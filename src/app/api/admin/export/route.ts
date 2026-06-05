import { type NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma, isDatabaseConfigured } from "../../../../lib/db";

/** Escape a CSV field — wrap in quotes if it contains commas, quotes, or newlines. */
function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(fields: (string | number | boolean | null | undefined)[]): string {
  return fields.map(csvField).join(",");
}

async function exportMessages(): Promise<string> {
  const rows = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      status: true,
      speaker: true,
      scriptureReference: true,
      summary: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  const header = "id,title,slug,type,status,speaker,scriptureReference,summary,createdAt,publishedAt";
  const lines = rows.map((r) =>
    rowToCsv([
      r.id, r.title, r.slug, r.type, r.status,
      r.speaker, r.scriptureReference, r.summary,
      r.createdAt.toISOString(), r.publishedAt?.toISOString() ?? "",
    ])
  );
  return [header, ...lines].join("\n");
}

async function exportBooks(): Promise<string> {
  const rows = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, author: true,
      availability: true, status: true, featured: true,
      priceLabel: true, format: true, pageCount: true,
      downloadUrl: true, purchaseUrl: true,
      createdAt: true, publishedAt: true,
    },
  });

  const header = "id,title,slug,author,availability,status,featured,priceLabel,format,pageCount,downloadUrl,purchaseUrl,createdAt,publishedAt";
  const lines = rows.map((r) =>
    rowToCsv([
      r.id, r.title, r.slug, r.author, r.availability,
      r.status, r.featured, r.priceLabel, r.format,
      r.pageCount, r.downloadUrl, r.purchaseUrl,
      r.createdAt.toISOString(), r.publishedAt?.toISOString() ?? "",
    ])
  );
  return [header, ...lines].join("\n");
}

async function exportQuotes(): Promise<string> {
  const rows = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, slug: true, text: true,
      attribution: true, source: true, scriptureReference: true,
      featured: true, status: true, createdAt: true, publishedAt: true,
    },
  });

  const header = "id,title,slug,text,attribution,source,scriptureReference,featured,status,createdAt,publishedAt";
  const lines = rows.map((r) =>
    rowToCsv([
      r.id, r.title, r.slug, r.text, r.attribution,
      r.source, r.scriptureReference, r.featured, r.status,
      r.createdAt.toISOString(), r.publishedAt?.toISOString() ?? "",
    ])
  );
  return [header, ...lines].join("\n");
}

/**
 * GET /api/admin/export?type=messages|books|quotes
 *
 * Returns a UTF-8 CSV file. Requires an active admin session.
 * Streaming is not used — for the expected data sizes this is fine.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "";
  const validTypes = ["messages", "books", "quotes"];

  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Use one of: messages, books, quotes." },
      { status: 400 },
    );
  }

  try {
    let csv = "";
    if (type === "messages") csv = await exportMessages();
    else if (type === "books") csv = await exportBooks();
    else csv = await exportQuotes();

    const filename = `savemi-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
