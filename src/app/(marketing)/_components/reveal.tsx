import type { CSSProperties, ReactNode } from "react";

/**
 * Scroll reveal, in CSS.
 *
 * This was a `motion` `whileInView` component first, and it was the wrong tool:
 * every wrapped section sat at `opacity: 0` until an IntersectionObserver fired,
 * so anything that stopped the observer from firing — a headless render, a
 * hydration failure, an odd scroll container — produced a blank page instead of a
 * degraded one. A landing page cannot fail that way.
 *
 * `.reveal` in globals.css uses `animation-timeline: view()`, which the compositor
 * drives from scroll position. Where that is unsupported the content is simply
 * visible. No JavaScript, no observer, nothing to fail.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  /** 0–0.4. Shifted into the scroll range, which is what staggers a list. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "header";
}) {
  const shift = `${Math.round(Math.min(delay, 0.4) * 100)}%`;

  return (
    <Tag className={`reveal ${className ?? ""}`} style={{ "--reveal-shift": shift } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** The hairline rules between sections, revealed the same way. */
export function RevealRule({ delay = 0, className }: { delay?: number; className?: string }) {
  const shift = `${Math.round(Math.min(delay, 0.4) * 100)}%`;

  return (
    <div
      className={`reveal h-px bg-landing-hairline ${className ?? ""}`}
      style={{ "--reveal-shift": shift } as CSSProperties}
    />
  );
}
