import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";
import AppShell from "../components/AppShell";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getSiteSettings, toSocialLinks } from "../lib/site-settings";
import { getSiteUrl } from "../lib/site-url";
import {
  DEFAULT_SHARE_IMAGE,
  DEFAULT_SHARE_IMAGE_HEIGHT,
  DEFAULT_SHARE_IMAGE_WIDTH,
} from "../lib/share";
import { auth } from "../../auth";

// Drives `metadataBase`, which is what turns a site-relative OG image path
// into the absolute URL WhatsApp and X require. It must match the domain the
// site is actually served from, so it is read from the environment first.
const SITE_URL = getSiteUrl();
const SITE_NAME = "SAVEMI — Sabbath Vesper Ministry";
const SITE_DESCRIPTION =
  "Sabbath Vesper Ministry (SAVEMI) in Calabar, Nigeria, sharing biblical reflection on the seventh-day Sabbath through teaching, worship, and Reflection at Eventide.";

export const viewport: Viewport = {
  themeColor: "#063727",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | SAVEMI",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Sabbath",
    "Vesper Ministry",
    "SAVEMI",
    "biblical reflection",
    "seventh-day Sabbath",
    "Calabar Nigeria",
    "Christian ministry",
    "Reflection at Eventide",
  ],
  authors: [{ name: "Sabbath Vesper Ministry", url: SITE_URL }],
  creator: "Sabbath Vesper Ministry",
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_SHARE_IMAGE,
        width: DEFAULT_SHARE_IMAGE_WIDTH,
        height: DEFAULT_SHARE_IMAGE_HEIGHT,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_SHARE_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logo.jpg",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Owner-managed contact details and handles, resolved once per request and
  // shared by the navigation drawer and the footer.
  const settings = await getSiteSettings();
  const socialLinks = toSocialLinks(settings);
  const session = await auth();
  const account = session?.user
    ? {
        name: session.user.name ?? "My account",
        isAdmin: session.user.role === "admin",
      }
    : null;

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppShell
          header={<Navbar socialLinks={socialLinks} account={account} />}
          footer={<Footer settings={settings} socialLinks={socialLinks} />}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
