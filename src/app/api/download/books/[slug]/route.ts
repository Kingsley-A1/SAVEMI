import { auth } from "../../../../../../auth";
import { isDatabaseConfigured, prisma } from "../../../../../lib/db";
import {
  buildDownloadFileName,
  streamAttachment,
} from "../../../../../lib/download";

export const dynamic = "force-dynamic";

/**
 * GET /api/download/books/[slug]
 *
 * Streams a published book file uploaded from an admin device, named after the
 * book title. Books that only carry an external link are redirected to that
 * link instead — there is nothing of ours to stream.
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

  // Visitors only ever reach published books; a signed-in admin can also pull
  // a draft down to check it before publishing.
  const session = await auth().catch(() => null);

  const book = await prisma.book
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

  if (!book) {
    return new Response("Book not found.", { status: 404 });
  }

  if (!book.downloadKey) {
    if (book.downloadUrl) {
      return Response.redirect(book.downloadUrl, 302);
    }

    return new Response("No file has been attached to this book.", {
      status: 404,
    });
  }

  return streamAttachment({
    key: book.downloadKey,
    request,
    fileName: buildDownloadFileName({
      title: book.title,
      kind: "document",
      // Prefer the uploaded file's own extension, then the object key's.
      source: book.downloadFileName || book.downloadKey,
    }),
  });
}
