/**
 * Environment-configured social handles for SAVEMI.
 *
 * This is the fallback layer. The handles the ministry actually manages live
 * in Admin → Site Settings and are read through `lib/site-settings`; these
 * NEXT_PUBLIC_* values fill in for any setting that has not been saved.
 *
 * Because these are NEXT_PUBLIC_*, they are inlined at build time and are safe
 * to read in both server and client components — which is why this synchronous
 * version exists alongside the database-backed one.
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

/** True when at least one social handle is configured in the environment. */
export function hasSocialLinks(): boolean {
  return getSocialLinks().length > 0;
}

/** Environment-configured contact email, used as the settings fallback. */
export function getContactEmail(): string {
  return clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
}
