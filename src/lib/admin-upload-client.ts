/**
 * Resilient admin upload client.
 *
 * Small files use a single presigned PUT. Large files go through S3/R2
 * multipart: the file is split, each part is presigned and PUT independently,
 * and only a failed part is re-sent — the whole transfer is never restarted.
 *
 * ── Why the error handling here is fussy ────────────────────────────────
 * A browser reports every network-layer upload failure the same way: XHR
 * fires `onerror` with `status === 0`. A bucket refusing the origin (CORS)
 * and a mobile connection dropping mid-transfer are indistinguishable from
 * the error alone. They need opposite responses — one is a permanent
 * configuration fault, the other must be retried — so we separate them by
 * the one signal that does differ:
 *
 *   CORS / refused before sending   → 0 bytes ever left the browser
 *   Connection dropped mid-transfer → progress fired first, then the error
 *
 * Getting this wrong in either direction is costly: retrying a real CORS
 * fault just makes the admin wait, and *not* retrying a dropped connection
 * throws away an upload that was most of the way done.
 *
 * NOTE: multipart requires the R2 bucket CORS policy to allow PUT and to
 * expose the ETag response header (ExposeHeaders: ["ETag"]). See HANDOVER.
 */

export interface AdminUploadResult {
  objectKey: string;
}

export interface UploadStatus {
  phase: "preparing" | "uploading" | "retrying" | "finalising";
  /** A sentence fit to show the admin. */
  message: string;
}

export interface UploadAdminFileOptions {
  file: File;
  fileName: string;
  onProgress?: (progress: number) => void;
  /** Narrates retries so a long upload never looks stalled. */
  onStatus?: (status: UploadStatus) => void;
}

/* ────────────────────────────────────────────────────────────────────────
   Errors

   An upload has several distinct ways to fail, and "upload failed" tells the
   admin nothing they can act on. Every failure therefore ends up as an
   `UploadError` carrying the facts: which stage broke, how far the transfer
   got, which part, how many attempts, and whatever storage itself said.
   ──────────────────────────────────────────────────────────────────────── */

/** The current site origin, or a readable stand-in during server render. */
function currentOrigin(): string {
  return typeof window === "undefined" ? "this site" : window.location.origin;
}

/** Why an upload stopped. Drives both the wording and the suggested remedy. */
export type UploadFailureReason =
  /** Nothing ever left the browser — storage refused the request outright. */
  | "blocked"
  /** The transfer started, then the connection went away. */
  | "interrupted"
  /** Storage answered with an error status. */
  | "rejected"
  /** Could not obtain a presigned URL from our own server. */
  | "signing"
  /** Parts uploaded, but assembling them failed. */
  | "finalising"
  /** A configuration problem we can name precisely. */
  | "config";

export interface UploadFailureDetail {
  reason: UploadFailureReason;
  /** One sentence, safe and useful to show the admin. */
  summary: string;
  /** What to do about it. */
  remedy: string;
  fileName: string;
  totalBytes: number;
  /** Bytes confirmed stored before the failure. */
  uploadedBytes: number;
  /** Attempts spent on the request that finally failed. */
  attempts: number;
  /** Multipart position, when the failure happened on a part. */
  partNumber?: number;
  totalParts?: number;
  /** Bytes that made it out on the last attempt before it died. */
  bytesSentOnLastAttempt?: number;
  /** HTTP status from storage, when there was one. */
  httpStatus?: number;
  /** R2/S3 error code, e.g. "AccessDenied", "SignatureDoesNotMatch". */
  storageCode?: string;
}

/** Human byte sizes for messages the admin reads. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * The one error the forms catch.
 *
 * `message` is the sentence to show. `detail` carries the specifics, so the
 * UI can offer them without putting jargon in front of the admin.
 */
export class UploadError extends Error {
  constructor(
    readonly detail: UploadFailureDetail,
    readonly cause?: unknown,
  ) {
    super(detail.summary);
    this.name = "UploadError";
  }

  /** A one-line technical trace for a bug report. */
  get technicalSummary(): string {
    const d = this.detail;
    const bits = [
      `reason=${d.reason}`,
      d.partNumber ? `part=${d.partNumber}/${d.totalParts}` : null,
      `attempts=${d.attempts}`,
      `uploaded=${formatBytes(d.uploadedBytes)}/${formatBytes(d.totalBytes)}`,
      d.bytesSentOnLastAttempt !== undefined
        ? `lastAttemptSent=${formatBytes(d.bytesSentOnLastAttempt)}`
        : null,
      d.httpStatus ? `http=${d.httpStatus}` : null,
      d.storageCode ? `code=${d.storageCode}` : null,
    ];
    return bits.filter(Boolean).join(" · ");
  }
}

