import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ScrollTextIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serverFetch, serverFetchPage } from "@/lib/api/server";
import type { InvocationOutcome, ToolInvocation } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Audit log",
};

type SearchParams = { page?: string; tool?: string; outcome?: string };

const OUTCOME_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "ok", label: "Executed" },
  { value: "denied", label: "Denied" },
  { value: "approval_required", label: "Needs approval" },
  { value: "error", label: "Failed" },
];

/**
 * Outcome styling encodes meaning, not decoration: a denial is not an error, it
 * is the guardrail working, so it gets the warning colour rather than red.
 */
function outcomeVariant(outcome: InvocationOutcome): "default" | "secondary" | "destructive" | "outline" {
  if (outcome === "ok") return "secondary";
  if (outcome === "denied") return "destructive";
  if (outcome === "approval_required") return "outline";
  return "destructive";
}

function outcomeLabel(outcome: InvocationOutcome): string {
  return OUTCOME_FILTERS.find((filter) => filter.value === outcome)?.label ?? outcome;
}

function buildHref(params: SearchParams, patch: SearchParams): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (key === "page") continue;
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `/dashboard/audit?${query}` : "/dashboard/audit";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("audit:read")) {
    redirect("/unauthorized");
  }

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const data = await serverFetchPage<ToolInvocation>("/guardrails/invocations/", {
    query: { page, tool: params.tool, outcome: params.outcome },
  });
  const rows = data.results;

  const hasFilters = Boolean(params.tool || params.outcome);
  const denials = rows.filter((row) => row.is_denial).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Audit log"
        description="Every tool attempt, including the ones that were refused. A denial is the guardrail doing its job, not a failure."
      />

      <div className="flex flex-wrap items-center gap-2">
        {OUTCOME_FILTERS.map((filter) => {
          const active = (params.outcome ?? "") === filter.value;
          return (
            <Link
              key={filter.value || "all"}
              href={buildHref(params, { outcome: filter.value })}
              className={
                active
                  ? "rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground text-xs"
                  : "rounded-md border px-3 py-1.5 text-muted-foreground text-xs hover:bg-muted"
              }
            >
              {filter.label}
            </Link>
          );
        })}
        {hasFilters ? (
          <Link href="/dashboard/audit" className="text-muted-foreground text-xs underline underline-offset-4">
            Clear
          </Link>
        ) : null}
        <span className="ml-auto text-muted-foreground text-xs tabular-nums">
          {data.count} row{data.count === 1 ? "" : "s"}
          {denials ? ` · ${denials} denied on this page` : ""}
        </span>
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <Empty className="border-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ScrollTextIcon />
                </EmptyMedia>
                <EmptyTitle>{hasFilters ? "No attempts match these filters" : "No attempts yet"}</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "Try clearing the filters to see the full history."
                    : "Run the agent on a ticket and every tool call lands here."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Tool</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead>Trace</TableHead>
                  <TableHead className="pr-4">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="pl-4">
                      <span className="font-medium font-mono text-sm">{row.tool_name}</span>
                      {row.dry_run ? (
                        <Badge variant="outline" className="ml-2 font-normal text-xs">
                          dry run
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={outcomeVariant(row.outcome)} className="font-normal">
                        {outcomeLabel(row.outcome)}
                      </Badge>
                      {row.error_code ? (
                        <div className="mt-1 text-muted-foreground text-xs">{row.error_code}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{row.risk_class || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {row.actor_type === "agent" ? "Agent" : row.actor_id || row.actor_type}
                      <div className="text-xs">{row.transport}</div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm tabular-nums">
                      {row.duration_ms} ms
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground text-xs">
                      {row.trace_id ? `${row.trace_id.slice(0, 8)}…` : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-muted-foreground text-sm tabular-nums">
                      {formatDateTime(row.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationBar
        basePath="/dashboard/audit"
        params={{ tool: params.tool, outcome: params.outcome }}
        page={data.page}
        count={data.count}
        pageSize={data.page_size}
      />
    </div>
  );
}
