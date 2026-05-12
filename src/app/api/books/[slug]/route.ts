import { NextRequest, NextResponse } from "next/server";
import { getBookBySlug } from "../../../../lib/books";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(book);
}