/**
 * Not one byte reached storage.
 *
 * Raised only after retries are exhausted *and* nothing in this transfer has
 * ever succeeded — the pattern of a bucket refusing this origin outright,
 * rather than a connection that comes and goes.
 */
export class StorageBlockedError extends Error {
  readonly origin: string;

  constructor() {
    super("Storage refused the request before any data could be sent.");
    this.name = "StorageBlockedError";
    this.origin = currentOrigin();
  }
}

/**
 * The transfer started and then the connection went away.
 *
 * Expected on mobile networks. This is what a 900MB upload over 4G will hit,
 * sometimes repeatedly, and recovering from it is the difference between an
 * upload finishing and an admin starting over.
 */
export class NetworkInterruptedError extends Error {
  constructor(readonly bytesSent: number) {
    super("The connection dropped mid-transfer.");
    this.name = "NetworkInterruptedError";
  }
}

/** Storage answered, and the answer was an error. */
export class StorageRejectedError extends Error {
  constructor(
    readonly httpStatus: number,
    readonly storageCode?: string,
  ) {
    super(
      storageCode
        ? `Storage rejected the upload (${httpStatus} ${storageCode}).`
        : `Storage rejected the upload with status ${httpStatus}.`,
    );
    this.name = "StorageRejectedError";
  }
}

/** Remedies, keyed by cause, written for the person reading them. */
const REMEDIES: Record<UploadFailureReason, string> = {
  blocked: `Storage would not accept a request from ${currentOrigin()}. If other uploads are also failing, ask engineering to run the Upload check on the Health page — it usually means this address is missing from the storage bucket's allowed origins.`,
  interrupted:
    "This is a connection problem, not a fault with the file. Move somewhere with a steadier signal and press Retry upload — the parts that already succeeded are not sent again.",
  rejected:
    "Storage declined the request itself. Ask engineering to check the storage credentials and bucket permissions; the code above tells them which.",
  signing:
    "The website could not prepare the upload. Check you are still signed in, then try again.",
  finalising:
    "Every part was sent but storage could not assemble them. Press Retry upload; if it happens again, ask engineering to check the bucket's ExposeHeaders setting for ETag.",
  config:
    "This needs a configuration change rather than another attempt. Share the details below with engineering.",
};

/** Compose the sentence and remedy an admin actually sees. */
function describeFailure(
  partial: Omit<UploadFailureDetail, "summary" | "remedy">,
): UploadFailureDetail {
  const {
    reason,
    partNumber,
    totalParts,
    attempts,
    uploadedBytes,
    totalBytes,
    bytesSentOnLastAttempt,
  } = partial;

  // Name the place in the transfer, so "it failed" becomes "it failed here".
  const where =
    partNumber && totalParts
      ? `Part ${partNumber} of ${totalParts}`
      : "The file";

  const progressNote =
    uploadedBytes > 0 && totalBytes > 0
      ? ` ${formatBytes(uploadedBytes)} of ${formatBytes(totalBytes)} had already been stored.`
      : "";

  const attemptNote =
    attempts > 1 ? ` after ${attempts} attempts` : "";

  let summary: string;
  switch (reason) {
    case "interrupted": {
      const sent =
        bytesSentOnLastAttempt && bytesSentOnLastAttempt > 0
          ? `, ${formatBytes(bytesSentOnLastAttempt)} into that attempt`
          : "";
      summary = `${where} could not be sent: the connection dropped${sent}${attemptNote}.${progressNote}`;
      break;
    }
    case "blocked":
      summary = `${where} could not be sent: storage refused the request before any data left this device${attemptNote}.`;
      break;
    case "rejected":
      summary = `${where} was refused by storage${partial.httpStatus ? ` (status ${partial.httpStatus}${partial.storageCode ? ` ${partial.storageCode}` : ""})` : ""}${attemptNote}.${progressNote}`;
      break;
    case "signing":
      summary = `The upload could not be prepared${attemptNote}. ${where} was never sent.`;
      break;
    case "finalising":
      summary = `All ${totalParts ?? ""} parts were sent, but storage could not assemble the finished file.`.replace(
        "All  parts",
        "All parts",
      );
      break;
    case "config":
    default:
      summary = `${where} could not be uploaded${attemptNote}.${progressNote}`;
      break;
  }

  return { ...partial, summary, remedy: REMEDIES[reason] };
}

