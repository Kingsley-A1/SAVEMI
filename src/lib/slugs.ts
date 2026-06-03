import { prisma } from "./db";

export function slugifyTitle(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/g, "");

  return slug || "untitled";
}

async function resolveUniqueSlug({
  baseSlug,
  exists,
}: {
  baseSlug: string;
  exists: (slug: string) => Promise<boolean>;
}): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;

  while (await exists(candidate)) {
    const suffixText = `-${suffix}`;
    candidate = `${baseSlug.slice(0, 80 - suffixText.length)}${suffixText}`;
    suffix += 1;
  }

  return candidate;
}

export function slugBelongsToRecord(
  record: { id: string } | null,
  currentId?: string,
): boolean {
  return Boolean(record && record.id === currentId);
}

export async function createUniqueMessageSlug(
  title: string,
  currentId?: string,
): Promise<string> {
  const baseSlug = slugifyTitle(title);

  return resolveUniqueSlug({
    baseSlug,
    exists: async (slug) => {
      const record = await prisma.message.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(record && !slugBelongsToRecord(record, currentId));
    },
  });
}

export async function createUniqueBookSlug(
  title: string,
  currentId?: string,
): Promise<string> {
  const baseSlug = slugifyTitle(title);

  return resolveUniqueSlug({
    baseSlug,
    exists: async (slug) => {
      const record = await prisma.book.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(record && !slugBelongsToRecord(record, currentId));
    },
  });
}

export async function createUniqueQuoteSlug(
  title: string,
  currentId?: string,
): Promise<string> {
  const baseSlug = slugifyTitle(title);

  return resolveUniqueSlug({
    baseSlug,
    exists: async (slug) => {
      const record = await prisma.quote.findUnique({
        where: { slug },
        select: { id: true },
      });

      return Boolean(record && !slugBelongsToRecord(record, currentId));
    },
  });
}
