import { prisma, isDatabaseConfigured } from "../../../../../lib/db";
import { notFound } from "next/navigation";
import EditBookForm from "./EditBookForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditBookPage({ params }: Props) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="site-panel p-6 text-center text-sm text-brand-muted">
        Database not configured.
      </div>
    );
  }

  let book;
  try {
    book = await prisma.book.findUnique({
      where: { id },
      select: {
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
      },
    });
  } catch {
    notFound();
  }

  if (!book) notFound();

  return <EditBookForm book={book} />;
}
