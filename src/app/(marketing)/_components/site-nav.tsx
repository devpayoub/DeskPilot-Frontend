"use client";

import { useEffect, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "lucide-react";

import { APP_CONFIG } from "@/config/app-config";

const LINKS = [
  { href: "#safety", label: "Safety model" },
  { href: "#tools", label: "Tools" },
  { href: "#how", label: "How it works" },
  { href: "#proof", label: "Evidence" },
];

/**
 * The bar starts transparent over the hero wash and only earns its background once
 * the page has moved — a solid bar sitting on top of the hero looks like a mistake.
 */
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-landing-hairline border-b bg-landing-paper/80 backdrop-blur-xl"
          : "border-transparent border-b"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          {/* The ink mark, not <BrandMark tone="auto">: the landing stays light even
              when the dashboard preference is dark, so the reversed file would be
              white on white here. */}
          <Image src="/brand-mark.png" alt="" width={72} height={72} unoptimized className="size-7" aria-hidden />
          <span className="font-medium text-[15px] tracking-tight">{APP_CONFIG.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Sections">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-landing-muted-foreground text-sm transition-colors hover:text-landing-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="hidden text-landing-muted-foreground text-sm transition-colors hover:text-landing-foreground sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard/overview"
            className="group inline-flex items-center gap-1.5 rounded-full bg-landing-ink px-4 py-2 font-medium text-[13px] text-landing-paper transition-transform duration-200 hover:-translate-y-px"
          >
            Open console
            <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
