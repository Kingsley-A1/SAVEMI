import { prisma, isDatabaseConfigured } from "../../../../../../lib/db";
import { notFound } from "next/navigation";
import EditQuoteForm from "./EditQuoteForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditQuotePage({ params }: Props) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="site-panel p-6 text-center text-sm text-brand-muted">
        Database not configured.
      </div>
    );
  }

  let quote;
  try {
    quote = await prisma.quote.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        text: true,
        attribution: true,
        source: true,
        scriptureReference: true,
        imageKey: true,
        featured: true,
        status: true,
      },
    });
  } catch {
    notFound();
  }

  if (!quote) notFound();

  return <EditQuoteForm quote={quote} />;
}
