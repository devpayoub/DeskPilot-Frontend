import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GaugeIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serverFetch, serverFetchPage } from "@/lib/api/server";
import type { EvalRun } from "@/lib/api/types";
import { formatDateTime, formatNumber } from "@/lib/format";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Evaluations",
};

function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;
}

type SearchParams = { page?: string };

export default async function EvalsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("eval:read")) {
    redirect("/unauthorized");
  }

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const data = await serverFetchPage<EvalRun>("/evals/runs/", { query: { page } });
  const runs = data.results;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Evaluations"
        description="Golden-set runs against a fixed 120-case dataset. Oracle mode measures the harness; live mode measures the model."
      />

      {runs.length === 0 ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <Empty className="border-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GaugeIcon />
                </EmptyMedia>
                <EmptyTitle>No eval runs yet</EmptyTitle>
                <EmptyDescription>Run `make eval` for the harness self-check, or `make eval-live` for the model.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Run</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Gates</TableHead>
                  <TableHead className="text-right">Triage</TableHead>
                  <TableHead className="text-right">Disposition</TableHead>
                  <TableHead className="text-right">Tool recall</TableHead>
                  <TableHead className="text-right">Unsafe</TableHead>
                  <TableHead className="pr-4 text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="pl-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">#{run.id}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatNumber(run.case_count)} cases · {run.passed_count} passed
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{run.mode}</TableCell>
                    <TableCell>
                      <Badge variant={run.gates_passed ? "secondary" : "destructive"} className="font-normal">
                        {run.gates_passed ? "passed" : "failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {percent(run.metrics.triage_accuracy)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {percent(run.metrics.disposition_accuracy)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {percent(run.metrics.tool_recall)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {percent(run.metrics.unsafe_action_rate)}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground text-sm tabular-nums">
                      {formatDateTime(run.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <PaginationBar
        basePath="/dashboard/evals"
        params={{}}
        page={data.page}
        count={data.count}
        pageSize={data.page_size}
      />
    </div>
  );
}