/** Map a thrown cause onto the reason and the storage specifics it carries. */
function classifyCause(cause: unknown): {
  reason: UploadFailureReason;
  httpStatus?: number;
  storageCode?: string;
  bytesSentOnLastAttempt?: number;
} {
  if (cause instanceof StorageBlockedError) return { reason: "blocked" };
  if (cause instanceof NetworkInterruptedError) {
    return {
      reason: "interrupted",
      bytesSentOnLastAttempt: cause.bytesSent,
    };
  }
  if (cause instanceof StorageRejectedError) {
    return {
      reason: "rejected",
      httpStatus: cause.httpStatus,
      storageCode: cause.storageCode,
    };
  }
  if (cause instanceof Error && /ETag/i.test(cause.message)) {
    return { reason: "config" };
  }
  return { reason: "signing" };
}

/** What the form needs in order to explain a failure to the admin. */
export interface UploadErrorDisplay {
  /** The sentence naming exactly what failed. */
  message: string;
  /** What to do next. */
  remedy?: string;
  /** One-line technical trace, for a bug report. */
  technical?: string;
}

/**
 * Turn anything thrown during an upload into something showable.
 *
 * Keeps the forms free of instanceof checks, and guarantees they never fall
 * back to a bare "Upload failed" when better information exists.
 */
export function toUploadErrorDisplay(error: unknown): UploadErrorDisplay {
  if (error instanceof UploadError) {
    return {
      message: error.detail.summary,
      remedy: error.detail.remedy,
      technical: error.technicalSummary,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "The upload could not be completed." };
}

/* ────────────────────────────────────────────────────────────────────────
   Tunables
   ──────────────────────────────────────────────────────────────────────── */

const MB = 1024 * 1024;
/** Files at or below this size use a single PUT; larger files go multipart. */
const MULTIPART_THRESHOLD = 32 * MB;
/**
 * Part size. Deliberately smaller than the multipart threshold: a dropped
 * connection costs at most one part, so smaller parts mean less repeated work
 * on a flaky link. S3/R2 require every part except the last to be >= 5MB.
 */
const BASE_PART_SIZE = 16 * MB;
const MAX_PARTS = 10000;
/** Attempts per request. Generous, because the common failure is transient. */
const MAX_ATTEMPTS = 6;
const MAX_BACKOFF_MS = 15_000;
/** How long to wait for the device to come back online before giving up. */
const OFFLINE_WAIT_MS = 90_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pause while the device is offline.
 *
 * Retrying into a known-dead radio just burns attempts, so wait for the
 * browser to report connectivity again (bounded, so we never hang forever).
 */
function waitForOnline(): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("online", finish);
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(finish, OFFLINE_WAIT_MS);
    window.addEventListener("online", finish);
  });
}

interface RetryContext {
  label: string;
  onStatus?: (status: UploadStatus) => void;
  /** True once anything in this transfer has reached storage. */
  hasSucceededBefore: boolean;
}

/** Thrown when attempts run out; carries the count for the failure detail. */
export class RetriesExhaustedError extends Error {
  constructor(
    readonly attempts: number,
    readonly lastError: unknown,
  ) {
    super(
      lastError instanceof Error ? lastError.message : "The request failed.",
    );
    this.name = "RetriesExhaustedError";
  }
}

