"use client";

import Link from "next/link";

import { useShallow } from "zustand/react/shallow";

import { BrandMark } from "@/components/brand";
import { useSession } from "@/components/session-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROLE_LABELS } from "@/lib/auth/capabilities";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { QuotaCard, type QuotaSnapshot } from "./quota-card";

export function AppSidebar({
  quota,
  ...props
}: React.ComponentProps<typeof Sidebar> & { quota?: QuotaSnapshot | null }) {
  const { activeOrganization, role, user } = useSession();

  const { sidebarVariant, sidebarCollapsible, isSynced } = usePreferencesStore(
    useShallow((s) => ({
      sidebarVariant: s.values.sidebar_variant,
      sidebarCollapsible: s.values.sidebar_collapsible,
      isSynced: s.isSynced,
    })),
  );

  const variant = isSynced ? sidebarVariant : props.variant;
  const collapsible = isSynced ? sidebarCollapsible : props.collapsible;

  return (
    <Sidebar {...props} variant={variant} collapsible={collapsible}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={activeOrganization?.organization_name ?? "Workspace"}>
              <Link prefetch={false} href="/dashboard/overview">
                <BrandMark className="size-8" />
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-semibold text-sm">
                    {activeOrganization?.organization_name ?? "Workspace"}
                  </span>
                  <span className="truncate text-muted-foreground text-xs">
                    {role ? ROLE_LABELS[role] : "No workspace"}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={sidebarItems} />
      </SidebarContent>

      <SidebarFooter>
        <QuotaCard quota={quota ?? null} />
        <NavUser user={{ name: user.full_name || user.email, email: user.email, avatar: "" }} />
      </SidebarFooter>
    </Sidebar>
  );
}
