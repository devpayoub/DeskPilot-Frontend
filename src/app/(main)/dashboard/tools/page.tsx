import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { serverFetch } from "@/lib/api/server";
import type { RiskClass, ToolCatalog, ToolPolicy } from "@/lib/api/types";
import { requireTenant } from "@/lib/tenant/server";

import { PolicyToggle } from "./_components/policy-toggle";

export const metadata: Metadata = {
  title: "Tools",
};

const RISK_VARIANT: Record<RiskClass, "outline" | "secondary" | "destructive"> = {
  READ: "outline",
  WRITE_REVERSIBLE: "secondary",
  WRITE_DESTRUCTIVE: "destructive",
};

export default async function ToolsPage() {
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("tool:read")) {
    redirect("/unauthorized");
  }

  const [catalog, policies] = await Promise.all([
    serverFetch<ToolCatalog>("/tools/"),
    serverFetch<ToolPolicy[]>("/guardrails/policies/").catch(() => [] as ToolPolicy[]),
  ]);

  const policyByTool = new Map(policies.map((policy) => [policy.tool_name, policy]));
  const canEdit = tenant.session.capabilities.includes("policy:write");
  const writes = catalog.tools.filter((tool) => tool.risk_class !== "READ").length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tools"
        description={`${catalog.count} typed capabilities, ${writes} of which change state. There is deliberately no tool that accepts a shell command.`}
      />

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Tool</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="pr-4 text-right">Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.tools.map((tool) => {
                const policy = policyByTool.get(tool.name);
                const enabled = policy?.enabled ?? true;

                return (
                  <TableRow key={tool.name}>
                    <TableCell className="pl-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium font-mono text-sm">{tool.name}</span>
                        <span className="max-w-[30rem] truncate text-muted-foreground text-xs">
                          {tool.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{tool.domain}</TableCell>
                    <TableCell>
                      <Badge variant={RISK_VARIANT[tool.risk_class]} className="font-normal">
                        {tool.risk_class.replace("WRITE_", "").toLowerCase()}
                      </Badge>
                      {tool.dry_run_supported ? (
                        <div className="mt-1 text-muted-foreground text-xs">dry run</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tool.requires_approval ? (
                        <span className="text-amber-600 dark:text-amber-400">human</span>
                      ) : (
                        <span className="text-muted-foreground">none</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {tool.allowed_roles ? tool.allowed_roles.join(", ") : "any authenticated"}
                    </TableCell>
                    <TableCell className="pr-4">
                      <PolicyToggle toolName={tool.name} enabled={enabled} canEdit={canEdit} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
