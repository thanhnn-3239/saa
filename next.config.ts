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
};

// No path arg: auto-detects ./i18n/request.ts. Works with Turbopack.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
