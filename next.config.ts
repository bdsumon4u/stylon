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
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https: http://localhost:8000 http://127.0.0.1:8000 https://www.googletagmanager.com https://www.facebook.com https://connect.facebook.net;
      font-src 'self' data:;
      connect-src 'self' https://brain.kroymela.com https://www.kroymela.com https://kroymela.com https://static.cloudflareinsights.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com http://localhost:8000 http://127.0.0.1:8000;
      frame-src https://www.youtube.com https://youtube.com https://www.googletagmanager.com https://www.facebook.com;
      object-src 'none';
      frame-ancestors 'none';
    `.replace(/\s{2,}/g, " ").trim();

    return [
      // Security Headers
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
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
