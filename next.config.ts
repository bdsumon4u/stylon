import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/products/:slug",
        destination: "/shop/:slug",
      },
    ];
  },

  images: {
    // Enable Next.js optimisation: serves AVIF → WebP → original.
    // `sharp` is already installed so the optimizer is active in production.
    formats: ["image/avif", "image/webp"],

    // Cache optimised images on disk for at least 24 h.
    minimumCacheTTL: 86400,

    // Responsive srcSet breakpoints.
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    remotePatterns: [
      { protocol: "http",  hostname: "localhost",  port: "8000", pathname: "/**" },
      { protocol: "http",  hostname: "127.0.0.1", port: "8000", pathname: "/**" },
      { protocol: "http",  hostname: "**.test",                  pathname: "/**" },
      // Allow all HTTPS origins (covers CDN / production API host).
      { protocol: "https", hostname: "**",                       pathname: "/**" },
    ],
  },

  async headers() {
    return [
      // Immutable cache for hashed Next.js static JS/CSS chunks.
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // 24-hour cache for optimised images with one-week SWR window.
      {
        source: "/_next/image(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      // Public static assets in /public — ico, images, fonts.
      // Next.js path-to-regexp does not allow capturing groups, so we match
      // by directory prefix rather than file extension.
      {
        source: "/:file(favicon.ico|robots.txt|sitemap.xml)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
