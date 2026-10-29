import { Reveal, RevealRule } from "./reveal";

const STEPS = [
  {
    n: "01",
    title: "A ticket arrives",
    body: "Subject, body, and the host it concerns. The requester is a real foreign key, not an email string — which is what lets the self-approval guard work at all.",
  },
  {
    n: "02",
    title: "The agent investigates",
    body: "It decides which of the seventeen tools to call and when it has enough evidence. The loop is bounded by iterations, tool calls, wall-clock time and cost — not by hope.",
  },
  {
    n: "03",
    title: "A human decides",
    body: "A proposed write pauses with a dry-run preview. The approval is bound to the hash of the exact arguments, is single use, and expires in thirty minutes.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="border-landing-hairline border-t bg-landing-muted/30">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
        <Reveal>
          <p className="landing-mono text-[11px] text-landing-subtle uppercase tracking-[0.16em]">How it works</p>
          <h2 className="font-display mt-4 max-w-2xl text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] text-balance">
            Three steps, and the third one is a person.
          </h2>
        </Reveal>

        <RevealRule className="mt-10" delay={0.1} />

        <div className="grid gap-10 pt-8 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, index) => (
            <Reveal key={step.n} delay={index * 0.08}>
              <div className="flex flex-col">
                <span className="font-display text-[clamp(2.5rem,5vw,3.5rem)] text-landing-subtle/60 leading-none">
                  {step.n}
                </span>
                <h3 className="mt-4 text-[16px]">{step.title}</h3>
                <p className="mt-2 text-[13.5px] text-landing-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
