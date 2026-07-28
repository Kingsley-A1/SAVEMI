/**
 * Owner-editable site settings — contact details and social handles.
 *
 * Values live in the `SiteSetting` table so the ministry can change them from
 * the admin office without a redeploy. Anything left blank falls back to the
 * matching environment variable, so an existing deployment keeps working
 * exactly as configured until the owner saves something in Admin → Settings.
 */

import { isDatabaseConfigured, prisma } from "./db";
import type { SocialLink } from "./social";

export type { SocialLink };

export interface SiteSettings {
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
  facebookUrl: string;
  facebookHandle: string;
  youtubeUrl: string;
  youtubeHandle: string;
  instagramUrl: string;
  instagramHandle: string;
  telegramUrl: string;
}

export type SiteSettingKey = keyof SiteSettings;

export const SITE_SETTING_KEYS: readonly SiteSettingKey[] = [
  "contactEmail",
  "contactPhone",
  "whatsappNumber",
  "address",
  "facebookUrl",
  "facebookHandle",
  "youtubeUrl",
  "youtubeHandle",
  "instagramUrl",
  "instagramHandle",
  "telegramUrl",
];

const DEFAULT_FACEBOOK_URL =
  "https://www.facebook.com/people/Sabbath-Vesper-Ministry/61586401769698/";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/** Environment-provided values, used whenever a setting has not been saved. */
function envDefaults(): SiteSettings {
  return {
    contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL"),
    contactPhone: env("NEXT_PUBLIC_CONTACT_PHONE"),
    whatsappNumber: env("NEXT_PUBLIC_WHATSAPP_URL"),
    address: env("NEXT_PUBLIC_CONTACT_ADDRESS") || "Calabar, Nigeria",
    facebookUrl: env("NEXT_PUBLIC_FACEBOOK_URL") || DEFAULT_FACEBOOK_URL,
    facebookHandle:
      env("NEXT_PUBLIC_FACEBOOK_HANDLE") || "Sabbath Vesper Ministry",
    youtubeUrl: env("NEXT_PUBLIC_YOUTUBE_URL"),
    youtubeHandle: env("NEXT_PUBLIC_YOUTUBE_HANDLE"),
    instagramUrl: env("NEXT_PUBLIC_INSTAGRAM_URL"),
    instagramHandle: env("NEXT_PUBLIC_INSTAGRAM_HANDLE"),
    telegramUrl: env("NEXT_PUBLIC_TELEGRAM_URL"),
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const settings = envDefaults();

  if (!isDatabaseConfigured()) {
    return settings;
  }

  try {
    const rows = await prisma.siteSetting.findMany();

    for (const row of rows) {
      const key = row.key as SiteSettingKey;
      const value = row.value?.trim();
      if (value && SITE_SETTING_KEYS.includes(key)) {
        settings[key] = value;
      }
    }
  } catch {
    // A settings outage must never take the public site down.
  }

  return settings;
}

export async function saveSiteSettings(
  values: Partial<Record<SiteSettingKey, string>>,
  updatedBy?: string,
): Promise<void> {
  const entries = SITE_SETTING_KEYS.filter((key) => key in values).map((key) => ({
    key,
    value: (values[key] ?? "").trim(),
  }));

  await Promise.all(
    entries.map(({ key, value }) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value, updatedBy: updatedBy ?? null },
        update: { value, updatedBy: updatedBy ?? null },
      }),
    ),
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Derived views
   ──────────────────────────────────────────────────────────────────────── */

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

/** Build the public social list from settings. Blank handles simply vanish. */
export function toSocialLinks(settings: SiteSettings): SocialLink[] {
  const links: SocialLink[] = [];

  if (settings.facebookUrl) {
    links.push({
      platform: "facebook",
      label: "Facebook",
      href: settings.facebookUrl,
      handle: settings.facebookHandle || "Sabbath Vesper Ministry",
    });
  }

  if (settings.youtubeUrl) {
    links.push({
      platform: "youtube",
      label: "YouTube",
      href: settings.youtubeUrl,
      handle: settings.youtubeHandle || "YouTube channel",
    });
  }

  if (settings.whatsappNumber) {
    const { href, handle } = normalizeWhatsApp(settings.whatsappNumber);
    links.push({ platform: "whatsapp", label: "WhatsApp", href, handle });
  }

  if (settings.instagramUrl) {
    links.push({
      platform: "instagram",
      label: "Instagram",
      href: settings.instagramUrl,
      handle: settings.instagramHandle || "Instagram",
    });
  }

  if (settings.contactEmail) {
    links.push({
      platform: "email",
      label: "Email",
      href: `mailto:${settings.contactEmail}`,
      handle: settings.contactEmail,
    });
  }

  return links;
}

export async function getPublicSocialLinks(): Promise<SocialLink[]> {
  return toSocialLinks(await getSiteSettings());
}
