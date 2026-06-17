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
    // (`static` is left at its default — Next rejects values below 30.)
    staleTimes: { dynamic: 0 },
  },
  // jsdom backs server-side DOMPurify HTML sanitization; keep it (and the other
  // heavy server-only deps) out of the webpack bundle.
  serverExternalPackages: ["imapflow", "mailparser", "nodemailer", "jsdom"],
  // Conservative security headers applied to every route. Note: we deliberately
  // do NOT set a Content-Security-Policy here. Next.js injects inline styles and
  // bootstrap scripts (and our sanitized email HTML renders inline styles too),
  // so a strict CSP would require nonces/hashes across the whole app and would
  // break those. DOMPurify already sanitizes untrusted email HTML server-side,
  // which is our primary XSS defense. CSP can be layered in later with nonces.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
