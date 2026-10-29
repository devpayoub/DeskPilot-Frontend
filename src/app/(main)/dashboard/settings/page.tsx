import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { serverFetch } from "@/lib/api/server";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Settings",
};

type KillSwitch = { state: "open" | "paused" | "halted" };

const STATE_COPY: Record<KillSwitch["state"], { label: string; body: string; variant: "secondary" | "destructive" | "outline" }> = {
  open: {
    label: "Open",
    body: "Tools run normally. Writes still stop at the approval gate.",
    variant: "secondary",
  },
  paused: {
    label: "Paused",
    body: "Writes are refused; reads continue. Use this when something looks wrong but you still need diagnostics.",
    variant: "outline",
  },
  halted: {
    label: "Halted",
    body: "Every tool call is refused, reads included. The agent will fail its run rather than act.",
    variant: "destructive",
  },
};

export default async function SettingsPage() {
  await requireTenant();

  const killSwitch = await serverFetch<KillSwitch>("/guardrails/killswitch/").catch(
    () => ({ state: "open" }) as KillSwitch,
  );
  const copy = STATE_COPY[killSwitch.state] ?? STATE_COPY.open;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" description="The switches that decide how much the agent is allowed to do." />

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Kill switch</span>
            <Badge variant={copy.variant} className="font-normal">
              {copy.label}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{copy.body}</p>
          <p className="text-muted-foreground text-xs">
            Only an administrator can change this, and every change is audited. The console toggle lands with the
            approval work; for now use{" "}
            <span className="font-mono text-foreground">POST /api/v1/guardrails/killswitch/</span>.
          </p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <span className="font-medium text-sm">Writes are simulated by default</span>
          <p className="text-muted-foreground text-sm">
            Unless <span className="font-mono text-foreground">SAFE_MODE=0</span> and{" "}
            <span className="font-mono text-foreground">ALLOW_REAL_WRITES=1</span> are both set, remediation tools run
            against a simulated host. This checkout cannot delete a file or restart a service on the machine hosting
            it.
          </p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <span className="font-medium text-sm">Model</span>
          <p className="text-muted-foreground text-sm">
            The provider is configured by <span className="font-mono text-foreground">LLM_BASE_URL</span>,{" "}
            <span className="font-mono text-foreground">LLM_MODEL</span> and{" "}
            <span className="font-mono text-foreground">LLM_API_KEY</span> on the API. Run{" "}
            <span className="font-mono text-foreground">make check-llm</span> to confirm the key and model actually
            respond before trusting any cost figure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
