import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
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
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
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
