import type { NextConfig } from "next";

// Images uploaded through the CMS are served from the Supabase project's public Storage.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  // Pin the project root: a parent folder may contain another lockfile.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  poweredByHeader: false,
  // Local development database (CMS_LOCAL=1); never loaded in production.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Dashboard forms send whole documents (article bodies) to Server Actions.
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // YouTube thumbnails (videos without their own thumbnail).
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      ...(supabaseHost ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }] : []),
    ],
  },
  async headers() {
    return [
      {
        // The dashboard is never indexed or framed by other sites.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
