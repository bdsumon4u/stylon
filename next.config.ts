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
    // Disable image optimization to avoid issues with local/private IP backend images
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**.test",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
