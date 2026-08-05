import { prisma, isDatabaseConfigured } from "../../../../../../lib/db";
import { notFound } from "next/navigation";
import EditResourceForm from "./EditResourceForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditResourcePage({ params }: Props) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="site-panel p-6 text-center text-sm text-brand-muted">
        Database not configured.
      </div>
    );
  }

  let resource;
  try {
    resource = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
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
      },
    });
  } catch {
    notFound();
  }

  if (!resource) notFound();

  return <EditResourceForm resource={resource} />;
}
