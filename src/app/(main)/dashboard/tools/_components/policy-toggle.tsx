"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { apiPatch } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";

/**
 * Enable or disable one tool.
 *
 * Optimistic, with a rollback: the switch is the kind of control people flip
 * quickly, and a spinner per row feels broken. If the PATCH fails the switch
 * snaps back and the reason appears next to it.
 */
export function PolicyToggle({
  toolName,
  enabled,
  canEdit,
}: {
  toolName: string;
  enabled: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!canEdit) {
    return (
      <Badge variant={enabled ? "secondary" : "destructive"} className="font-normal">
        {enabled ? "on" : "off"}
      </Badge>
    );
  }

  const toggle = async (next: boolean) => {
    setOn(next);
    setBusy(true);
    setError("");
    try {
      await apiPatch(`guardrails/policies/${toolName}/`, { enabled: next });
      router.refresh();
    } catch (caught) {
      setOn(!next);
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Switch checked={on} onCheckedChange={toggle} disabled={busy} aria-label={`Enable ${toolName}`} />
      {error ? <span className="max-w-40 text-destructive text-xs">{error}</span> : null}
    </div>
  );
}
