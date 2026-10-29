import type { ReactNode } from "react";

import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

import type { Metadata } from "next";

import { APP_CONFIG } from "@/config/app-config";

import { SiteFooter } from "./_components/site-footer";
import { SiteNav } from "./_components/site-nav";

/**
 * The landing page is light-only by design — `[data-landing-page]` in globals.css
 * pins the ink/paper palette so a saved dashboard theme cannot restyle it. That is
 * also why the two fonts are loaded here rather than in the global registry: the
 * dashboard never pays for them.
 */
const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  // `absolute` so the root template does not append "· DeskPilot" to a title that
  // already contains the product name.
  title: { absolute: "DeskPilot — the IT agent that can’t break anything" },
  description:
    "DeskPilot reads a support ticket, inspects the real Windows host with read-only diagnostics, and proposes a fix. Every write waits behind a human approval bound to the exact arguments that were reviewed.",
  openGraph: {
    title: "DeskPilot — the IT agent that can’t break anything",
    description:
      "An IT helpdesk agent with a chokepoint: 17 typed tools, no shell, no run_command, and a human approval on every write.",
    siteName: APP_CONFIG.name,
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-landing-page
      className={`${instrumentSans.variable} ${jetbrainsMono.variable} flex min-h-screen flex-col`}
    >
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
