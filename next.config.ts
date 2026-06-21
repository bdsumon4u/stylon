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
    // Enable Next.js optimisation: serves AVIF → WebP → original.
    // `sharp` is already installed so the optimizer is active in production.
    formats: ["image/avif", "image/webp"],

    // Cache optimised images on disk for at least 24 h.
    minimumCacheTTL: 86400,

    // Allowed quality values (must list every value used across the codebase).
    qualities: [75, 85],

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
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https: http://localhost:8000 http://127.0.0.1:8000;
      font-src 'self' data:;
      connect-src 'self' https://brain.kroymela.com https://www.kroymela.com https://kroymela.com https://static.cloudflareinsights.com http://localhost:8000 http://127.0.0.1:8000;
      frame-src https://www.youtube.com https://youtube.com;
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
