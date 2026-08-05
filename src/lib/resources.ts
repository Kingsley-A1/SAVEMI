import type { Prisma } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "./db";
import { resolveAssetUrl } from "./r2";

export type ResourceAvailability = "free" | "paid";
export type ResourceStatus = "draft" | "published" | "archived";
export type ResourceType = "book" | "devotional" | "pulpit" | "article";

/** Display order and labels for the four Resources sections. */
export const RESOURCE_TYPE_ORDER: readonly ResourceType[] = [
  "book",
  "devotional",
  "pulpit",
  "article",
];

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  book: "Books",
  devotional: "Devotionals",
  pulpit: "Pastor's Pulpit",
  article: "Articles",
};

export const RESOURCE_TYPE_SINGULAR: Record<ResourceType, string> = {
  book: "Book",
  devotional: "Devotional",
  pulpit: "Pulpit Message",
  article: "Article",
};

export function isResourceType(value: string): value is ResourceType {
  return (RESOURCE_TYPE_ORDER as readonly string[]).includes(value);
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  coverImageUrl: string | null;
  /**
   * Where the "Download" button points. An uploaded file streams through the
   * site's own download endpoint under the resource title; otherwise this is
   * the external link the admin supplied.
   */
  downloadUrl: string | null;
  /** True when the file is served by SAVEMI rather than a third-party link. */
  hostedDownload: boolean;
  purchaseUrl: string | null;
  priceLabel: string | null;
  format: string | null;
  pageCount: number | null;
  featured: boolean;
  availability: ResourceAvailability;
  resourceType: ResourceType;
  status: ResourceStatus;
  publishedAt: string | null;
}

export interface GetResourcesOptions {
  limit?: number;
  search?: string;
  availability?: ResourceAvailability;
  resourceType?: ResourceType;
  featured?: boolean;
}

const resourceSelect = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  description: true,
  author: true,
  coverImageKey: true,
  downloadKey: true,
  downloadFileName: true,
  downloadUrl: true,
  purchaseUrl: true,
  priceLabel: true,
  format: true,
  pageCount: true,
  featured: true,
  availability: true,
  resourceType: true,
  status: true,
  publishedAt: true,
} as const;

type ResourceRecord = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  coverImageKey: string | null;
  downloadKey: string | null;
  downloadFileName: string | null;
  downloadUrl: string | null;
  purchaseUrl: string | null;
  priceLabel: string | null;
  format: string | null;
  pageCount: number | null;
  featured: boolean;
  availability: "FREE" | "PAID";
  resourceType: "BOOK" | "DEVOTIONAL" | "PULPIT" | "ARTICLE";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: Date | null;
};

async function mapResource(record: ResourceRecord): Promise<Resource> {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    tagline: record.tagline,
    description: record.description,
    author: record.author,
    coverImageUrl: await resolveAssetUrl(record.coverImageKey),
    // An uploaded file always wins: it downloads in one click, under the
    // resource's own title, without leaving the site.
    downloadUrl: record.downloadKey
      ? `/api/download/resources/${record.slug}`
      : record.downloadUrl,
    hostedDownload: Boolean(record.downloadKey),
    purchaseUrl: record.purchaseUrl,
    priceLabel: record.priceLabel,
    format: record.format,
    pageCount: record.pageCount,
    featured: record.featured,
    availability: record.availability.toLowerCase() as ResourceAvailability,
    resourceType: record.resourceType.toLowerCase() as ResourceType,
    status: record.status.toLowerCase() as ResourceStatus,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
  };
}

function buildWhereClause(
  options: GetResourcesOptions,
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

  if (options.resourceType) {
    where.resourceType = options.resourceType.toUpperCase() as
      | "BOOK"
      | "DEVOTIONAL"
      | "PULPIT"
      | "ARTICLE";
  }

  if (options.featured === true) {
    where.featured = true;
  }

  return where;
}

export async function getResources(
  options: GetResourcesOptions = {},
): Promise<Resource[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const records = await prisma.book.findMany({
      where: buildWhereClause(options),
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: options.limit ?? 48,
      select: resourceSelect,
    });

    return Promise.all(records.map((record) => mapResource(record as ResourceRecord)));
  } catch {
    return [];
  }
}

export async function getResourceBySlug(slug: string): Promise<Resource | undefined> {
  if (!isDatabaseConfigured()) {
    return undefined;
  }

  try {
    const record = await prisma.book.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: resourceSelect,
    });

    if (!record) {
      return undefined;
    }

    return mapResource(record as ResourceRecord);
  } catch {
    return undefined;
  }
}

export async function getFeaturedResources(limit = 4): Promise<Resource[]> {
  return getResources({ featured: true, limit });
}

/**
 * One published resource per type, in section order — used to render the
 * Resources hub without a separate query per section.
 */
export async function getResourcesByType(
  limitPerType = 6,
): Promise<Record<ResourceType, Resource[]>> {
  const results = await Promise.all(
    RESOURCE_TYPE_ORDER.map((resourceType) =>
      getResources({ resourceType, limit: limitPerType }),
    ),
  );

  return RESOURCE_TYPE_ORDER.reduce(
    (acc, resourceType, index) => {
      acc[resourceType] = results[index];
      return acc;
    },
    {} as Record<ResourceType, Resource[]>,
  );
}
