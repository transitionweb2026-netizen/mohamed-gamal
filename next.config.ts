import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root: a parent folder may contain another lockfile.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // YouTube thumbnails, used once real video IDs are added in content/videos.ts.
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }],
  },
};

export default nextConfig;
