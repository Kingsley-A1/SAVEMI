/**
 * Ultra-resilient admin upload client.
 *
 * Small files (<= MULTIPART_THRESHOLD) are uploaded with a single presigned
 * PUT and retried on failure. Large files (300MB+ video/audio/image) are
 * uploaded with S3/R2 multipart: the file is split into parts, each part is
 * presigned and PUT independently with exponential-backoff retries, and only
 * the failed part is re-sent if a connection drops — the whole transfer is
 * never restarted.
 *
 * NOTE: multipart requires the R2 bucket CORS policy to allow PUT and to
 * expose the ETag response header (ExposeHeaders: ["ETag"]). See HANDOVER.
 */

export interface AdminUploadResult {
  objectKey: string;
}

export interface UploadAdminFileOptions {
  file: File;
  fileName: string;
  onProgress?: (progress: number) => void;
}

const MB = 1024 * 1024;
// Files at or below this size use a single PUT; larger files go multipart.
const MULTIPART_THRESHOLD = 32 * MB;
const BASE_PART_SIZE = 32 * MB;
const MAX_PARTS = 10000;
const MAX_ATTEMPTS = 4;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        // Exponential backoff with jitter: ~0.5s, 1s, 2s.
        const backoff = 500 * 2 ** (attempt - 1) + Math.random() * 300;
        await delay(backoff);
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`${label} failed after ${MAX_ATTEMPTS} attempts.`);
}

interface PutResult {
  eTag: string | null;
}

/** PUT a body to a presigned URL via XHR, reporting incremental progress. */
function putToUrl(
  url: string,
  body: Blob | File,
  contentType: string | null,
  onProgress?: (loadedBytes: number) => void,
): Promise<PutResult> {
  return new Promise<PutResult>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded);
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        // ETag needed to complete multipart uploads (requires CORS ExposeHeaders).
        const eTag =
          request.getResponseHeader("ETag") ??
          request.getResponseHeader("etag");
        resolve({ eTag: eTag ? eTag.replace(/^"|"$/g, "") : null });
        return;
      }
      reject(new Error(`Upload failed with status ${request.status}.`));
    };

    request.onerror = () => reject(new Error("Upload to storage failed."));
    request.ontimeout = () => reject(new Error("Upload timed out."));

    request.open("PUT", url);
    // No fixed timeout — large parts on slow links must not be cut off.
    request.timeout = 0;
    if (contentType) request.setRequestHeader("content-type", contentType);
    request.send(body);
  });
}

async function requestJson<T>(body: unknown): Promise<T> {
  const response = await fetch("/api/admin/upload-multipart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error ?? "Upload request failed.");
  }
  return payload.data;
}

/** Single-PUT path for smaller files (with retry). */
async function uploadSinglePart({
  file,
  fileName,
  onProgress,
}: UploadAdminFileOptions): Promise<AdminUploadResult> {
  onProgress?.(4);

  const response = await fetch("/api/admin/upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName,
      contentType: file.type,
      contentLength: file.size,
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    data?: { uploadUrl?: string; objectKey?: string };
    error?: string;
  } | null;
  if (!response.ok || !payload?.data?.uploadUrl || !payload.data.objectKey) {
    throw new Error(payload?.error ?? "Upload URL failed.");
  }
  const uploadUrl = payload.data.uploadUrl;
  const objectKey = payload.data.objectKey;

  await withRetry(
    () =>
      putToUrl(uploadUrl, file, file.type, (loaded) => {
        const pct = 4 + Math.round((loaded / file.size) * 92);
        onProgress?.(Math.min(96, pct));
      }),
    "File upload",
  );

  onProgress?.(100);
  return { objectKey };
}

/** Multipart path for large files (per-part retry, resilient to drops). */
async function uploadMultipart({
  file,
  fileName,
  onProgress,
}: UploadAdminFileOptions): Promise<AdminUploadResult> {
  onProgress?.(2);

  const partSize = Math.max(BASE_PART_SIZE, Math.ceil(file.size / MAX_PARTS));
  const partCount = Math.ceil(file.size / partSize);

  const init = await requestJson<{ uploadId: string; objectKey: string }>({
    action: "initiate",
    fileName,
    contentType: file.type,
    contentLength: file.size,
  });

  const { uploadId, objectKey } = init;

  const loadedByPart = new Array<number>(partCount).fill(0);
  const reportProgress = () => {
    const loaded = loadedByPart.reduce((sum, n) => sum + n, 0);
    const pct = 2 + Math.round((loaded / file.size) * 95);
    onProgress?.(Math.min(97, pct));
  };

  try {
    const completedParts: Array<{ partNumber: number; eTag: string }> = [];

    // Upload parts sequentially: gentle on flaky mobile links and memory,
    // with independent retries per part.
    for (let index = 0; index < partCount; index++) {
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      const eTag = await withRetry(async () => {
        // Re-sign on every attempt so an expired URL never blocks a retry.
        const { parts } = await requestJson<{
          parts: Array<{ partNumber: number; url: string }>;
        }>({
          action: "sign",
          key: objectKey,
          uploadId,
          partNumbers: [partNumber],
        });
        const url = parts[0]?.url;
        if (!url) throw new Error("Could not sign upload part.");

        // Don't send content-type on parts — it isn't part of the signature.
        const result = await putToUrl(url, blob, null, (loaded) => {
          loadedByPart[index] = loaded;
          reportProgress();
        });

        if (!result.eTag) {
          throw new Error(
            "Storage did not return an ETag. Enable ETag in the R2 bucket CORS ExposeHeaders.",
          );
        }
        return result.eTag;
      }, `Part ${partNumber}`);

      loadedByPart[index] = end - start;
      reportProgress();
      completedParts.push({ partNumber, eTag });
    }

    await requestJson({
      action: "complete",
      key: objectKey,
      uploadId,
      parts: completedParts,
    });

    onProgress?.(100);
    return { objectKey };
  } catch (error) {
    // Best-effort cleanup so no orphaned multipart upload lingers.
    await fetch("/api/admin/upload-multipart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "abort", key: objectKey, uploadId }),
    }).catch(() => {});
    throw error;
  }
}

export async function uploadAdminFile(
  options: UploadAdminFileOptions,
): Promise<AdminUploadResult> {
  if (options.file.size > MULTIPART_THRESHOLD) {
    return uploadMultipart(options);
  }
  return uploadSinglePart(options);
}
