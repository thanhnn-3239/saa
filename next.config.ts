import "./lib/env"; // Fail-fast env validation at build/dev start.
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    // Avatar hosts: seed/demo avatars (pravatar) + Google account photos (real users).
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Permanent redirect from the old Vietnamese route to the canonical English path.
  // Runs before any rendering — cheapest possible redirect mechanism.
  // Kept so any bookmarks, external links, or cached redirects pointing to the
  // previous /he-thong-giai path keep working.
  async redirects() {
    return [
      {
        source: "/he-thong-giai",
        destination: "/awards-information",
        permanent: true,
      },
    ];
  },
};

// No path arg: auto-detects ./i18n/request.ts. Works with Turbopack.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
