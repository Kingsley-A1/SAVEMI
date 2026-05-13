import { describe, it, expect } from "vitest";
import {
  validateUploadRequest,
  buildUploadObjectKey,
  getCompressionPlan,
} from "./media";

// ---------------------------------------------------------------------------
// P0-3 tests: media upload validation
// ---------------------------------------------------------------------------

describe("validateUploadRequest", () => {
  it("rejects null payload", () => {
    const result = validateUploadRequest(null);
    expect(result.success).toBe(false);
  });

  it("rejects missing fileName", () => {
    const result = validateUploadRequest({ contentType: "image/jpeg" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/fileName/i);
  });

  it("rejects missing contentType", () => {
    const result = validateUploadRequest({ fileName: "photo.jpg" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/contentType/i);
  });

  it("rejects unsupported MIME type", () => {
    const result = validateUploadRequest({
      fileName: "file.exe",
      contentType: "application/x-msdownload",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/unsupported/i);
  });

  it("rejects oversized image (> 15 MB)", () => {
    const result = validateUploadRequest({
      fileName: "big.jpg",
      contentType: "image/jpeg",
      contentLength: 20 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/15MB/i);
  });

  it("accepts valid image upload within size limit", () => {
    const result = validateUploadRequest({
      fileName: "cover.jpg",
      contentType: "image/jpeg",
      contentLength: 2 * 1024 * 1024,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mediaKind).toBe("image");
      expect(result.data.contentType).toBe("image/jpeg");
    }
  });

  it("accepts valid video upload", () => {
    const result = validateUploadRequest({
      fileName: "sermon.mp4",
      contentType: "video/mp4",
      contentLength: 100 * 1024 * 1024,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mediaKind).toBe("video");
  });

  it("accepts valid audio upload", () => {
    const result = validateUploadRequest({
      fileName: "message.mp3",
      contentType: "audio/mpeg",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mediaKind).toBe("audio");
  });

  it("rejects oversized video (> 500 MB)", () => {
    const result = validateUploadRequest({
      fileName: "huge.mp4",
      contentType: "video/mp4",
      contentLength: 600 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/500MB/i);
  });

  it("sanitizes fileName in successful response", () => {
    const result = validateUploadRequest({
      fileName: "MY Photo (2).JPG",
      contentType: "image/jpeg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fileName).not.toContain(" ");
      expect(result.data.fileName).not.toContain("(");
    }
  });
});

describe("buildUploadObjectKey", () => {
  it("includes mediaKind as a path prefix", () => {
    const key = buildUploadObjectKey({ fileName: "cover.jpg", mediaKind: "image" });
    expect(key).toMatch(/^image\//);
  });

  it("includes the year and month segments", () => {
    const key = buildUploadObjectKey({ fileName: "video.mp4", mediaKind: "video" });
    const now = new Date();
    expect(key).toContain(String(now.getUTCFullYear()));
  });

  it("produces a unique key on each call", () => {
    const k1 = buildUploadObjectKey({ fileName: "x.jpg", mediaKind: "image" });
    const k2 = buildUploadObjectKey({ fileName: "x.jpg", mediaKind: "image" });
    expect(k1).not.toBe(k2);
  });
});

describe("getCompressionPlan", () => {
  it("returns a plan for video", () => {
    const plan = getCompressionPlan("video");
    expect(plan).not.toBeNull();
    expect(plan?.recommendedTool).toBe("FFmpeg");
  });

  it("returns a plan for image using sharp", () => {
    const plan = getCompressionPlan("image");
    expect(plan?.recommendedTool).toBe("sharp");
  });
});
