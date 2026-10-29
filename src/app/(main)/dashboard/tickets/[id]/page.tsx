import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { serverFetch } from "@/lib/api/server";
import type { AgentRun, TicketDetail } from "@/lib/api/types";
import { requireTenant } from "@/lib/tenant/server";

import { LiveTrace } from "./_components/live-trace";

export const metadata: Metadata = {
  title: "Ticket",
};

function confidence(value: number | null): string {
  return value === null ? "no confidence reported" : `${(value * 100).toFixed(0)}% confident`;
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await requireTenant();
  const { id } = await params;

  const ticket = await serverFetch<TicketDetail>(`/tickets/${id}/`).catch(() => null);
  if (!ticket) notFound();

  // The trace is rendered client-side so it can follow a run in progress. The
  // server still supplies the first frame, so the page is useful without JS.
  const run = ticket.latest_run_id
    ? await serverFetch<AgentRun>(`/runs/${ticket.latest_run_id}/`).catch(() => null)
    : null;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/dashboard/tickets"
        className="flex w-fit items-center gap-1 text-muted-foreground text-sm underline underline-offset-4"
      >
        <ArrowLeftIcon className="size-3.5" />
        All tickets
      </Link>

      <PageHeader
        title={ticket.subject}
        description={`${ticket.number} · ${ticket.requester_name || "unknown requester"}${
          ticket.device_hostname ? ` · ${ticket.device_hostname}` : ""
        }`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-normal">
              {ticket.status.replace(/_/g, " ")}
            </Badge>
            <Badge variant="outline" className="font-normal">
              {ticket.priority}
            </Badge>
          </div>
        }
      />

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <span className="text-muted-foreground text-xs">Reported</span>
          <p className="whitespace-pre-wrap text-sm">{ticket.body}</p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-sm">Agent conclusion</span>
            {ticket.ai_disposition ? (
              <>
                <Badge variant="secondary" className="font-normal">
                  {ticket.ai_disposition.replace(/_/g, " ")}
                </Badge>
                <span className="text-muted-foreground text-xs">{confidence(ticket.ai_confidence)}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">not analysed yet</span>
            )}
          </div>

          {ticket.ai_diagnosis ? <p className="text-sm">{ticket.ai_diagnosis}</p> : null}
          {ticket.ai_summary ? (
            <p className="text-muted-foreground text-sm">{ticket.ai_summary}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nothing yet. Running the agent below will produce a diagnosis.
            </p>
          )}
        </CardContent>
      </Card>

      <LiveTrace
        ticketId={ticket.id}
        initialRun={run}
        canRun={tenant.session.capabilities.includes("run:trigger")}
      />
    </div>
  );
}
