import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

// D-13: Fraunces chosen for its optical-size (opsz) axis — it carries the big
// dollar numbers in the Phase 4 wow reveal, not just headlines.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Points Unlocked",
  description: "See what your credit card points are actually worth.",
  // D-03 noindex gate: keep the pre-launch site out of search indexes.
  // Removing this is an explicit Phase 7 launch-gate task.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      {/* Pitfall 1: every nuqs hook throws at runtime without the framework
          adapter wrapping the tree — this is the one required wrap for the
          URL-state balance flow (INPUT-03). */}
      <body className="flex min-h-full flex-col">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
