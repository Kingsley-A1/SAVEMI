import type { NextConfig } from "next";

// Derive the media host from CF_PUBLIC_BASE_URL (e.g. media.savemionline.org)
// so next/image is allowed to optimize assets served from the R2 custom domain.
function getMediaHost(): string | null {
  const raw = process.env.CF_PUBLIC_BASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const mediaHost = getMediaHost();

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/messages",
        destination: "/videos",
        permanent: true,
      },
    ];
  },

  images: {
    // Allow next/image to serve images from Cloudflare R2 public buckets.
    // Add any additional hostnames here if the bucket domain changes.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-9784e0975c94434bb2727e5ca4401322.r2.dev",
        pathname: "/**",
      },
      // Env-driven media subdomain (e.g. media.savemionline.org via R2 custom domain)
      ...(mediaHost
        ? [
            {
              protocol: "https" as const,
              hostname: mediaHost,
              pathname: "/**",
            },
          ]
        : []),
      // Any savemionline.org subdomain (media, images, cdn…)
      {
        protocol: "https",
        hostname: "*.savemionline.org",
        pathname: "/**",
      },
      // Wildcard for custom R2 domains (e.g. images.savemi.org)
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      // Allow any HTTPS image source for admin-pasted cover image URLs
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
    // Reasonable quality/format defaults for a ministry site
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },

  // Ensure trailing slashes are handled consistently
  trailingSlash: false,

};

export default nextConfig;
