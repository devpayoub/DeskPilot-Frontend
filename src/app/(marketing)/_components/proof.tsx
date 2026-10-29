import { CheckIcon, XIcon } from "lucide-react";

import { Reveal, RevealRule } from "./reveal";

const STATS = [
  { value: "17", label: "typed tools", note: "no generic escape hatch" },
  { value: "10", label: "checks per call", note: "first failure denies" },
  { value: "282", label: "tests passing", note: "19 skipped without LDAP" },
  { value: "0", label: "shells", note: "there is no run_command" },
] as const;

/**
 * The claim that is hardest to believe, so it is shown rather than asserted: an
 * approval for one set of arguments cannot run a different set.
 *
 * Every number below is taken from the repository, not estimated. The README is
 * explicit that no model accuracy figure has been measured yet, so none is shown
 * here — a landing page that invents one would undermine the whole argument.
 */
export function Proof() {
  return (
    <section id="proof" className="border-landing-hairline border-t bg-landing-paper">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <p className="landing-mono text-[11px] text-landing-subtle uppercase tracking-[0.16em]">The approval</p>
              <h2 className="font-display mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] text-balance">
                Bound to the arguments, not to the tool.
              </h2>
              <p className="mt-5 max-w-md text-[14.5px] text-landing-muted-foreground leading-relaxed">
                The approval token <em>is</em> the hash of the validated arguments, and the comparison happens inside
                the chokepoint — not in the caller. Approving “clear{" "}
                <span className="landing-mono text-[13px]">user_temp</span>” cannot execute “clear{" "}
                <span className="landing-mono text-[13px]">windows_temp</span>”, and a buggy host cannot skip the check.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <ul className="mt-7 flex flex-col gap-2.5">
                {[
                  "Single use — a second execution needs a second decision.",
                  "Expires after thirty minutes.",
                  "The ticket’s own requester cannot sign off a destructive change.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[13.5px] text-landing-muted-foreground">
                    <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-landing-accent" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.06}>
            <div className="overflow-hidden rounded-2xl border border-landing-hairline bg-landing-paper shadow-[0_20px_50px_-30px_rgba(12,12,12,0.3)]">
              <div className="flex items-center gap-2 border-landing-hairline border-b bg-landing-muted/50 px-4 py-2.5">
                <span className="size-1.5 rounded-full bg-landing-subtle" />
                <span className="size-1.5 rounded-full bg-landing-subtle" />
                <span className="landing-mono ml-2 text-[10.5px] text-landing-subtle">approval ledger</span>
              </div>

              <div className="divide-y divide-landing-hairline">
                <div className="flex items-start gap-3 px-4 py-4">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckIcon className="size-3 text-emerald-600" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="landing-mono text-[12px]">clear_temp_files</span>
                      <span className="landing-mono text-[10px] text-landing-subtle">approved</span>
                    </div>
                    <div className="landing-mono mt-1 text-[11px] text-landing-muted-foreground">
                      {'{ "root": "user_temp" }'}
                    </div>
                    <div className="landing-mono mt-1 text-[10.5px] text-landing-subtle">hash 4a91c0f2…7b3d</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-landing-accent-tint/30 px-4 py-4">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-landing-accent/10">
                    <XIcon className="size-3 text-landing-accent" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="landing-mono text-[12px]">clear_temp_files</span>
                      <span className="landing-mono text-[10px] text-landing-accent">refused</span>
                    </div>
                    <div className="landing-mono mt-1 text-[11px] text-landing-muted-foreground">
                      {'{ "root": "windows_temp" }'}
                    </div>
                    <div className="landing-mono mt-1 text-[10.5px] text-landing-accent/80">
                      hash 7d02ab19…f4c8 · mismatch
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-landing-hairline border-t px-4 py-3">
                <p className="text-[11.5px] text-landing-muted-foreground">
                  The refusal is recorded too. Denials are the evidence that the guardrail worked.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <RevealRule className="mt-16" delay={0.1} />

        <div className="grid grid-cols-2 gap-8 pt-8 md:grid-cols-4">
          {STATS.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.06}>
              <div>
                <div className="font-display text-[clamp(2.2rem,4.4vw,3rem)] leading-none tabular-nums">
                  {stat.value}
                </div>
                <div className="mt-2 text-[13px]">{stat.label}</div>
                <div className="mt-0.5 text-[11.5px] text-landing-subtle">{stat.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
