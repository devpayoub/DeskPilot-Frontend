import type { ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { requireTenant } from "@/lib/tenant/server";

import { SettingsNav } from "./_components/settings-nav";

/**
 * The Settings area: one header, one set of tabs, three pages.
 *
 * The header lives here rather than in each page so the account name appears
 * exactly once — which is also a reminder of *which* account these switches
 * apply to, since a person can belong to more than one.
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const tenant = await requireTenant();
  const capabilities = tenant.session.capabilities;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        description={`How ${tenant.organizationName} is organised, and what the agent is allowed to do in it.`}
      />
      <SettingsNav canReadMembers={capabilities.includes("member:read")} />
      {children}
    </div>
  );
}
