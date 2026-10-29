import { Fragment } from "react";

import Link from "next/link";

import { ArrowRightIcon, CheckIcon, LockIcon, PauseIcon } from "lucide-react";

type Word = { text: string; accent?: boolean };

const HEADLINE: Word[][] = [
  [{ text: "The" }, { text: "IT" }, { text: "agent" }, { text: "that" }],
  [{ text: "can’t", accent: true }, { text: "break" }, { text: "anything." }],
];

/**
 * Masked word reveal.
 *
 * Each word sits in its own `overflow-hidden` box and the inner span runs
 * `.animate-char-in`, so the blur-and-rise reads as type being set rather than a
 * block of text fading in. Pure CSS — the hero is above the fold, so there is
 * nothing to wait for and no reason to ship JavaScript for it.
 */
function Headline({ lines }: { lines: Word[][] }) {
  let index = 0;

  return (
    <>
      {lines.map((line) => (
        <span key={line.map((word) => word.text).join(" ")} className="block">
          {line.map((word) => {
            const delay = index * 62;
            index += 1;

            // The space lives outside the masked box: inside it, `overflow-hidden`
            // would clip it to nothing and the words would run together.
            return (
              <Fragment key={`${word.text}-${delay}`}>
                <span className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                  <span
                    className={`animate-char-in inline-block ${word.accent ? "text-landing-accent italic" : ""}`}
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    {word.text}
                  </span>
                </span>{" "}
              </Fragment>
            );
          })}
        </span>
      ))}
    </>
  );
}

const STEPS = [
  { tool: "get_system_health", risk: "read", state: "ok" },
  { tool: "list_services", risk: "read", state: "ok" },
  { tool: "read_event_log", risk: "read", state: "ok" },
  { tool: "restart_service", risk: "reversible", state: "held" },
] as const;

export function Hero() {
  return (
    <section className="landing-sky noise-overlay relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-6 pt-16 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pt-24 lg:pb-32">
        <div className="relative z-10">
          <div
            className="animate-char-in inline-flex items-center gap-2 rounded-full border border-landing-hairline bg-landing-paper/70 px-3 py-1.5 text-[12px] backdrop-blur"
            style={{ animationDelay: "0ms" }}
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-landing-accent opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-landing-accent" />
            </span>
            <span className="text-landing-muted-foreground">Guardrailed IT agent</span>
          </div>

          <h1 className="font-display mt-6 text-[clamp(2.6rem,6.2vw,4.4rem)] leading-[0.98] text-balance">
            <Headline lines={HEADLINE} />
          </h1>

          <p
            className="animate-char-in mt-6 max-w-xl text-[15px] text-landing-muted-foreground leading-relaxed"
            style={{ animationDelay: "520ms" }}
          >
            DeskPilot reads the ticket, inspects the real Windows host with read-only diagnostics, and proposes a fix.
            Every write stops at a human approval bound to the exact arguments that were reviewed.
          </p>

          <div className="animate-char-in mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "620ms" }}>
            <Link
              href="/dashboard/overview"
              className="group inline-flex items-center gap-2 rounded-full bg-landing-ink px-5 py-2.5 font-medium text-[13px] text-landing-paper transition-transform duration-200 hover:-translate-y-px"
            >
              Open the console
              <ArrowRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#safety"
              className="inline-flex items-center gap-2 rounded-full border border-landing-hairline bg-landing-paper/60 px-5 py-2.5 font-medium text-[13px] transition-colors hover:bg-landing-muted"
            >
              See the safety model
            </a>
          </div>

          <p
            className="animate-char-in landing-mono mt-7 text-[11px] text-landing-subtle uppercase tracking-[0.14em]"
            style={{ animationDelay: "720ms" }}
          >
            17 typed tools · no shell · no run_command
          </p>
        </div>

        {/* The product, not a screenshot of it. Every value below is a real shape
            the API returns. */}
        <div className="relative z-10">
          <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-landing-accent-tint/70 blur-2xl" />

          <div className="relative overflow-hidden rounded-2xl border border-landing-hairline bg-landing-paper shadow-[0_24px_60px_-28px_rgba(12,12,12,0.28)]">
            <div className="flex flex-col gap-1.5 border-landing-hairline border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-baseline gap-2">
                <span className="landing-mono shrink-0 whitespace-nowrap text-[11px] text-landing-subtle">
                  T-000412
                </span>
                <span className="text-[13px] leading-snug">Finance printer shows offline</span>
              </div>
              <span className="w-fit whitespace-nowrap rounded-full bg-landing-accent-tint px-2 py-0.5 text-[10px] text-landing-accent">
                awaiting approval
              </span>
            </div>

            <div className="divide-y divide-landing-hairline">
              {STEPS.map((step, i) => (
                <div
                  key={step.tool}
                  className="code-line-reveal flex items-center gap-3 px-4 py-2.5"
                  style={{ animationDelay: `${420 + i * 110}ms` }}
                >
                  <span
                    className={`flex size-4 items-center justify-center rounded-full ${
                      step.state === "held" ? "bg-landing-accent-tint" : "bg-landing-muted"
                    }`}
                  >
                    {step.state === "held" ? (
                      <PauseIcon className="size-2.5 text-landing-accent" />
                    ) : (
                      <CheckIcon className="size-2.5 text-landing-muted-foreground" />
                    )}
                  </span>
                  <span className="landing-mono flex-1 text-[12px]">{step.tool}</span>
                  <span className="landing-mono text-[10px] text-landing-subtle uppercase tracking-wider">
                    {step.risk}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="code-line-reveal border-landing-hairline border-t bg-landing-muted/50 px-4 py-3.5"
              style={{ animationDelay: "880ms" }}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="landing-mono text-[10px] text-landing-subtle uppercase tracking-wider">args</span>
                <span className="landing-mono text-[11.5px]">{'{ "name": "Spooler" }'}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="landing-mono text-[10px] text-landing-subtle uppercase tracking-wider">bound to</span>
                <span className="landing-mono text-[11.5px] text-landing-muted-foreground">9f2c41d7…8e1b</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-landing-ink px-3 py-1.5 text-[11px] text-landing-paper">
                  <CheckIcon className="size-3" />
                  Approve and run
                </span>
                <span className="inline-flex items-center rounded-full border border-landing-hairline px-3 py-1.5 text-[11px] text-landing-muted-foreground">
                  Reject
                </span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-landing-subtle">
                  <LockIcon className="size-2.5" />
                  single use
                </span>
              </div>
            </div>
          </div>

          <div className="code-char-reveal mt-3 flex justify-end" style={{ animationDelay: "1120ms" }}>
            <span className="landing-mono rounded-full border border-landing-hairline bg-landing-paper px-3 py-1.5 text-[10.5px] shadow-sm">
              run_command <span className="font-medium text-landing-accent">· no such tool</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
