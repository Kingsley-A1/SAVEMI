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

/**
 * GET /api/download/resources/[slug]
 *
 * Streams a published resource file uploaded from an admin device, named
 * after the resource title. Resources that only carry an external link are
 * redirected to that link instead — there is nothing of ours to stream.
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

  // Visitors only ever reach published resources; a signed-in admin can also
  // pull a draft down to check it before publishing.
  const session = await auth().catch(() => null);
  // Members are signed in too — only an admin may pull down a draft.
  const isAdmin = session?.user?.role === "admin";

  const resource = await prisma.book
    .findFirst({
      where: {
        ...(isAdmin ? {} : { status: "PUBLISHED" as const }),
        OR: [{ slug }, { id: slug }],
      },
      select: {
        id: true,
        title: true,
        downloadKey: true,
        downloadFileName: true,
        downloadUrl: true,
      },
    })
    .catch(() => null);

  if (!resource) {
    return new Response("Resource not found.", { status: 404 });
  }

  // Count a download once: a resumed or chunked transfer re-requests with
  // a Range header past byte 0, and admin checks are not audience activity.
  const range = request.headers.get("range");
  if (!isAdmin && (!range || /^bytes=0-/.test(range))) {
    after(() =>
      recordEvent({
        type: "DOWNLOAD",
        kind: "RESOURCE",
        targetId: resource.id,
        userId: session?.user?.role === "user" ? session.user.id : null,
        context: getRequestContext(request),
      }),
    );
  }

  if (!resource.downloadKey) {
    if (resource.downloadUrl) {
      return Response.redirect(resource.downloadUrl, 302);
    }

    return new Response("No file has been attached to this resource.", {
      status: 404,
    });
  }

  return streamAttachment({
    key: resource.downloadKey,
    request,
    fileName: buildDownloadFileName({
      title: resource.title,
      kind: "document",
      // Prefer the uploaded file's own extension, then the object key's.
      source: resource.downloadFileName || resource.downloadKey,
    }),
  });
}
