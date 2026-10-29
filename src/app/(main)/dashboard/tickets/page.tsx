import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MessagesSquareIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serverFetch, serverFetchPage } from "@/lib/api/server";
import type { Ticket, TicketDisposition, TicketStatus } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Tickets",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "New",
  in_progress: "In progress",
  awaiting_agent: "Agent running",
  awaiting_user: "Awaiting user",
  resolved: "Resolved",
  closed: "Closed",
};

const DISPOSITION_LABEL: Record<Exclude<TicketDisposition, "">, string> = {
  auto_resolved: "Auto-resolved",
  needs_human: "Needs human",
  needs_input: "Needs input",
  out_of_scope: "Out of scope",
  escalated: "Escalated",
};

type SearchParams = { page?: string };

export default async function TicketsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("ticket:read")) {
    redirect("/unauthorized");
  }

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const data = await serverFetchPage<Ticket>("/tickets/", { query: { page } });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tickets"
        description="What people reported, and what the agent concluded. A ticket still closes by human hand."
      />

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          {data.results.length === 0 ? (
            <Empty className="border-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessagesSquareIcon />
                </EmptyMedia>
                <EmptyTitle>No tickets yet</EmptyTitle>
                <EmptyDescription>Create one with the API or run `make demo` to seed a few.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Agent verdict</TableHead>
                  <TableHead className="pr-4 text-right">Opened</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.results.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="pl-4 font-mono text-sm">
                      <Link href={`/dashboard/tickets/${ticket.id}`} className="underline underline-offset-4">
                        {ticket.number}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[22rem] truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant={ticket.status === "new" ? "outline" : "secondary"} className="font-normal">
                        {STATUS_LABEL[ticket.status] ?? ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{ticket.priority}</TableCell>
                    <TableCell>
                      {ticket.ai_disposition ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">
                            {DISPOSITION_LABEL[ticket.ai_disposition] ?? ticket.ai_disposition}
                          </span>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {ticket.ai_confidence === null
                              ? "no confidence reported"
                              : `${(ticket.ai_confidence * 100).toFixed(0)}% confident`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not analysed</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground text-sm tabular-nums">
                      {formatDateTime(ticket.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationBar
        basePath="/dashboard/tickets"
        params={{}}
        page={data.page}
        count={data.count}
        pageSize={data.page_size}
      />
    </div>
  );
}
