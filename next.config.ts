import type { NextConfig } from "next";

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
