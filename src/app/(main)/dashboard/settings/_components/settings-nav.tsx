"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "cn";

const TABS = [
  { href: "/dashboard/settings", label: "Overview" },
  { href: "/dashboard/settings/departments", label: "Departments" },
  { href: "/dashboard/settings/members", label: "Members", needsMemberRead: true },
] as const;

/**
 * Route-backed tabs.
 *
 * Not the `Tabs` component: these are three URLs, not three panels. Making them
 * links means the browser's back button, a bookmark and a shared link all do the
 * obvious thing.
 */
export function SettingsNav({ canReadMembers }: { canReadMembers: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections" className="flex flex-wrap items-center gap-1 border-b pb-2">
      {TABS.filter((tab) => !("needsMemberRead" in tab) || canReadMembers).map((tab) => {
        const active = tab.href === "/dashboard/settings" ? pathname === tab.href : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-sm transition-colors",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
