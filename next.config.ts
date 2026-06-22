import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/products/:slug",
        destination: "/shop/:slug",
      },
      {
        source: "/categories/:slug/products",
        destination: "/shop?category%5B%5D=:slug",
      },
    ];
  },

  images: {
    // Disable Next.js image optimization to serve images as-is from the source.
    // This avoids the Vercel free plan image optimization limit and removes
    // the `/_next/image` re-encoding latency — images load directly from the
    // origin (which Laravel/CDN caches aggressively). Re-enable by removing
    // this flag and restoring the `formats`/`qualities` block below.
    unoptimized: true,

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
