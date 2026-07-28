import { describe, it, expect } from "vitest";
import {
  buildDownloadFileName,
  contentDispositionAttachment,
  extensionFrom,
  toFileStem,
} from "./download";

describe("toFileStem", () => {
  it("kebab-cases a human title", () => {
    expect(toFileStem("Remember the Sabbath Day")).toBe(
      "remember-the-sabbath-day",
    );
  });

  it("strips punctuation and accents", () => {
    expect(toFileStem("Répose, Renewal & Restoration!")).toBe(
      "repose-renewal-restoration",
    );
  });

  it("falls back when a title has no usable characters", () => {
    expect(toFileStem("!!!")).toBe("savemi-download");
  });
});

describe("extensionFrom", () => {
  it("reads the extension off a storage key", () => {
    expect(extensionFrom("video/2026/07/8d70dccc-media.mp4")).toBe("mp4");
  });

  it("reads the extension off an absolute URL", () => {
    expect(
      extensionFrom("https://pub-abc.r2.dev/video/2026/07/uuid-clip.MOV"),
    ).toBe("mov");
  });

  it("returns empty when there is no extension", () => {
    expect(extensionFrom("video/2026/07/uuid-clip")).toBe("");
  });
});

describe("buildDownloadFileName", () => {
  it("names the file after the title, not the object id", () => {
    expect(
      buildDownloadFileName({
        title: "Walking in the Light",
        kind: "video",
        source:
          "video/2026/07/8d70dccc-0740-42ed-a9d3-22a1329d6bf6-message-media.mp4",
      }),
    ).toBe("walking-in-the-light.mp4");
  });

  it("marks a video message's companion audio track", () => {
    expect(
      buildDownloadFileName({
        title: "Walking in the Light",
        kind: "audio",
        source: "audio/2026/07/uuid-track.mp3",
        suffix: "audio",
      }),
    ).toBe("walking-in-the-light-audio.mp3");
  });

  it("recovers the extension from the content type", () => {
    expect(
      buildDownloadFileName({
        title: "Sabbath Rest",
        kind: "document",
        source: "document/2026/07/uuid-book",
        contentType: "application/pdf; charset=binary",
      }),
    ).toBe("sabbath-rest.pdf");
  });

  it("falls back to a sensible extension for the media kind", () => {
    expect(
      buildDownloadFileName({
        title: "Evening Psalm",
        kind: "audio",
        source: "audio/2026/07/uuid-track",
      }),
    ).toBe("evening-psalm.mp3");
  });
});

describe("contentDispositionAttachment", () => {
  it("always asks the browser to save the file", () => {
    expect(contentDispositionAttachment("sabbath-rest.pdf")).toContain(
      "attachment",
    );
  });

  it("carries an ASCII fallback alongside the UTF-8 name", () => {
    const header = contentDispositionAttachment("répose.pdf");
    expect(header).toContain('filename="r_pose.pdf"');
    expect(header).toContain("filename*=UTF-8''");
  });
});
