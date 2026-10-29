"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { LoaderCircleIcon, PlayIcon, RadioIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiGet, apiPost } from "@/lib/api/client";
import type { AgentRun, RunSummary, WsTicket } from "@/lib/api/types";

const ACTIVE: ReadonlySet<string> = new Set(["queued", "running"]);
const POLL_MS = 2500;

/**
 * Live agent trace.
 *
 * The socket is a **change signal**, not a data channel: when a message arrives
 * we refetch the run and let the REST response drive the UI. Merging the socket
 * payload into local state would give us two shapes for the same step, and the
 * moment they drift the trace starts lying.
 *
 * Polling runs alongside the socket on purpose. The socket needs daphne, a
 * same-network browser and an unexpired ticket; polling needs none of those. If
 * the socket never opens, the trace still updates — it just lags by a couple of
 * seconds.
 */
export function LiveTrace({
  ticketId,
  initialRun,
  canRun,
}: {
  ticketId: number;
  initialRun: AgentRun | null;
  canRun: boolean;
}) {
  const [run, setRun] = useState<AgentRun | null>(initialRun);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const runId = run?.id ?? null;
  const status = run?.status ?? null;
  const isActive = status !== null && ACTIVE.has(status);

  const refresh = useCallback(async (id: number) => {
    const next = await apiGet<AgentRun>(`runs/${id}/`);
    setRun(next);
  }, []);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const summary = await apiPost<RunSummary>(`tickets/${ticketId}/run/`);
      await refresh(summary.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the run.");
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (runId === null || status === null || !ACTIVE.has(status)) {
      setLive(false);
      return;
    }

    let closed = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const sync = async () => {
      try {
        await refresh(runId);
      } catch {
        // Keep the last good state; the next tick tries again.
      }
    };

    const openSocket = async () => {
      try {
        const { ticket } = await apiPost<WsTicket>(`runs/${runId}/ws-ticket/`);
        const base = process.env.NEXT_PUBLIC_WS_URL;
        if (!base || closed) return;

        const socket = new WebSocket(`${base}/ws/runs/${runId}/?token=${encodeURIComponent(ticket)}`);
        socketRef.current = socket;
        socket.onopen = () => !closed && setLive(true);
        socket.onmessage = () => {
          if (debounce) clearTimeout(debounce);
          debounce = setTimeout(sync, 150);
        };
        socket.onclose = () => !closed && setLive(false);
        socket.onerror = () => !closed && setLive(false);
      } catch {
        // No socket available. Polling below still drives the trace.
      }
    };

    void openSocket();
    const pollTimer = setInterval(sync, POLL_MS);

    return () => {
      closed = true;
      setLive(false);
      socketRef.current?.close();
      socketRef.current = null;
      clearInterval(pollTimer);
      if (debounce) clearTimeout(debounce);
    };
  }, [runId, status, refresh]);

  if (!run) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-sm">No agent run yet</span>
          {canRun ? (
            <Button size="sm" onClick={start} disabled={starting}>
              {starting ? <LoaderCircleIcon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
              Run agent
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          Running the agent investigates this ticket with read-only tools and reports what it found.
        </p>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3">
        <span className="font-medium text-sm">Run #{run.id}</span>
        <Badge variant={run.status === "finished" ? "secondary" : "outline"} className="font-normal">
          {run.status.replace(/_/g, " ")}
        </Badge>
        {live ? (
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <RadioIcon className="size-3 text-emerald-500" />
            live
          </span>
        ) : isActive ? (
          <span className="text-muted-foreground text-xs">polling</span>
        ) : null}

        <span className="text-muted-foreground text-xs">
          {run.iterations} iterations · {run.tool_calls} tool calls · {run.duration_ms ?? 0} ms
        </span>
        <span className="text-muted-foreground text-xs">
          cost{" "}
          {run.cost_usd === null ? (
            <span title="No price row for this model — unknown, not zero">unknown</span>
          ) : (
            `$${Number(run.cost_usd).toFixed(4)}`
          )}
        </span>

        {canRun && !isActive ? (
          <Button size="sm" variant="outline" className="ml-auto" onClick={start} disabled={starting}>
            {starting ? <LoaderCircleIcon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
            Run again
          </Button>
        ) : null}
      </div>

      {run.error ? (
        <p className="border-b px-4 py-2 text-destructive text-sm">
          {run.error.includes("LLM not configured")
            ? "The agent has no model to think with. Set LLM_API_KEY on the API and restart it."
            : run.error}
        </p>
      ) : null}
      {error ? <p className="border-b px-4 py-2 text-destructive text-sm">{error}</p> : null}

      {run.steps.length === 0 ? (
        <p className="px-4 py-6 text-muted-foreground text-sm">
          {isActive ? "Waiting for the first step…" : "This run produced no steps."}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">#</TableHead>
              <TableHead>Thought</TableHead>
              <TableHead>Tool</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="pr-4 text-right">Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {run.steps.map((step) => (
              <TableRow key={step.id}>
                <TableCell className="pl-4 text-muted-foreground text-xs tabular-nums">{step.step_no}</TableCell>
                <TableCell className="max-w-[22rem] text-sm">{step.thought}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs">{step.tool_name || "—"}</span>
                    <span className="text-muted-foreground text-xs">{step.tool_risk}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[24rem]">
                  {step.result?.error ? (
                    <span className="text-destructive text-xs">{step.result.error}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      {step.status === "requires_approval"
                        ? "waiting for approval"
                        : step.result?.result
                          ? JSON.stringify(step.result.result).slice(0, 120)
                          : "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right text-muted-foreground text-xs tabular-nums">
                  {step.latency_ms} ms
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
