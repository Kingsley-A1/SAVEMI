import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import {
  buildDownloadFileName,
  streamAttachment,
} from "../../../../../lib/download";

export const dynamic = "force-dynamic";

type Variant = "media" | "audio";

/**
 * GET /api/download/messages/[slug]?variant=media|audio
 *
 * Streams a published message's file straight to the visitor as an attachment
 * named after the message title. One click saves the file; nobody is ever sent
 * to the raw storage URL.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!isDatabaseConfigured()) {
    return new Response("Downloads are not available right now.", {
      status: 503,
    });
  }

  const { slug } = await params;
  const requested = new URL(request.url).searchParams.get("variant");
  const variant: Variant = requested === "audio" ? "audio" : "media";

  // Visitors only ever reach published media; a signed-in admin can also pull
  // a draft down from the preview screen.
  const session = await auth().catch(() => null);

  const message = await prisma.message
    .findFirst({
      where: {
        ...(session ? {} : { status: "PUBLISHED" as const }),
        OR: [{ slug }, { id: slug }],
      },
      select: {
        title: true,
        type: true,
        mediaKey: true,
        audioDownloadKey: true,
      },
    })
    .catch(() => null);

  if (!message) {
    return new Response("Message not found.", { status: 404 });
  }

  const key =
    variant === "audio" ? message.audioDownloadKey : message.mediaKey;

  if (!key) {
    return new Response("No file has been attached to this message.", {
      status: 404,
    });
  }

  const kind =
    variant === "audio"
      ? "audio"
      : (message.type.toLowerCase() as "video" | "audio" | "image");

  return streamAttachment({
    key,
    request,
    fileName: buildDownloadFileName({
      title: message.title,
      kind,
      source: key,
      // Distinguish the companion audio track of a video message.
      suffix:
        variant === "audio" && message.type === "VIDEO" ? "audio" : undefined,
    }),
  });
}
