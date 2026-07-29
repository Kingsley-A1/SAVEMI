import { describe, it, expect } from "vitest";
import {
  DEFAULT_SHARE_IMAGE,
  buildShareMetadata,
  toPreviewText,
} from "./share";

const COVER = "https://media.savemionline.org/image/2026/07/uuid-cover.jpg";

function firstImage(meta: ReturnType<typeof buildShareMetadata>) {
  const images = meta.openGraph?.images;
  return Array.isArray(images) ? images[0] : images;
}

describe("toPreviewText", () => {
  it("collapses whitespace", () => {
    expect(toPreviewText("Be still,\n\n  and know")).toBe("Be still, and know");
  });

  it("leaves short text alone", () => {
    expect(toPreviewText("A short summary")).toBe("A short summary");
  });

  it("truncates on a word boundary", () => {
    const result = toPreviewText("alpha bravo charlie delta echo", 18);
    expect(result).toBe("alpha bravo…");
    expect(result.length).toBeLessThanOrEqual(19);
  });
});

describe("buildShareMetadata", () => {
  const base = {
    title: "Walking in the Light",
    description: "A Sabbath reflection on living openly before God.",
    path: "/messages/walking-in-the-light",
  };

  it("uses the item's own cover as the preview image", () => {
    const meta = buildShareMetadata({ ...base, imageUrl: COVER });
    expect(firstImage(meta)).toMatchObject({ url: COVER });
    expect(meta.twitter?.images).toEqual([COVER]);
  });

  it("falls back to the ministry card when there is no cover", () => {
    const meta = buildShareMetadata(base);
    expect(firstImage(meta)).toMatchObject({
      url: DEFAULT_SHARE_IMAGE,
      width: 1200,
      height: 630,
    });
  });

  it("does not invent dimensions for an uploaded cover", () => {
    // A wrong width/height renders worse than none — scrapers measure it.
    const image = firstImage(buildShareMetadata({ ...base, imageUrl: COVER }));
    expect(image).not.toHaveProperty("width");
    expect(image).not.toHaveProperty("height");
  });

  it("requests the large card so WhatsApp and X show the cover full width", () => {
    const twitter = buildShareMetadata(base).twitter as
      | { card?: string }
      | undefined;
    expect(twitter?.card).toBe("summary_large_image");
  });

  it("carries the canonical path through to OpenGraph", () => {
    const meta = buildShareMetadata(base);
    expect(meta.alternates?.canonical).toBe(base.path);
    expect(meta.openGraph?.url).toBe(base.path);
  });

  it("titles the card for the ministry but leaves the page title clean", () => {
    const meta = buildShareMetadata(base);
    expect(meta.title).toBe("Walking in the Light");
    expect(meta.openGraph?.title).toBe("Walking in the Light | SAVEMI");
  });

  it("trims a long description for the preview card", () => {
    const meta = buildShareMetadata({ ...base, description: "word ".repeat(80) });
    expect(String(meta.description).length).toBeLessThanOrEqual(201);
    expect(meta.description).toMatch(/…$/);
  });

  it("defaults the image alt text to the title", () => {
    const image = firstImage(buildShareMetadata({ ...base, imageUrl: COVER }));
    expect(image).toMatchObject({ alt: base.title });
  });
});