/**
 * Run a request with retries.
 *
 * Every network failure is retried. The classification only decides what to
 * *report* once the attempts are spent — never whether to try again.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  { label, onStatus, hasSucceededBefore }: RetryContext,
): Promise<T> {
  let lastError: unknown;
  let everSentBytes = false;
  // "Nothing was sent" only means a refused origin when the failures were
  // network-level. A 403 from storage, or a response missing its ETag, is a
  // different fault entirely and must keep its own identity.
  let allFailuresWereNetworkLevel = true;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (error instanceof NetworkInterruptedError) {
        if (error.bytesSent > 0) everSentBytes = true;
      } else {
        allFailuresWereNetworkLevel = false;
      }

      if (attempt < MAX_ATTEMPTS) {
        onStatus?.({
          phase: "retrying",
          message: `Connection interrupted. Retrying ${label} (attempt ${attempt + 1} of ${MAX_ATTEMPTS})…`,
        });

        await waitForOnline();
        // Exponential backoff with jitter, capped so a long stall still
        // recovers in reasonable time: ~0.5s, 1s, 2s, 4s, 8s.
        const backoff = Math.min(500 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
        await delay(backoff + Math.random() * 400);
      }
    }
  }

  // Nothing ever left the browser across every attempt, every failure was
  // network-level, and nothing in this transfer has succeeded: that, and only
  // that, is the signature of a refused origin.
  if (allFailuresWereNetworkLevel && !everSentBytes && !hasSucceededBefore) {
    throw new RetriesExhaustedError(MAX_ATTEMPTS, new StorageBlockedError());
  }

  throw new RetriesExhaustedError(
    MAX_ATTEMPTS,
    lastError instanceof Error
      ? lastError
      : new Error(`${label} failed after ${MAX_ATTEMPTS} attempts.`),
  );
}

/** Unwrap a retry wrapper so the underlying cause can be classified. */
function rootCause(error: unknown): { cause: unknown; attempts: number } {
  if (error instanceof RetriesExhaustedError) {
    return { cause: error.lastError, attempts: error.attempts };
  }
  return { cause: error, attempts: 1 };
}

/* ────────────────────────────────────────────────────────────────────────
   The network primitive
   ──────────────────────────────────────────────────────────────────────── */

export interface PutResult {
  eTag: string | null;
}

export interface PutOptions {
  url: string;
  body: Blob | File;
  contentType: string | null;
  onProgress?: (loadedBytes: number) => void;
}

export type PutFn = (options: PutOptions) => Promise<PutResult>;

/**
 * PUT a body to a presigned URL, reporting incremental progress.
 *
 * Tracks how many bytes actually left the browser, because that is what
 * distinguishes a refused request from an interrupted one.
 */
export const putToUrl: PutFn = ({ url, body, contentType, onProgress }) =>
  new Promise<PutResult>((resolve, reject) => {
    const request = new XMLHttpRequest();
    let bytesSent = 0;

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        bytesSent = event.loaded;
        onProgress?.(event.loaded);
      }
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

      // R2 answers a rejected PUT with an XML error code — surface it, since
      // AccessDenied and SignatureDoesNotMatch need different fixes.
      const code = /<Code>([^<]+)<\/Code>/.exec(request.responseText ?? "")?.[1];
      reject(new StorageRejectedError(request.status, code));
    };

    // status 0 with no bytes sent means the request never left; with bytes
    // sent it means the connection died partway. Both arrive here.
    request.onerror = () => reject(new NetworkInterruptedError(bytesSent));
    request.ontimeout = () => reject(new NetworkInterruptedError(bytesSent));
    request.onabort = () => reject(new NetworkInterruptedError(bytesSent));

    request.open("PUT", url);
    // No fixed timeout — large parts on slow links must not be cut off.
    request.timeout = 0;
    if (contentType) request.setRequestHeader("content-type", contentType);
    request.send(body);
  });

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

/* ────────────────────────────────────────────────────────────────────────
   Single PUT — smaller files
   ──────────────────────────────────────────────────────────────────────── */

async function uploadSinglePart(
  { file, fileName, onProgress, onStatus }: UploadAdminFileOptions,
  put: PutFn,
): Promise<AdminUploadResult> {
  onProgress?.(4);
  onStatus?.({ phase: "preparing", message: "Preparing the upload…" });

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
    throw new UploadError(
      describeFailure({
        reason: "signing",
        fileName: file.name,
        totalBytes: file.size,
        uploadedBytes: 0,
        attempts: 1,
        httpStatus: response.status,
        storageCode: payload?.error,
      }),
    );
  }
  const uploadUrl = payload.data.uploadUrl;
  const objectKey = payload.data.objectKey;

  onStatus?.({ phase: "uploading", message: "Uploading…" });

  try {
    await withRetry(
      () =>
        put({
          url: uploadUrl,
          body: file,
          contentType: file.type,
          onProgress: (loaded) => {
            const pct = 4 + Math.round((loaded / file.size) * 92);
            onProgress?.(Math.min(96, pct));
          },
        }),
      { label: "the file", onStatus, hasSucceededBefore: false },
    );
  } catch (error) {
    const { cause, attempts } = rootCause(error);
    throw new UploadError(
      describeFailure({
        ...classifyCause(cause),
        fileName: file.name,
        totalBytes: file.size,
        uploadedBytes: 0,
        attempts,
      }),
      cause,
    );
  }

  onProgress?.(100);
  return { objectKey };
}

