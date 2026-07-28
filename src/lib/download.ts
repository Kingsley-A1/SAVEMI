/**
 * Download naming and streaming helpers.
 *
 * Two rules drive everything here:
 *
 *  1. One click, one download. Files are streamed back through the site's own
 *     origin with `Content-Disposition: attachment`, so the browser saves them
 *     instead of navigating to a storage URL. The R2 object URL is never shown
 *     to a visitor.
 *  2. The file is named after the title the admin gave it during upload —
 *     never the generated object ID.
 */

import { resolveAssetUrl } from "./r2";

/** Sensible extension when the stored object has none. */
const FALLBACK_EXTENSION: Record<string, string> = {
  video: "mp4",
  audio: "mp3",
  image: "jpg",
  document: "pdf",
};

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
};

/** Kebab-case a human title into a safe, readable file stem. */
export function toFileStem(title: string, fallback = "savemi-download"): string {
  const stem = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");

  return stem || fallback;
}

/** Pull the extension off a storage key, URL, or original file name. */
export function extensionFrom(source: string | null | undefined): string {
  if (!source) return "";

  let path = source;
  try {
    if (/^https?:\/\//i.test(source)) path = new URL(source).pathname;
  } catch {
    /* treat as a plain key */
  }

  const match = /\.([a-z0-9]{2,5})$/i.exec(path.split("/").pop() ?? "");
  return match ? match[1].toLowerCase() : "";
}

/**
 * Build the name the visitor sees in their downloads folder:
 * "walking-in-the-light.mp4", not "8d70dccc-0740-…-media-1785195528299.mp4".
 */
export function buildDownloadFileName({
  title,
  kind,
  source,
  contentType,
  suffix,
}: {
  /** Title the admin entered when uploading. */
  title: string;
  kind: "video" | "audio" | "image" | "document";
  /** Object key, URL, or original file name — used to recover the extension. */
  source?: string | null;
  /** Upstream content type, used when the source has no extension. */
  contentType?: string | null;
  /** Optional discriminator, e.g. "audio" for a video message's audio track. */
  suffix?: string;
}): string {
  const stem = toFileStem(suffix ? `${title} ${suffix}` : title);
  const extension =
    extensionFrom(source) ||
    (contentType ? CONTENT_TYPE_EXTENSION[contentType.split(";")[0].trim()] : "") ||
    FALLBACK_EXTENSION[kind];

  return `${stem}.${extension}`;
}

/** RFC 5987 header value: an ASCII fallback plus the exact UTF-8 name. */
export function contentDispositionAttachment(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Stream a stored object back to the visitor as a named attachment.
 *
 * The upstream request is made server-side, so the storage URL stays private
 * and the click never bounces the visitor to another host.
 */
export async function streamAttachment({
  key,
  fileName,
  request,
}: {
  /** R2 object key or absolute URL. */
  key: string;
  fileName: string;
  /** Incoming request, so Range headers are honoured for large media. */
  request?: Request;
}): Promise<Response> {
  const assetUrl = await resolveAssetUrl(key);

  if (!assetUrl) {
    return new Response("This file is not available for download.", {
      status: 404,
    });
  }

  const range = request?.headers.get("range") ?? undefined;

  let upstream: Response;
  try {
    upstream = await fetch(assetUrl, {
      headers: range ? { range } : undefined,
      cache: "no-store",
    });
  } catch {
    return new Response("The file could not be reached. Please try again.", {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("The file could not be reached. Please try again.", {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  const headers = new Headers();
  headers.set(
    "content-type",
    upstream.headers.get("content-type") ?? "application/octet-stream",
  );
  headers.set("content-disposition", contentDispositionAttachment(fileName));
  headers.set("cache-control", "private, max-age=0, must-revalidate");
  headers.set("x-content-type-options", "nosniff");

  for (const header of ["content-length", "content-range", "accept-ranges", "etag"]) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers });
}
