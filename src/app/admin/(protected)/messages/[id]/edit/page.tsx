import { prisma, isDatabaseConfigured } from "../../../../../../lib/db";
import { notFound } from "next/navigation";
import EditMessageForm from "./EditMessageForm";
import { resolveAssetUrl } from "../../../../../../lib/r2";

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
        summary: true,
        description: true,
        type: true,
        status: true,
        speaker: true,
        scriptureReference: true,
        eventDate: true,
        durationSeconds: true,
        mediaKey: true,
        coverImageKey: true,
        externalMediaUrl: true,
        audioDownloadKey: true,
      },
    });
  } catch {
    notFound();
  }
  if (!message) notFound();

  const coverPreviewUrl = await resolveAssetUrl(message.coverImageKey).catch(
    () => null,
  );

  return (
    <EditMessageForm
      message={{
        ...message,
        coverPreviewUrl,
        durationSeconds:
          typeof message.durationSeconds === "bigint"
            ? Number(message.durationSeconds)
            : null,
      }}
    />
  );
}