/* ────────────────────────────────────────────────────────────────────────
   Multipart — large files
   ──────────────────────────────────────────────────────────────────────── */

async function uploadMultipart(
  { file, fileName, onProgress, onStatus }: UploadAdminFileOptions,
  put: PutFn,
): Promise<AdminUploadResult> {
  onProgress?.(2);
  onStatus?.({ phase: "preparing", message: "Preparing the upload…" });

  const partSize = Math.max(BASE_PART_SIZE, Math.ceil(file.size / MAX_PARTS));
  const partCount = Math.ceil(file.size / partSize);

  let init: { uploadId: string; objectKey: string };
  try {
    init = await requestJson<{ uploadId: string; objectKey: string }>({
      action: "initiate",
      fileName,
      contentType: file.type,
      contentLength: file.size,
    });
  } catch (error) {
    throw new UploadError(
      describeFailure({
        reason: "signing",
        fileName: file.name,
        totalBytes: file.size,
        uploadedBytes: 0,
        attempts: 1,
        totalParts: partCount,
      }),
      error,
    );
  }

  const { uploadId, objectKey } = init;

  const loadedByPart = new Array<number>(partCount).fill(0);
  const reportProgress = () => {
    const loaded = loadedByPart.reduce((sum, n) => sum + n, 0);
    const pct = 2 + Math.round((loaded / file.size) * 95);
    onProgress?.(Math.min(97, pct));
  };

  try {
    const completedParts: Array<{ partNumber: number; eTag: string }> = [];

    // Sequential: gentle on flaky mobile links and on memory, with
    // independent retries per part.
    for (let index = 0; index < partCount; index++) {
      const partNumber = index + 1;
      const start = index * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);

      onStatus?.({
        phase: "uploading",
        message: `Uploading part ${partNumber} of ${partCount}…`,
      });

      let eTag: string;
      try {
        eTag = await withRetry(
        async () => {
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
          const result = await put({
            url,
            body: blob,
            contentType: null,
            onProgress: (loaded) => {
              loadedByPart[index] = loaded;
              reportProgress();
            },
          });

          if (!result.eTag) {
            throw new Error(
              "Storage did not return an ETag. Enable ETag in the R2 bucket CORS ExposeHeaders.",
            );
          }
          return result.eTag;
        },
        {
          label: `part ${partNumber} of ${partCount}`,
          onStatus,
          // Once one part is in, a later failure cannot be a refused origin.
          hasSucceededBefore: completedParts.length > 0,
        },
        );
      } catch (error) {
        const { cause, attempts } = rootCause(error);
        // `uploadedBytes` counts only parts storage has confirmed, so the
        // admin is told exactly how much of the file is safely stored.
        throw new UploadError(
          describeFailure({
            ...classifyCause(cause),
            fileName: file.name,
            totalBytes: file.size,
            uploadedBytes: completedParts.length * partSize,
            attempts,
            partNumber,
            totalParts: partCount,
          }),
          cause,
        );
      }

      loadedByPart[index] = end - start;
      reportProgress();
      completedParts.push({ partNumber, eTag });
    }

    onStatus?.({ phase: "finalising", message: "Finishing up…" });

    try {
      await requestJson({
        action: "complete",
        key: objectKey,
        uploadId,
        parts: completedParts,
      });
    } catch (error) {
      throw new UploadError(
        describeFailure({
          reason: "finalising",
          fileName: file.name,
          totalBytes: file.size,
          uploadedBytes: file.size,
          attempts: 1,
          totalParts: partCount,
        }),
        error,
      );
    }

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

/**
 * Upload a file, choosing single-PUT or multipart by size.
 *
 * `put` is injectable so the retry and classification behaviour can be tested
 * without a browser or a network.
 */
export async function uploadAdminFile(
  options: UploadAdminFileOptions,
  put: PutFn = putToUrl,
): Promise<AdminUploadResult> {
  if (options.file.size > MULTIPART_THRESHOLD) {
    return uploadMultipart(options, put);
  }
  return uploadSinglePart(options, put);
}
