import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "../styles/globals.css";
import AppShell from "../components/AppShell";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SITE_URL = "https://savemi.org";
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
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "SAVEMI — Sabbath Vesper Ministry",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/images/og-default.jpg"],
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
    apple: "/images/logo.jpg",
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppShell header={<Navbar />} footer={<Footer />}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
