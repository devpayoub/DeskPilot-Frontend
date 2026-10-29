import type { Metadata } from "next";
import Link from "next/link";

import { ArrowRightIcon, ShieldAlertIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { serverFetch } from "@/lib/api/server";
import type { EvalRun, Stats } from "@/lib/api/types";
import { formatDateTime, formatNumber } from "@/lib/format";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Overview",
};

function percent(value: number | null): string {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

function money(value: number | null): string {
  return value === null ? "—" : `$${value.toFixed(4)}`;
}

function ms(value: number | null): string {
  return value === null ? "—" : `${formatNumber(value)} ms`;
}

function Stat({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "warning" | "good";
}) {
  return (
    <Card className="py-0">
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span
          className={
            emphasis === "warning"
              ? "font-semibold text-2xl text-amber-600 tabular-nums dark:text-amber-400"
              : emphasis === "good"
                ? "font-semibold text-2xl tabular-nums"
                : "font-semibold text-2xl tabular-nums"
          }
        >
          {value}
        </span>
        {hint ? <span className="text-muted-foreground text-xs">{hint}</span> : null}
      </CardContent>
    </Card>
  );
}

export default async function OverviewPage() {
  await requireTenant();

  // Both are independent reads; one failing must not blank the whole dashboard.
  const [stats, evals] = await Promise.all([
    serverFetch<Stats>("/stats/"),
    serverFetch<EvalRun[]>("/evals/runs/").catch(() => [] as EvalRun[]),
  ]);

  const latest = evals[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Overview"
        description="What the agent has been doing, and how often it was stopped."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Auto-resolution rate"
          value={percent(stats.auto_resolution_rate)}
          hint={
            stats.agent_touched
              ? `${stats.auto_resolved} of ${stats.agent_touched} tickets the agent touched`
              : "The agent has not concluded a ticket yet"
          }
        />
        <Stat label="Open tickets" value={formatNumber(stats.tickets_open)} hint={`${stats.tickets_total} total`} />
        <Stat
          label="Pending approvals"
          value={formatNumber(stats.pending_approvals)}
          hint="Writes waiting for a human"
        />
        <Stat
          label="Blocked actions"
          value={formatNumber(stats.blocked_actions)}
          hint="Refused by a guardrail"
          emphasis={stats.blocked_actions > 0 ? "warning" : undefined}
        />
        <Stat
          label="p95 run latency"
          value={ms(stats.p95_latency_ms)}
          hint={stats.runs_total ? `${stats.runs_total} runs, ${stats.runs_failed} failed` : "No runs yet"}
        />
        <Stat
          label="Mean cost per run"
          value={money(stats.mean_cost_usd)}
          hint={
            stats.priced_runs
              ? `${stats.priced_runs} priced run${stats.priced_runs === 1 ? "" : "s"}`
              : "No priced runs — cost is unknown, not zero"
          }
        />
      </div>

      {/*
        Blocked actions gets its own panel on purpose: a dashboard that only
        showed successes would hide the most interesting thing this system does.
      */}
      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">Guardrails</span>
              <span className="text-muted-foreground text-sm">
                {stats.blocked_actions > 0
                  ? `${stats.blocked_actions} attempt${stats.blocked_actions === 1 ? " was" : "s were"} refused before touching anything.`
                  : "Nothing has been refused yet — every attempt so far was allowed."}
              </span>
            </div>
          </div>
          <Link
            href="/dashboard/audit?outcome=denied"
            className="flex shrink-0 items-center gap-1 font-medium text-sm underline underline-offset-4"
          >
            See the refusals
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">Latest evaluation</span>
            <Link href="/dashboard/evals" className="text-muted-foreground text-xs underline underline-offset-4">
              All runs
            </Link>
          </div>

          {latest ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <Badge variant={latest.gates_passed ? "secondary" : "destructive"} className="font-normal">
                {latest.gates_passed ? "Gates passed" : "Gates failed"}
              </Badge>
              <span className="text-muted-foreground">
                mode <span className="font-mono text-foreground">{latest.mode}</span>
              </span>
              <span className="text-muted-foreground">
                triage{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {percent(latest.metrics.triage_accuracy ?? null)}
                </span>
              </span>
              <span className="text-muted-foreground">
                cases <span className="text-foreground tabular-nums">{latest.case_count}</span>
              </span>
              <span className="text-muted-foreground">{formatDateTime(latest.created_at)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              No eval runs recorded yet. Run{" "}
              <span className="font-mono text-foreground">make eval</span> to populate this.
            </span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
