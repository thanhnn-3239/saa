import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

// No path arg: auto-detects ./i18n/request.ts. Works with Turbopack.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
