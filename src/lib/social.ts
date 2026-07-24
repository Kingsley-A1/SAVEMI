/**
 * Env-driven social handles for SAVEMI.
 *
 * Handles are configured by the admin through NEXT_PUBLIC_* environment
 * variables (set in Vercel / .env). Anything not configured simply doesn't
 * render — "what is missing is set by the admin".
 *
 * Because these are NEXT_PUBLIC_*, they are inlined at build time and are safe
 * to read in both server and client components.
 */

import type { SocialPlatform } from "../components/SocialIcons";

export interface SocialLink {
  platform: SocialPlatform;
  /** Platform name, e.g. "YouTube". */
  label: string;
  /** Absolute URL (or mailto:) the link points to. */
  href: string;
  /** Human-friendly handle/label shown next to the icon. */
  handle: string;
}

const DEFAULT_FACEBOOK_URL =
  "https://www.facebook.com/people/Sabbath-Vesper-Ministry/61586401769698/";

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Accept either a full wa.me/chat URL or a bare phone number. */
function normalizeWhatsApp(value: string): { href: string; handle: string } {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, "").replace(/^.*?(\d{6,})$/, "$1");
    return { href: trimmed, handle: digits ? `+${digits}` : "Chat on WhatsApp" };
  }
  const digits = trimmed.replace(/\D/g, "");
  return {
    href: `https://wa.me/${digits}`,
    handle: digits ? `+${digits}` : "Chat on WhatsApp",
  };
}

export function getSocialLinks(): SocialLink[] {
  const links: SocialLink[] = [];

  const facebook = clean(process.env.NEXT_PUBLIC_FACEBOOK_URL) || DEFAULT_FACEBOOK_URL;
  if (facebook) {
    links.push({
      platform: "facebook",
      label: "Facebook",
      href: facebook,
      handle:
        clean(process.env.NEXT_PUBLIC_FACEBOOK_HANDLE) ||
        "Sabbath Vesper Ministry",
    });
  }

  const youtube = clean(process.env.NEXT_PUBLIC_YOUTUBE_URL);
  if (youtube) {
    links.push({
      platform: "youtube",
      label: "YouTube",
      href: youtube,
      handle: clean(process.env.NEXT_PUBLIC_YOUTUBE_HANDLE) || "YouTube channel",
    });
  }

  const whatsapp = clean(process.env.NEXT_PUBLIC_WHATSAPP_URL);
  if (whatsapp) {
    const { href, handle } = normalizeWhatsApp(whatsapp);
    links.push({ platform: "whatsapp", label: "WhatsApp", href, handle });
  }

  const instagram = clean(process.env.NEXT_PUBLIC_INSTAGRAM_URL);
  if (instagram) {
    links.push({
      platform: "instagram",
      label: "Instagram",
      href: instagram,
      handle:
        clean(process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE) || "Instagram",
    });
  }

  const email = clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
  if (email) {
    links.push({
      platform: "email",
      label: "Email",
      href: `mailto:${email}`,
      handle: email,
    });
  }

  return links;
}

/** True when at least one social handle is configured. */
export function hasSocialLinks(): boolean {
  return getSocialLinks().length > 0;
}
