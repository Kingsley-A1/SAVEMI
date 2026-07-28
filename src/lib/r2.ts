import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface UploadUrlOptions {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

interface DownloadUrlOptions {
  key: string;
  expiresInSeconds?: number;
}

function getR2Endpoint(): string {
  return `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.CF_ACCOUNT_ID &&
    process.env.CF_ACCESS_KEY_ID &&
    process.env.CF_SECRET_ACCESS_KEY &&
    process.env.CF_BUCKET,
  );
}

function getClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  return new S3Client({
    region: "auto",
    endpoint: getR2Endpoint(),
    credentials: {
      accessKeyId: process.env.CF_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CF_SECRET_ACCESS_KEY!,
    },
  });
}

function normalizeObjectKey(key: string): string {
  return key.replace(/^\/+/, "");
}

export async function createUploadUrl({
  key,
  contentType,
  expiresInSeconds = 900,
}: UploadUrlOptions): Promise<string> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: process.env.CF_BUCKET!,
    Key: normalizeObjectKey(key),
    // Omitted when the browser reported no type, so the signature matches
    // the request the browser will actually send.
    ContentType: contentType || undefined,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// ---------------------------------------------------------------------------
// Multipart uploads — used for large (300MB+) media so a dropped connection
// only loses one part instead of the whole file. Each part is uploaded from
// the browser with its own presigned URL and retried independently.
// ---------------------------------------------------------------------------

export interface MultipartInit {
  uploadId: string;
  key: string;
}

export async function createMultipartUpload({
  key,
  contentType,
}: {
  key: string;
  contentType: string;
}): Promise<MultipartInit> {
  const client = getClient();
  const normalizedKey = normalizeObjectKey(key);
  const result = await client.send(
    new CreateMultipartUploadCommand({
      Bucket: process.env.CF_BUCKET!,
      Key: normalizedKey,
      ContentType: contentType || undefined,
    }),
  );

  if (!result.UploadId) {
    throw new Error("Failed to initiate multipart upload.");
  }

  return { uploadId: result.UploadId, key: normalizedKey };
}

export async function createPartUploadUrl({
  key,
  uploadId,
  partNumber,
  expiresInSeconds = 3600,
}: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getClient();
  const command = new UploadPartCommand({
    Bucket: process.env.CF_BUCKET!,
    Key: normalizeObjectKey(key),
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function completeMultipartUpload({
  key,
  uploadId,
  parts,
}: {
  key: string;
  uploadId: string;
  parts: Array<{ partNumber: number; eTag: string }>;
}): Promise<void> {
  const client = getClient();
  await client.send(
    new CompleteMultipartUploadCommand({
      Bucket: process.env.CF_BUCKET!,
      Key: normalizeObjectKey(key),
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((part) => ({ ETag: part.eTag, PartNumber: part.partNumber })),
      },
    }),
  );
}

export async function abortMultipartUpload({
  key,
  uploadId,
}: {
  key: string;
  uploadId: string;
}): Promise<void> {
  const client = getClient();
  await client.send(
    new AbortMultipartUploadCommand({
      Bucket: process.env.CF_BUCKET!,
      Key: normalizeObjectKey(key),
      UploadId: uploadId,
    }),
  );
}

export async function createDownloadUrl({
  key,
  expiresInSeconds = 3600,
}: DownloadUrlOptions): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: process.env.CF_BUCKET!,
    Key: normalizeObjectKey(key),
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function resolveAssetUrl(
  key: string | null,
): Promise<string | null> {
  if (!key) {
    return null;
  }

  if (
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }

  if (process.env.CF_PUBLIC_BASE_URL) {
    return `${process.env.CF_PUBLIC_BASE_URL.replace(/\/$/, "")}/${normalizeObjectKey(key)}`;
  }

  if (!isStorageConfigured()) {
    return null;
  }

  return createDownloadUrl({ key });
}
