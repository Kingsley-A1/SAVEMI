/**
 * Embed URL detection and parsing utilities.
 *
 * Detects YouTube and Facebook video URLs and returns the appropriate
 * embed (iframe) src. For non-embeddable URLs, returns null so the
 * caller can fall back to a native player.
 */

/** Extract a YouTube video ID from common URL formats. */
export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    // youtube.com/watch?v=ID
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname === "/watch"
    ) {
      return u.searchParams.get("v");
    }
    // youtu.be/ID
    if (u.hostname === "youtu.be") {
      return u.pathname.slice(1) || null;
    }
    // youtube.com/embed/ID
    if (
      (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") &&
      u.pathname.startsWith("/embed/")
    ) {
      return u.pathname.split("/")[2] || null;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

/** Check if a URL is a Facebook video. */
export function isFacebookVideo(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.hostname === "www.facebook.com" ||
        u.hostname === "facebook.com" ||
        u.hostname === "fb.watch" ||
        u.hostname === "www.fb.watch") &&
      (u.pathname.includes("/videos/") ||
        u.pathname.includes("/watch/") ||
        u.pathname.includes("/reel/") ||
        u.hostname.includes("fb.watch"))
    );
  } catch {
    return false;
  }
}

/**
 * Given a media URL, returns embed info if it's an embeddable platform.
 * Returns null for direct file URLs (mp4, mp3, etc.)
 */
export function getEmbedInfo(url: string): {
  type: "youtube" | "facebook";
  embedSrc: string;
} | null {
  // YouTube
  const ytId = parseYouTubeId(url);
  if (ytId) {
    return {
      type: "youtube",
      embedSrc: `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`,
    };
  }

  // Facebook
  if (isFacebookVideo(url)) {
    return {
      type: "facebook",
      embedSrc: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`,
    };
  }

  return null;
}

/** Quick check: is this URL something we should try to embed? */
export function isEmbeddableUrl(url: string): boolean {
  return getEmbedInfo(url) !== null;
}

/** Quick check: is a string a valid URL (not an R2 key)? */
export function isExternalUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
}
