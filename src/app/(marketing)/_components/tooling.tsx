import { Reveal } from "./reveal";

const READ = [
  "get_system_health",
  "get_disk_health",
  "list_services",
  "read_event_log",
  "get_installed_software",
  "get_windows_update_status",
  "list_listening_ports",
  "test_connectivity",
  "lookup_user",
  "get_group_membership",
];

const REVERSIBLE = ["restart_service", "flush_dns_cache", "unlock_account", "add_group_member"];

const DESTRUCTIVE = ["clear_temp_files", "reset_password", "remove_group_member"];

const ALL = [...READ, ...REVERSIBLE, ...DESTRUCTIVE];

/** Duplicated list scrolling by exactly half its width — see `.marquee` in globals. */
function ToolMarquee() {
  return (
    <div className="border-landing-hairline border-y bg-landing-muted/40 py-4">
      <div
        className="overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="marquee flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center" aria-hidden={copy === 1}>
              {ALL.map((tool) => (
                <span key={`${copy}-${tool}`} className="landing-mono flex items-center text-[11.5px]">
                  <span className="px-5 text-landing-muted-foreground">{tool}</span>
                  <span className="size-1 rounded-full bg-landing-subtle" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolList({ tools }: { tools: string[] }) {
  return (
    <ul className="landing-mono mt-5 flex flex-col gap-2 text-[12px] text-landing-muted-foreground">
      {tools.map((tool) => (
        <li key={tool} className="flex items-center gap-3">
          <span>{tool}</span>
          <span className="h-px flex-1 bg-landing-hairline" />
        </li>
      ))}
    </ul>
  );
}

function ToolCard({
  risk,
  tools,
  title,
  body,
  footnote,
  accent = false,
}: {
  risk: string;
  tools: string[];
  title: string;
  body: string;
  footnote: string;
  accent?: boolean;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-landing-hairline bg-landing-paper p-6">
      <span
        className={`w-fit rounded-full px-2 py-0.5 text-[10.5px] uppercase tracking-wider ${
          accent ? "bg-landing-accent-tint text-landing-accent" : "bg-landing-muted text-landing-muted-foreground"
        }`}
      >
        {risk}
      </span>
      <h3 className="mt-3 text-[15px]">{title}</h3>
      <p className="mt-1.5 text-[13px] text-landing-muted-foreground leading-relaxed">{body}</p>

      <ToolList tools={tools} />

      {/* Pinned to the bottom so the three cards read as a set even though their
          lists are 10, 4 and 3 rows long. */}
      <div className="mt-auto flex items-center justify-between gap-3 border-landing-hairline border-t pt-3 text-[11px] text-landing-subtle">
        <span className="landing-mono">{tools.length} of 17</span>
        <span>{footnote}</span>
      </div>
    </div>
  );
}

export function Tooling() {
  return (
    <>
      <ToolMarquee />

      <section id="tools" className="bg-landing-paper">
        <div className="mx-auto w-full max-w-6xl px-6 py-20 lg:py-28">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="landing-mono text-[11px] text-landing-subtle uppercase tracking-[0.16em]">
                  The tool catalog
                </p>
                <h2 className="font-display mt-4 max-w-xl text-[clamp(2rem,3.6vw,3rem)] leading-[1.02] text-balance">
                  Seventeen things it can do. None of them is “run this”.
                </h2>
              </div>
              <p className="max-w-xs text-[13.5px] text-landing-muted-foreground leading-relaxed">
                Risk is declared in code, not configured at runtime. Policy may raise a tool’s risk class, never lower
                it.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Reveal className="h-full" delay={0}>
              <ToolCard
                risk="read"
                tools={READ}
                title="Diagnostics, never side effects"
                body="No approval needed, because reading cannot change anything."
                footnote="no approval"
              />
            </Reveal>

            <Reveal className="h-full" delay={0.06}>
              <ToolCard
                risk="reversible"
                tools={REVERSIBLE}
                title="A change you can undo"
                body="Each one is verified afterwards, and reported as a failure if it did not take."
                footnote="approval + verify"
              />
            </Reveal>

            <Reveal className="h-full" delay={0.12}>
              <ToolCard
                risk="destructive"
                tools={DESTRUCTIVE}
                title="The ones that need a second person"
                body="Deletion and credential resets. The ticket’s own requester cannot approve their own."
                footnote="approval, not by requester"
                accent
              />
            </Reveal>

            <Reveal className="md:col-span-2 lg:col-span-3" delay={0.06}>
              <div className="relative overflow-hidden rounded-2xl bg-landing-ink p-8 text-landing-paper lg:p-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-lg">
                    <p className="landing-mono text-[11px] text-landing-paper/50 uppercase tracking-[0.16em]">
                      Asked constantly
                    </p>
                    <h3 className="font-display mt-3 text-[clamp(1.6rem,3vw,2.4rem)] leading-[1.05]">
                      “What stops <span className="text-landing-paper/60 italic">rm -rf /</span>?”
                    </h3>
                    <p className="mt-3 text-[13.5px] text-landing-paper/70 leading-relaxed">
                      There is no interface that accepts a command. Not a filtered one, not an allowlisted one.
                      Remediation arrives as named tools with typed arguments — which is a stronger answer than a regex.
                    </p>
                  </div>
                  <div className="landing-mono shrink-0 rounded-xl border border-landing-paper/15 bg-landing-paper/5 px-4 py-3 text-[11.5px]">
                    <div className="text-landing-paper/50">grep -r run_command</div>
                    <div className="mt-1 text-landing-paper/80">0 matches</div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
