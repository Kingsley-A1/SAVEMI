export type MediaKind = "video" | "audio" | "image" | "document";

interface MediaRule {
  kind: MediaKind;
  mimeTypes: string[];
  maxBytes: number;
  compressionPlan: {
    stage: "pre-publish";
    summary: string;
    recommendedTool: "FFmpeg" | "sharp" | "none";
  };
}

export interface UploadRequestPayload {
  fileName: string;
  contentType: string;
  contentLength?: number;
}

export interface ValidatedUploadRequest {
  fileName: string;
  contentType: string;
  contentLength: number | null;
  mediaKind: MediaKind;
}

const GB = 1024 * 1024 * 1024;
const MB = 1024 * 1024;

// Large ceilings so 300MB+ media is never rejected. Resilient multipart
// uploads (see admin-upload-client) handle the actual transfer.
const MEDIA_RULES: MediaRule[] = [
  {
    kind: "video",
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    maxBytes: 5 * GB,
    compressionPlan: {
      stage: "pre-publish",
      summary: "Transcode to an H.264/AAC delivery file before final publish.",
      recommendedTool: "FFmpeg",
    },
  },
  {
    kind: "audio",
    mimeTypes: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"],
    maxBytes: 2 * GB,
    compressionPlan: {
      stage: "pre-publish",
      summary:
        "Normalize and compress to a web delivery bitrate before final publish.",
      recommendedTool: "FFmpeg",
    },
  },
  {
    kind: "image",
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 512 * MB,
    compressionPlan: {
      stage: "pre-publish",
      summary:
        "Resize and optimize responsive variants before public delivery.",
      recommendedTool: "sharp",
    },
  },
  {
    // Book files uploaded straight from an admin device.
    kind: "document",
    mimeTypes: [
      "application/pdf",
      "application/epub+zip",
      "application/x-mobipocket-ebook",
      "application/vnd.amazon.ebook",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/rtf",
      "text/plain",
      "application/zip",
    ],
    maxBytes: 512 * MB,
    compressionPlan: {
      stage: "pre-publish",
      summary:
        "Documents are delivered as uploaded — check the file opens before publishing.",
      recommendedTool: "none",
    },
  },
];

/**
 * Extension fallbacks for formats browsers report inconsistently (EPUB and
 * MOBI often arrive as an empty or generic content type).
 */
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  epub: "application/epub+zip",
  mobi: "application/x-mobipocket-ebook",
  azw3: "application/vnd.amazon.ebook",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  rtf: "application/rtf",
  txt: "text/plain",
};

/** Best-effort content type for a file name, used when the browser sends none. */
export function contentTypeForFileName(fileName: string): string | null {
  const extension = /\.([a-z0-9]+)$/i.exec(fileName)?.[1]?.toLowerCase();
  return extension ? (EXTENSION_CONTENT_TYPES[extension] ?? null) : null;
}

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function findRule(contentType: string): MediaRule | undefined {
  return MEDIA_RULES.find((rule) => rule.mimeTypes.includes(contentType));
}

export function validateUploadRequest(
  payload: unknown,
):
  | { success: true; data: ValidatedUploadRequest }
  | { success: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { success: false, error: "Upload payload must be an object." };
  }

  const candidate = payload as Partial<UploadRequestPayload>;
  const fileName = candidate.fileName?.trim();
  const contentLength =
    typeof candidate.contentLength === "number"
      ? candidate.contentLength
      : null;

  if (!fileName) {
    return { success: false, error: "fileName is required." };
  }

  // Sign with exactly what the browser will send, or the upload signature
  // will not match.
  const contentType = candidate.contentType?.trim().toLowerCase() ?? "";

  // Browsers report "" or a generic type for some e-book formats, so fall
  // back to the file extension when deciding whether the upload is allowed.
  const extensionType = contentTypeForFileName(fileName);
  const rule =
    (contentType ? findRule(contentType) : undefined) ??
    (extensionType ? findRule(extensionType) : undefined);

  if (!contentType && !extensionType) {
    return { success: false, error: "contentType is required." };
  }

  if (!rule) {
    return { success: false, error: "Unsupported media type." };
  }

  if (contentLength !== null && contentLength > rule.maxBytes) {
    return {
      success: false,
      error: `File exceeds the ${Math.round(rule.maxBytes / (1024 * 1024))}MB limit.`,
    };
  }

  return {
    success: true,
    data: {
      fileName: sanitizeFileName(fileName),
      contentType,
      contentLength,
      mediaKind: rule.kind,
    },
  };
}

export function buildUploadObjectKey({
  fileName,
  mediaKind,
}: {
  fileName: string;
  mediaKind: MediaKind;
}): string {
  const now = new Date();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, "0");
  const name = sanitizeFileName(fileName) || "upload";

  return `${mediaKind}/${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}-${name}`;
}

export function getCompressionPlan(mediaKind: MediaKind) {
  return (
    MEDIA_RULES.find((rule) => rule.kind === mediaKind)?.compressionPlan ?? null
  );
}
