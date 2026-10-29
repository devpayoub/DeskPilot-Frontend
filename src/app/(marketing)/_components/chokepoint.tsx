import { Reveal } from "./reveal";

const CHECKS = [
  { title: "Kill switch — halted", body: "Refuses anything, before a single lookup happens." },
  { title: "Registry lookup", body: "Tools that do not exist." },
  { title: "Policy", body: "Tools an administrator has disabled." },
  {
    title: "Kill switch — paused",
    body: "Writes only. Reads keep working, so diagnostics stay available during an incident.",
  },
  { title: "Role authorisation", body: "Callers below the tool’s declared allowed_roles." },
  { title: "Schema validation", body: "Wrong types, unknown fields, out-of-range values." },
  {
    title: "Tool guard",
    body: "Requests no approval could ever authorise — privileged groups are a hard deny.",
  },
  {
    title: "Approval gate",
    body: "Writes without a matching, unspent approval bound to these exact arguments.",
    accent: true,
  },
  {
    title: "Execution + verification",
    body: "A write that cannot be verified is reported as a failure, not a success.",
  },
  { title: "Audit", body: "Always runs, in a finally — including every refusal above." },
] as const;

/**
 * The differentiator, so it gets the plainest possible treatment: a numbered list
 * read top to bottom, not a diagram. The accent on the approval gate is the only
 * colour on the page that is not a link, because it is the only step that needs a
 * human.
 */
export function Chokepoint() {
  return (
    <section id="safety" className="border-landing-hairline border-t bg-landing-paper">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="landing-mono text-[11px] text-landing-subtle uppercase tracking-[0.16em]">The safety model</p>
            <h2 className="font-display mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] text-balance">
              One chokepoint. Ten checks.
              <span className="block text-landing-muted-foreground italic">The first failure denies.</span>
            </h2>
            <p className="mt-5 max-w-sm text-[14.5px] text-landing-muted-foreground leading-relaxed">
              Every invocation — the agent, an MCP client, a person using the API — passes through the same function.
              The model never gets a shell, never gets a generic “run this” primitive, and never sees a credential.
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="mt-8 rounded-xl border border-landing-hairline bg-landing-muted/60 p-4">
              <p className="text-[13px] leading-relaxed">
                <span className="font-medium">Fail closed.</span>{" "}
                <span className="text-landing-muted-foreground">
                  {
                    "If the kill switch or the policy lookup raises, the call is denied. A guardrail that degrades to “no policy” is not a guardrail."
                  }
                </span>
              </p>
            </div>
          </Reveal>
        </div>

        <ol className="relative">
          {CHECKS.map((check, index) => {
            const isAccent = "accent" in check && check.accent;

            return (
              <li key={check.title} className="border-landing-hairline border-b">
                <Reveal delay={Math.min(index * 0.05, 0.35)}>
                  <div className={`flex gap-4 py-4 ${isAccent ? "bg-landing-accent-tint/40" : ""}`}>
                    <span className="landing-mono w-6 shrink-0 pt-0.5 text-[11px] text-landing-subtle tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[14px]">
                        {check.title}
                        {isAccent ? (
                          <span className="landing-mono rounded-full bg-landing-paper px-2 py-0.5 text-[9.5px] text-landing-accent uppercase tracking-wider">
                            human
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-[13px] text-landing-muted-foreground leading-relaxed">{check.body}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
