import { describe, expect, it } from "vitest";
import { getVideoThumbnailUrl, parseYouTubeId } from "./embed";

describe("getVideoThumbnailUrl", () => {
  it("uses YouTube's own thumbnail for every common link shape", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=abc123",
      "https://youtu.be/abc123",
      "https://www.youtube.com/embed/abc123",
      "https://www.youtube.com/shorts/abc123",
      "https://m.youtube.com/watch?v=abc123",
    ]) {
      expect(getVideoThumbnailUrl(url)).toBe(
        "https://i.ytimg.com/vi/abc123/hqdefault.jpg",
      );
    }
  });

  it("returns null where no public thumbnail exists", () => {
    expect(getVideoThumbnailUrl("https://www.facebook.com/x/videos/1")).toBeNull();
    expect(getVideoThumbnailUrl("https://media.example.org/v.mp4")).toBeNull();
    expect(getVideoThumbnailUrl(null)).toBeNull();
  });

  it("parses live links", () => {
    expect(parseYouTubeId("https://www.youtube.com/live/xyz")).toBe("xyz");
  });
});
