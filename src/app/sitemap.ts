import type { MetadataRoute } from "next";

const BASE_URL = "https://savemi.org";

/**
 * Dynamic sitemap generated at build time.
 * Static routes are always included. Content routes (messages, books, quotes)
 * are fetched from the database when available, and skipped gracefully if not.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/messages`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/books`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/quotes`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Dynamic content routes — fetched at build time if the database is configured.
  // These are wrapped in try/catch so a failed DB connection does not break the build.
  const dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    const { isDatabaseConfigured, prisma } = await import("../lib/db");

    if (isDatabaseConfigured()) {
      const [messages, books, quotes] = await Promise.all([
        prisma.message.findMany({
          where: { status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
          orderBy: { publishedAt: "desc" },
        }),
        prisma.book.findMany({
          where: { status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
          orderBy: { publishedAt: "desc" },
        }),
        prisma.quote.findMany({
          where: { status: "PUBLISHED" },
          select: { slug: true, updatedAt: true },
          orderBy: { publishedAt: "desc" },
        }),
      ]);

      for (const m of messages) {
        dynamicRoutes.push({
          url: `${BASE_URL}/messages/${m.slug}`,
          lastModified: m.updatedAt,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }

      for (const b of books) {
        dynamicRoutes.push({
          url: `${BASE_URL}/books/${b.slug}`,
          lastModified: b.updatedAt,
          changeFrequency: "monthly",
          priority: 0.7,
        });
      }

      for (const q of quotes) {
        dynamicRoutes.push({
          url: `${BASE_URL}/quotes/${q.slug}`,
          lastModified: q.updatedAt,
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  } catch {
    // DB unavailable at build time — only static routes are included.
    console.warn("[sitemap] Database query failed — skipping dynamic content routes.");
  }

  return [...staticRoutes, ...dynamicRoutes];
}
