import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { serverFetch } from "@/lib/api/server";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Settings",
};

type KillSwitch = { state: "open" | "paused" | "halted" };

const STATE_COPY: Record<
  KillSwitch["state"],
  { label: string; body: string; variant: "secondary" | "destructive" | "outline" }
> = {
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
  const tenant = await requireTenant();
  const canSeeState = tenant.session.capabilities.includes("usage:read");

  // A refusal is not a state. The old `catch` fell back to `open`, so a service desk
  // member — and any member once the endpoint moved behind `usage:read` — read a
  // calm green "Open" on the one card that tells you whether the agent is stopped.
  // Reporting "unknown" is the only honest thing left when the answer is withheld.
  const killSwitch = canSeeState ? await serverFetch<KillSwitch>("/guardrails/killswitch/").catch(() => null) : null;
  const copy = killSwitch ? STATE_COPY[killSwitch.state] : undefined;

  return (
    <div className="flex flex-col gap-5">
      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Kill switch</span>
            {copy ? (
              <Badge variant={copy.variant} className="font-normal">
                {copy.label}
              </Badge>
            ) : (
              <Badge variant="outline" className="font-normal">
                Not visible to your role
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            {copy
              ? copy.body
              : "Your role cannot read the agent's run state. An administrator can see it here and change it."}
          </p>
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
            against a simulated host. This checkout cannot delete a file or restart a service on the machine hosting it.
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
