export type MediaKind = 'video' | 'audio' | 'image';

interface MediaRule {
  kind: MediaKind;
  mimeTypes: string[];
  maxBytes: number;
  compressionPlan: {
    stage: 'pre-publish';
    summary: string;
    recommendedTool: 'FFmpeg' | 'sharp';
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

const MEDIA_RULES: MediaRule[] = [
  {
    kind: 'video',
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxBytes: 500 * 1024 * 1024,
    compressionPlan: {
      stage: 'pre-publish',
      summary: 'Transcode to an H.264/AAC delivery file before final publish.',
      recommendedTool: 'FFmpeg',
    },
  },
  {
    kind: 'audio',
    mimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav'],
    maxBytes: 100 * 1024 * 1024,
    compressionPlan: {
      stage: 'pre-publish',
      summary: 'Normalize and compress to a web delivery bitrate before final publish.',
      recommendedTool: 'FFmpeg',
    },
  },
  {
    kind: 'image',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 15 * 1024 * 1024,
    compressionPlan: {
      stage: 'pre-publish',
      summary: 'Resize and optimize responsive variants before public delivery.',
      recommendedTool: 'sharp',
    },
  },
];

function sanitizeFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function findRule(contentType: string): MediaRule | undefined {
  return MEDIA_RULES.find((rule) => rule.mimeTypes.includes(contentType));
}

export function validateUploadRequest(payload: unknown):
  | { success: true; data: ValidatedUploadRequest }
  | { success: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { success: false, error: 'Upload payload must be an object.' };
  }

  const candidate = payload as Partial<UploadRequestPayload>;
  const fileName = candidate.fileName?.trim();
  const contentType = candidate.contentType?.trim().toLowerCase();
  const contentLength = typeof candidate.contentLength === 'number' ? candidate.contentLength : null;

  if (!fileName) {
    return { success: false, error: 'fileName is required.' };
  }

  if (!contentType) {
    return { success: false, error: 'contentType is required.' };
  }

  const rule = findRule(contentType);

  if (!rule) {
    return { success: false, error: 'Unsupported media type.' };
  }

  if (contentLength !== null && contentLength > rule.maxBytes) {
    return { success: false, error: `File exceeds the ${Math.round(rule.maxBytes / (1024 * 1024))}MB limit.` };
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

export function buildUploadObjectKey({ fileName, mediaKind }: { fileName: string; mediaKind: MediaKind }): string {
  const now = new Date();
  const month = `${now.getUTCMonth() + 1}`.padStart(2, '0');
  const name = sanitizeFileName(fileName) || 'upload';

  return `${mediaKind}/${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}-${name}`;
}

export function getCompressionPlan(mediaKind: MediaKind) {
  return MEDIA_RULES.find((rule) => rule.kind === mediaKind)?.compressionPlan ?? null;
}