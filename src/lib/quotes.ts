import type { Prisma } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "./db";
import { resolveAssetUrl } from "./r2";

export type QuoteStatus = "draft" | "published" | "archived";

export interface Quote {
  id: string;
  slug: string;
  title: string;
  text: string;
  attribution: string | null;
  source: string | null;
  scriptureReference: string | null;
  imageUrl: string | null;
  featured: boolean;
  status: QuoteStatus;
  publishedAt: string | null;
}

export interface GetQuotesOptions {
  limit?: number;
  search?: string;
  featured?: boolean;
}

const quoteSelect = {
  id: true,
  slug: true,
  title: true,
  text: true,
  attribution: true,
  source: true,
  scriptureReference: true,
  imageKey: true,
  featured: true,
  status: true,
  publishedAt: true,
} as const;

type QuoteRecord = {
  id: string;
  slug: string;
  title: string;
  text: string;
  attribution: string | null;
  source: string | null;
  scriptureReference: string | null;
  imageKey: string | null;
  featured: boolean;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
};

async function mapQuote(record: QuoteRecord): Promise<Quote> {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    text: record.text,
    attribution: record.attribution,
    source: record.source,
    scriptureReference: record.scriptureReference,
    imageUrl: await resolveAssetUrl(record.imageKey),
    featured: record.featured,
    status: record.status.toLowerCase() as QuoteStatus,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
  };
}

function buildWhereClause(
  options: GetQuotesOptions,
): Prisma.QuoteWhereInput {
  const where: Prisma.QuoteWhereInput = {
    status: "PUBLISHED",
  };

  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { text: { contains: options.search, mode: "insensitive" } },
      { attribution: { contains: options.search, mode: "insensitive" } },
      { scriptureReference: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options.featured === true) {
    where.featured = true;
  }

  return where;
}

export async function getQuotes(
  options: GetQuotesOptions = {},
): Promise<Quote[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const records = await prisma.quote.findMany({
      where: buildWhereClause(options),
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: options.limit ?? 48,
      select: quoteSelect,
    });

    return Promise.all(records.map((record) => mapQuote(record as QuoteRecord)));
  } catch {
    return [];
  }
}

export async function getQuoteBySlug(slug: string): Promise<Quote | undefined> {
  if (!isDatabaseConfigured()) {
    return undefined;
  }

  try {
    const record = await prisma.quote.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: quoteSelect,
    });

    if (!record) {
      return undefined;
    }

    return mapQuote(record as QuoteRecord);
  } catch {
    return undefined;
  }
}

export async function getFeaturedQuotes(limit = 3): Promise<Quote[]> {
  return getQuotes({ featured: true, limit });
}
