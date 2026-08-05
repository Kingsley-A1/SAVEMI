import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import {
  buildDownloadFileName,
  streamAttachment,
} from "../../../../../lib/download";

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

  const resource = await prisma.book
    .findFirst({
      where: {
        ...(session ? {} : { status: "PUBLISHED" as const }),
        OR: [{ slug }, { id: slug }],
      },
      select: {
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
