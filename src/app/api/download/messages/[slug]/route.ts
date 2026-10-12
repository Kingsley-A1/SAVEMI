import { after } from "next/server";
import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import {
  buildDownloadFileName,
  streamAttachment,
} from "../../../../../lib/download";
import {
  getRequestContext,
  recordEvent,
} from "../../../../../lib/engagement";

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
  // Members are signed in too — only an admin may pull down a draft.
  const isAdmin = session?.user?.role === "admin";

  const message = await prisma.message
    .findFirst({
      where: {
        ...(isAdmin ? {} : { status: "PUBLISHED" as const }),
        OR: [{ slug }, { id: slug }],
      },
      select: {
        id: true,
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

  // Count a download once: a resumed or chunked transfer re-requests with
  // a Range header past byte 0, and admin checks are not audience activity.
  const range = request.headers.get("range");
  if (!isAdmin && (!range || /^bytes=0-/.test(range))) {
    after(() =>
      recordEvent({
        type: "DOWNLOAD",
        kind: "MESSAGE",
        targetId: message.id,
        userId: session?.user?.role === "user" ? session.user.id : null,
        context: getRequestContext(request),
      }),
    );
  }

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
