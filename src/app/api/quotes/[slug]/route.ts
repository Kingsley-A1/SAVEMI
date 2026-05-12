import { NextRequest, NextResponse } from "next/server";
import { getQuoteBySlug } from "../../../../lib/quotes";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { slug } = await params;
  const quote = await getQuoteBySlug(slug);

  if (!quote) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
}
