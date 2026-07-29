import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NetworkInterruptedError,
  StorageRejectedError,
  UploadError,
  uploadAdminFile,
  type PutFn,
} from "./admin-upload-client";

/** Run an upload and return the UploadError it produced. */
async function failureOf(
  put: PutFn,
  sizeBytes = 4 * MB,
): Promise<UploadError> {
  const error = await uploadAdminFile(
    { file: fakeFile(sizeBytes), fileName: "sermon.mp4" },
    put,
  ).catch((caught) => caught);
  expect(error).toBeInstanceOf(UploadError);
  return error as UploadError;
}

/**
 * These tests pin the behaviour that matters for a 900MB upload over a mobile
 * connection: a dropped connection must be retried, and only a request that
 * never sent a byte may be reported as a refused origin.
 */

const MB = 1024 * 1024;

function fakeFile(sizeBytes: number, type = "video/mp4"): File {
  // A sparse stand-in: only `size`, `type`, and `slice` are used.
  return {
    size: sizeBytes,
    type,
    name: "sermon.mp4",
    slice: () => ({ size: Math.min(sizeBytes, 16 * MB) }) as unknown as Blob,
  } as unknown as File;
}

/** Minimal fetch double for the signing and multipart endpoints. */
function installFetch() {
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const target = String(url);
    const body = init?.body ? JSON.parse(String(init.body)) : {};

    if (target.includes("/api/admin/upload-url")) {
      return Response.json({
        data: { uploadUrl: "https://r2.example/put", objectKey: "video/x.mp4" },
      });
    }

    if (target.includes("/api/admin/upload-multipart")) {
      if (body.action === "initiate") {
        return Response.json({
          data: { uploadId: "upload-1", objectKey: "video/x.mp4" },
        });
      }
      if (body.action === "sign") {
        return Response.json({
          data: {
            parts: body.partNumbers.map((partNumber: number) => ({
              partNumber,
              url: `https://r2.example/part/${partNumber}`,
            })),
          },
        });
      }
      return Response.json({ data: { ok: true } });
    }

    return Response.json({ data: {} });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  installFetch();
  vi.stubGlobal("navigator", { onLine: true });
  // Collapse backoff so the retry paths run instantly.
  vi.spyOn(globalThis, "setTimeout").mockImplementation(((
    handler: () => void,
  ) => {
    handler();
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as typeof setTimeout);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a connection that drops mid-transfer", () => {
  it("is retried, and the upload still succeeds", async () => {
    let calls = 0;
    const put: PutFn = async ({ onProgress }) => {
      calls++;
      if (calls === 1) {
        // Progress fired, then the socket died — the mobile-network case.
        onProgress?.(400_000);
        throw new NetworkInterruptedError(400_000);
      }
      return { eTag: "etag-1" };
    };

    const result = await uploadAdminFile(
      { file: fakeFile(4 * MB), fileName: "sermon.mp4" },
      put,
    );

    expect(calls).toBe(2);
    expect(result.objectKey).toBe("video/x.mp4");
  });

  it("is never reported as a storage/CORS problem", async () => {
    const failure = await failureOf(async ({ onProgress }) => {
      onProgress?.(400_000);
      throw new NetworkInterruptedError(400_000);
    });

    expect(failure.detail.reason).toBe("interrupted");
  });

  it("says how far the last attempt got, and how many were made", async () => {
    const failure = await failureOf(async ({ onProgress }) => {
      onProgress?.(3_400_000);
      throw new NetworkInterruptedError(3_400_000);
    });

    expect(failure.detail.bytesSentOnLastAttempt).toBe(3_400_000);
    expect(failure.detail.attempts).toBe(6);
    expect(failure.message).toMatch(/connection dropped/i);
    expect(failure.message).toMatch(/3\.2 MB into that attempt/);
    expect(failure.message).toMatch(/after 6 attempts/);
  });

  it("retries an individual part rather than restarting a large upload", async () => {
    const attemptsByUrl = new Map<string, number>();
    const put: PutFn = async ({ url, onProgress }) => {
      const seen = (attemptsByUrl.get(url) ?? 0) + 1;
      attemptsByUrl.set(url, seen);

      // Part 3 fails once mid-transfer, like a real drop.
      if (url.endsWith("/part/3") && seen === 1) {
        onProgress?.(1_000);
        throw new NetworkInterruptedError(1_000);
      }
      return { eTag: `etag-${url}` };
    };

    // 48MB at a 16MB part size => 3 parts.
    await uploadAdminFile(
      { file: fakeFile(48 * MB), fileName: "sermon.mp4" },
      put,
    );

    expect(attemptsByUrl.get("https://r2.example/part/1")).toBe(1);
    expect(attemptsByUrl.get("https://r2.example/part/2")).toBe(1);
    expect(attemptsByUrl.get("https://r2.example/part/3")).toBe(2);
  });

  it("does not blame the origin once a part has already gone through", async () => {
    const failure = await failureOf(async ({ url, onProgress }) => {
      if (url.endsWith("/part/1")) return { eTag: "etag-1" };
      // Every later attempt is refused outright — but part 1 proved the
      // origin is allowed, so this must not be reported as blocked.
      onProgress?.(0);
      throw new NetworkInterruptedError(0);
    }, 48 * MB);

    expect(failure.detail.reason).not.toBe("blocked");
  });

  it("names the part that failed and what was already stored", async () => {
    const failure = await failureOf(async ({ url, onProgress }) => {
      if (url.endsWith("/part/1")) return { eTag: "etag-1" };
      onProgress?.(1_000);
      throw new NetworkInterruptedError(1_000);
    }, 48 * MB);

    expect(failure.detail.partNumber).toBe(2);
    expect(failure.detail.totalParts).toBe(3);
    expect(failure.message).toMatch(/^Part 2 of 3/);
    // One 16MB part was confirmed before the failure.
    expect(failure.detail.uploadedBytes).toBe(16 * MB);
    expect(failure.message).toMatch(/16 MB of 48 MB had already been stored/);
  });
});

describe("a request refused before any data is sent", () => {
  it("is reported as a blocked origin after retries are spent", async () => {
    const failure = await failureOf(async () => {
      // Zero bytes, every time: the CORS-preflight signature.
      throw new NetworkInterruptedError(0);
    });

    expect(failure.detail.reason).toBe("blocked");
    expect(failure.message).toMatch(/before any data left this device/i);
    expect(failure.detail.remedy).toMatch(/allowed origins/i);
  });

  it("still retries first, so a transient refusal recovers", async () => {
    let calls = 0;
    const put: PutFn = async () => {
      calls++;
      if (calls < 3) throw new NetworkInterruptedError(0);
      return { eTag: "etag-1" };
    };

    await uploadAdminFile(
      { file: fakeFile(4 * MB), fileName: "sermon.mp4" },
      put,
    );

    expect(calls).toBe(3);
  });
});

describe("a storage-level rejection", () => {
  it("reports the status and the storage code, not a generic failure", async () => {
    const failure = await failureOf(async () => {
      throw new StorageRejectedError(403, "SignatureDoesNotMatch");
    });

    expect(failure.detail.reason).toBe("rejected");
    expect(failure.detail.httpStatus).toBe(403);
    expect(failure.detail.storageCode).toBe("SignatureDoesNotMatch");
    expect(failure.message).toMatch(/status 403 SignatureDoesNotMatch/);
  });

  it("offers a one-line technical trace for a bug report", async () => {
    const failure = await failureOf(async () => {
      throw new StorageRejectedError(403, "AccessDenied");
    });

    expect(failure.technicalSummary).toMatch(/reason=rejected/);
    expect(failure.technicalSummary).toMatch(/http=403/);
    expect(failure.technicalSummary).toMatch(/code=AccessDenied/);
    expect(failure.technicalSummary).toMatch(/attempts=6/);
  });
});

describe("a missing ETag", () => {
  it("is reported as configuration, not as a flaky connection", async () => {
    const failure = await failureOf(
      async () => ({ eTag: null }), // R2 CORS not exposing ETag
      48 * MB,
    );

    expect(failure.detail.reason).toBe("config");
  });
});

describe("status reporting", () => {
  it("tells the admin a retry is happening", async () => {
    const statuses: string[] = [];
    let calls = 0;
    const put: PutFn = async ({ onProgress }) => {
      calls++;
      if (calls === 1) {
        onProgress?.(500);
        throw new NetworkInterruptedError(500);
      }
      return { eTag: "etag-1" };
    };

    await uploadAdminFile(
      {
        file: fakeFile(4 * MB),
        fileName: "sermon.mp4",
        onStatus: (status) => statuses.push(`${status.phase}: ${status.message}`),
      },
      put,
    );

    expect(statuses.some((s) => s.startsWith("retrying:"))).toBe(true);
    expect(statuses.some((s) => /Retrying the file/i.test(s))).toBe(true);
  });

  it("never reports progress above 100", async () => {
    const seen: number[] = [];
    const put: PutFn = async ({ onProgress }) => {
      onProgress?.(4 * MB);
      return { eTag: "etag-1" };
    };

    await uploadAdminFile(
      {
        file: fakeFile(4 * MB),
        fileName: "sermon.mp4",
        onProgress: (p) => seen.push(p),
      },
      put,
    );

    expect(Math.max(...seen)).toBe(100);
    expect(seen.every((p) => p >= 0 && p <= 100)).toBe(true);
  });
});
