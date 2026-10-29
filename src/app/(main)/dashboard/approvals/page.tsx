import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ShieldCheckIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { serverFetch, serverFetchPage } from "@/lib/api/server";
import type { ApprovalRequest, RiskClass } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireTenant } from "@/lib/tenant/server";

import { ApprovalActions } from "./_components/approval-actions";

export const metadata: Metadata = {
  title: "Approvals",
};

const RISK_VARIANT: Record<RiskClass, "outline" | "secondary" | "destructive"> = {
  READ: "outline",
  WRITE_REVERSIBLE: "secondary",
  WRITE_DESTRUCTIVE: "destructive",
};

function Fields({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data ?? {});
  if (entries.length === 0) return <span className="text-muted-foreground text-sm">No arguments</span>;

  return (
    <dl className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-1">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground text-xs">{key}</dt>
          <dd className="font-mono text-xs">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ApprovalsPage() {
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("approval:read")) {
    redirect("/unauthorized");
  }

  // A pending queue is small by nature, so it reads the envelope and shows
  // everything: a pager here would be a control nobody needs.
  const pending = (
    await serverFetchPage<ApprovalRequest>("/guardrails/approvals/", {
      query: { page_size: 50 },
    })
  ).results;
  const canDecide = tenant.session.capabilities.includes("approval:decide");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Approvals"
        description="Every proposed write waits here. The approval is bound to the exact arguments below, so approving one set can never run another."
      />

      {pending.length === 0 ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <Empty className="border-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing is waiting</EmptyTitle>
                <EmptyDescription>
                  When the agent proposes a change it pauses here with a dry-run preview first.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((request) => (
            <Card key={request.id} className="py-0">
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-medium text-sm">{request.tool_name}</span>
                  <Badge variant={RISK_VARIANT[request.risk_class]} className="font-normal">
                    {request.risk_class.replace("WRITE_", "").toLowerCase()}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    dry run {request.dry_run_ok ? "ok" : "failed"}
                  </Badge>
                  <span className="ml-auto text-muted-foreground text-xs tabular-nums">
                    expires {formatDateTime(request.expires_at)}
                  </span>
                </div>

                {request.rationale ? <p className="text-muted-foreground text-sm">{request.rationale}</p> : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border p-3">
                    <div className="mb-1 text-muted-foreground text-xs">Arguments</div>
                    <Fields data={request.args_redacted} />
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="mb-1 text-muted-foreground text-xs">What would change</div>
                    {request.preview ? (
                      <Fields data={request.preview} />
                    ) : (
                      <span className="text-muted-foreground text-sm">No preview available</span>
                    )}
                  </div>
                </div>

                <div className="text-muted-foreground text-xs">
                  bound to{" "}
                  <span className="font-mono text-foreground">{request.args_hash.slice(0, 16)}…</span>
                  {request.decided_by_email ? ` · decided by ${request.decided_by_email}` : null}
                </div>

                <div className="border-t pt-3">
                  <ApprovalActions
                    approvalId={request.id}
                    canDecide={canDecide}
                    riskClass={request.risk_class}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
