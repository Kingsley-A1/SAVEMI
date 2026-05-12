import type { Prisma } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "./db";
import { resolveAssetUrl } from "./r2";

export type BookAvailability = "free" | "paid";
export type BookStatus = "draft" | "published" | "archived";

export interface Book {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  coverImageUrl: string | null;
  downloadUrl: string | null;
  purchaseUrl: string | null;
  priceLabel: string | null;
  format: string | null;
  pageCount: number | null;
  featured: boolean;
  availability: BookAvailability;
  status: BookStatus;
  publishedAt: string | null;
}

export interface GetBooksOptions {
  limit?: number;
  search?: string;
  availability?: BookAvailability;
  featured?: boolean;
}

const bookSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  description: true,
  author: true,
  coverImageKey: true,
  downloadUrl: true,
  purchaseUrl: true,
  priceLabel: true,
  format: true,
  pageCount: true,
  featured: true,
  availability: true,
  status: true,
  publishedAt: true,
} as const;

type BookRecord = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  coverImageKey: string | null;
  downloadUrl: string | null;
  purchaseUrl: string | null;
  priceLabel: string | null;
  format: string | null;
  pageCount: number | null;
  featured: boolean;
  availability: "FREE" | "PAID";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
};

async function mapBook(record: BookRecord): Promise<Book> {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    tagline: record.tagline,
    description: record.description,
    author: record.author,
    coverImageUrl: await resolveAssetUrl(record.coverImageKey),
    downloadUrl: record.downloadUrl,
    purchaseUrl: record.purchaseUrl,
    priceLabel: record.priceLabel,
    format: record.format,
    pageCount: record.pageCount,
    featured: record.featured,
    availability: record.availability.toLowerCase() as BookAvailability,
    status: record.status.toLowerCase() as BookStatus,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
  };
}

function buildWhereClause(
  options: GetBooksOptions,
): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {
    status: "PUBLISHED",
  };

  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { tagline: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
      { author: { contains: options.search, mode: "insensitive" } },
    ];
  }

  if (options.availability) {
    where.availability = options.availability.toUpperCase() as "FREE" | "PAID";
  }

  if (options.featured === true) {
    where.featured = true;
  }

  return where;
}

export async function getBooks(options: GetBooksOptions = {}): Promise<Book[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const records = await prisma.book.findMany({
      where: buildWhereClause(options),
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: options.limit ?? 48,
      select: bookSelect,
    });

    return Promise.all(records.map((record) => mapBook(record as BookRecord)));
  } catch {
    return [];
  }
}

export async function getBookBySlug(slug: string): Promise<Book | undefined> {
  if (!isDatabaseConfigured()) {
    return undefined;
  }

  try {
    const record = await prisma.book.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: bookSelect,
    });

    if (!record) {
      return undefined;
    }

    return mapBook(record as BookRecord);
  } catch {
    return undefined;
  }
}

export async function getFeaturedBooks(limit = 4): Promise<Book[]> {
  return getBooks({ featured: true, limit });
}
