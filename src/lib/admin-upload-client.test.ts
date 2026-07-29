import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  NetworkInterruptedError,
  StorageBlockedError,
  uploadAdminFile,
  type PutFn,
} from "./admin-upload-client";

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
    const put: PutFn = async ({ onProgress }) => {
      onProgress?.(400_000);
      throw new NetworkInterruptedError(400_000);
    };

    await expect(
      uploadAdminFile({ file: fakeFile(4 * MB), fileName: "sermon.mp4" }, put),
    ).rejects.toBeInstanceOf(NetworkInterruptedError);
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
    const put: PutFn = async ({ url, onProgress }) => {
      if (url.endsWith("/part/1")) return { eTag: "etag-1" };
      // Every later attempt is refused outright — but part 1 proved the
      // origin is allowed, so this must not be reported as blocked.
      onProgress?.(0);
      throw new NetworkInterruptedError(0);
    };

    await expect(
      uploadAdminFile({ file: fakeFile(48 * MB), fileName: "sermon.mp4" }, put),
    ).rejects.not.toBeInstanceOf(StorageBlockedError);
  });
});

describe("a request refused before any data is sent", () => {
  it("is reported as a blocked origin after retries are spent", async () => {
    const put: PutFn = async () => {
      // Zero bytes, every time: the CORS-preflight signature.
      throw new NetworkInterruptedError(0);
    };

    const error = await uploadAdminFile(
      { file: fakeFile(4 * MB), fileName: "sermon.mp4" },
      put,
    ).catch((caught) => caught);

    expect(error).toBeInstanceOf(StorageBlockedError);
    expect(String(error.message)).toMatch(/allowed origins/i);
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
