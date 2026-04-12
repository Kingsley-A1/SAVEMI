import { prisma, isDatabaseConfigured } from "../../../../../lib/db";
import { notFound } from "next/navigation";
import EditMessageForm from "./EditMessageForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMessagePage({ params }: Props) {
  const { id } = await params;

  if (!isDatabaseConfigured()) {
    return (
      <div className="site-panel p-6 text-center text-sm text-brand-muted">
        Database not configured.
      </div>
    );
  }

  let message;
  try {
    message = await prisma.message.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        description: true,
        type: true,
        placement: true,
        status: true,
        speaker: true,
        scriptureReference: true,
        eventDate: true,
        durationSeconds: true,
        mediaKey: true,
        coverImageKey: true,
      },
    });
  } catch {
    notFound();
  }
  if (!message) notFound();

  return <EditMessageForm message={message} />;
}
