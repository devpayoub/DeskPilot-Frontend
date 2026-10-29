import Image from "next/image";
import Link from "next/link";

import { cn } from "cn";

import { APP_CONFIG } from "@/config/app-config";

/**
 * The mark ships as a PNG with the rounded-square silhouette baked in and
 * transparent corners, so it drops straight onto any background.
 *
 * It is ink-on-paper, which disappears on dark surfaces. `tone="onDark"` swaps in
 * the reversed file; the default follows the theme so the dashboard sidebar works
 * in both modes without the caller thinking about it.
 */
export function BrandMark({ className, tone = "auto" }: { className?: string; tone?: "auto" | "onDark" }) {
  const classes = cn("size-9 shrink-0", className);

  if (tone === "onDark") {
    return (
      <Image
        src="/brand-mark-inverse.png"
        alt=""
        unoptimized
        width={72}
        height={72}
        priority
        aria-hidden
        className={classes}
      />
    );
  }

  return (
    <>
      <Image
        src="/brand-mark.png"
        alt=""
        unoptimized
        width={72}
        height={72}
        priority
        aria-hidden
        className={cn(classes, "dark:hidden")}
      />
      <Image
        src="/brand-mark-inverse.png"
        alt=""
        unoptimized
        width={72}
        height={72}
        aria-hidden
        className={cn(classes, "hidden dark:block")}
      />
    </>
  );
}

export function BrandLockup({
  className,
  href = "/",
  subtitle,
  tone = "auto",
}: {
  className?: string;
  href?: string | null;
  subtitle?: string;
  tone?: "auto" | "onDark";
}) {
  const content = (
    <span className="flex items-center gap-2.5">
      <BrandMark tone={tone} />
      <span className="flex flex-col leading-none">
        <span className="font-semibold text-base tracking-tight">{APP_CONFIG.name}</span>
        {subtitle ? <span className="mt-1 text-muted-foreground text-xs">{subtitle}</span> : null}
      </span>
    </span>
  );

  if (!href) return <div className={className}>{content}</div>;

  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      {content}
    </Link>
  );
}
