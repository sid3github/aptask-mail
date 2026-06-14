import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

// Display: characterful optical serif for headings & wordmark moments.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

// UI/body: clean, warm grotesque — distinctive without shouting.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InboxIQ — AI-first universal email",
  description:
    "Gmail, Outlook, and IMAP in a single AI-triaged inbox. Built with Claude Code.",
  manifest: "/manifest.webmanifest",
  applicationName: "InboxIQ",
  appleWebApp: {
    title: "InboxIQ",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-fg">{children}</body>
    </html>
  );
}
