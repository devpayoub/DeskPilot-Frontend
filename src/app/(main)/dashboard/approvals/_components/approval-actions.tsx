"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiPost } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

/**
 * Approve or reject one proposed write.
 *
 * The decision is not enforced here — the API re-checks the approver's role *and*
 * refuses a destructive change signed off by the ticket's own requester. This
 * component only decides what to offer, so a drift bug can hide a button but
 * never grant permission.
 */
export function ApprovalActions({
  approvalId,
  canDecide,
  riskClass,
}: {
  approvalId: number;
  canDecide: boolean;
  riskClass: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!canDecide) {
    return (
      <p className="text-muted-foreground text-xs">
        Your role can see this request but not decide it. A technician or administrator has to approve it.
      </p>
    );
  }

  const decide = async (decision: "approve" | "reject") => {
    setBusy(decision);
    setError("");
    try {
      await apiPost(`guardrails/approvals/${approvalId}/${decision}/`, { note });
      setNote("");
      // The list is server-rendered; refetch rather than mutating local state so
      // the row disappears for the same reason the server would drop it.
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Why? Recorded against your name (optional)."
        className="min-h-16 resize-y text-sm"
        disabled={busy !== null}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => decide("approve")} disabled={busy !== null}>
          {busy === "approve" ? <LoaderCircleIcon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
          Approve and run
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide("reject")} disabled={busy !== null}>
          {busy === "reject" ? <LoaderCircleIcon className="size-4 animate-spin" /> : <XIcon className="size-4" />}
          Reject
        </Button>
        {riskClass === "WRITE_DESTRUCTIVE" ? (
          <span className="text-amber-600 text-xs dark:text-amber-400">
            Destructive — the preview above is what will run, nothing else.
          </span>
        ) : null}
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
