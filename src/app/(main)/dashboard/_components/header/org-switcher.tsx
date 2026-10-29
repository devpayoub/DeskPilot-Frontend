"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "cn";
import { BuildingIcon, CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/auth/capabilities";

export function OrgSwitcher() {
  const { memberships, activeOrganizationId } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const active =
    memberships.find((membership) => membership.organization_id === activeOrganizationId) ?? memberships[0] ?? null;

  if (!active) return null;

  const selectOrganization = async (organizationId: string) => {
    if (organizationId === active.organization_id || pending) return;

    setPending(true);
    try {
      const response = await fetch("/api/org/select", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (response.ok) {
        // Every cached query belongs to the previous tenant: refresh the server
        // tree, which also re-renders the layout with the new header value.
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-[220px] gap-2 px-2" disabled={pending}>
          <BuildingIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium">{active.organization_name}</span>
          <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-muted-foreground text-xs">Workspaces</DropdownMenuLabel>
        {memberships.map((membership) => {
          const isActive = membership.organization_id === active.organization_id;

          return (
            <DropdownMenuItem
              key={membership.organization_id}
              onSelect={() => void selectOrganization(membership.organization_id)}
              className={cn("gap-2", isActive && "bg-accent/50")}
            >
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium text-sm">{membership.organization_name}</span>
                <span className="truncate text-muted-foreground text-xs">{ROLE_LABELS[membership.role]}</span>
              </div>
              {isActive ? <CheckIcon className="size-4 shrink-0" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">Workspace settings</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
