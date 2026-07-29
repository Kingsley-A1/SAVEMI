/**
 * Link-preview metadata — the card WhatsApp, X, Facebook, and iMessage draw
 * when someone shares a SAVEMI page.
 *
 * One helper builds it for every shareable item so a message, a book, and a
 * quote all preview the same way: the item's own cover image, its title, and
 * a short line of description.
 *
 * Notes that matter in practice:
 *  - The image must be an absolute URL. `metadataBase` in the root layout
 *    resolves site-relative paths, and R2 covers are already absolute.
 *  - WhatsApp only renders a large preview for `summary_large_image`, and it
 *    skips images much over ~300KB, so covers should be web-sized.
 *  - An item with no cover falls back to the ministry card rather than
 *    previewing with no image at all.
 */

import type { Metadata } from "next";

/** Ministry fallback card, used whenever an item has no cover of its own. */
export const DEFAULT_SHARE_IMAGE = "/images/og-default.jpg";
export const DEFAULT_SHARE_IMAGE_WIDTH = 1200;
export const DEFAULT_SHARE_IMAGE_HEIGHT = 630;

export interface ShareMetadataInput {
  title: string;
  description: string;
  /** Site-relative canonical path, e.g. "/messages/walking-in-the-light". */
  path: string;
  /** The item's cover. Absolute (R2) or site-relative both work. */
  imageUrl?: string | null;
  /** Alt text for the preview image. Defaults to the title. */
  imageAlt?: string;
  type?: "article" | "website";
}

/**
 * Trim a description to something a preview card will actually show, without
 * cutting a word in half.
 */
export function toPreviewText(value: string, max = 200): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;

  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Build the OpenGraph and Twitter blocks for a shareable page.
 *
 * Dimensions are declared only for the ministry fallback, whose size we know.
 * Uploaded covers are any shape, and a wrong width/height renders worse than
 * none at all — scrapers measure the file themselves.
 */
export function buildShareMetadata({
  title,
  description,
  path,
  imageUrl,
  imageAlt,
  type = "article",
}: ShareMetadataInput): Metadata {
  const summary = toPreviewText(description);
  const alt = imageAlt ?? title;
  const usingFallback = !imageUrl;

  const image = usingFallback
    ? {
        url: DEFAULT_SHARE_IMAGE,
        width: DEFAULT_SHARE_IMAGE_WIDTH,
        height: DEFAULT_SHARE_IMAGE_HEIGHT,
        alt,
      }
    : { url: imageUrl as string, alt };

  return {
    title,
    description: summary,
    openGraph: {
      title: `${title} | SAVEMI`,
      description: summary,
      type,
      url: path,
      siteName: "SAVEMI — Sabbath Vesper Ministry",
      images: [image],
    },
    twitter: {
      // Without this, X and WhatsApp render a small thumbnail instead of the
      // full-width card the cover deserves.
      card: "summary_large_image",
      title: `${title} | SAVEMI`,
      description: summary,
      images: [image.url],
    },
    alternates: { canonical: path },
  };
}
