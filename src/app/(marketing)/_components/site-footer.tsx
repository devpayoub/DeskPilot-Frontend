import Link from "next/link";

import { ArrowRightIcon } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

import { Reveal } from "./reveal";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#safety", label: "Safety model" },
      { href: "#tools", label: "Tool catalog" },
      { href: "#how", label: "How it works" },
      { href: "#proof", label: "Evidence" },
    ],
  },
  {
    title: "Console",
    links: [
      { href: "/dashboard/overview", label: "Overview" },
      { href: "/dashboard/approvals", label: "Approvals" },
      { href: "/dashboard/audit", label: "Audit log" },
      { href: "/auth/login", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-landing-hairline border-t bg-landing-paper">
      <div className="mx-auto w-full max-w-6xl px-6 pt-20 pb-8">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 border-landing-hairline border-b pb-16 lg:flex-row lg:items-end">
            <div>
              <h2 className="font-display max-w-xl text-[clamp(2rem,4vw,3.2rem)] leading-[1.02] text-balance">
                Let the agent investigate.
                <span className="block text-landing-muted-foreground italic">Keep the last word.</span>
              </h2>
              <p className="mt-4 max-w-md text-[14px] text-landing-muted-foreground leading-relaxed">
                The console is running with a seeded tenant, a simulated host, and writes that cannot leave the box
                unless you deliberately turn both switches.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/overview"
                className="group inline-flex items-center gap-2 rounded-full bg-landing-ink px-5 py-2.5 font-medium text-[13px] text-landing-paper transition-transform duration-200 hover:-translate-y-px"
              >
                Open the console
                <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center rounded-full border border-landing-hairline px-5 py-2.5 font-medium text-[13px] transition-colors hover:bg-landing-muted"
              >
                Sign in
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <span className="font-medium text-[15px] tracking-tight">{APP_CONFIG.name}</span>
            <p className="mt-2 max-w-xs text-[12.5px] text-landing-muted-foreground leading-relaxed">
              An IT helpdesk agent that investigates real machines — and cannot change anything without a human saying
              so.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="landing-mono text-[10.5px] text-landing-subtle uppercase tracking-[0.16em]">
                {column.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-landing-muted-foreground transition-colors hover:text-landing-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-landing-hairline border-t pt-6 text-[11.5px] text-landing-subtle sm:flex-row sm:items-center sm:justify-between">
          <span>{APP_CONFIG.copyright}</span>
          <span>No license file included — source-available for review.</span>
        </div>
      </div>

      {/* The wordmark is decoration: masked to fade into the page edge, and hidden
          from assistive tech because the name is already announced above. */}
      <div className="landing-wordmark pointer-events-none overflow-hidden px-4" aria-hidden>
        <span className="font-display block text-center text-[clamp(4.5rem,20vw,15rem)] text-landing-ink leading-[0.78] tracking-[-0.04em]">
          DeskPilot
        </span>
      </div>
    </footer>
  );
}
