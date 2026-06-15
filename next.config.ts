import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Hide the dev-only overlay badge — it floats over the bottom-left mobile nav.
  devIndicators: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
    // Always refetch dynamic routes on client navigation so switching folders
    // (?label=) shows fresh data immediately instead of a cached payload.
    staleTimes: { dynamic: 0, static: 0 },
  },
  serverExternalPackages: ["imapflow", "mailparser", "nodemailer"],
};

export default withSerwist(nextConfig);
