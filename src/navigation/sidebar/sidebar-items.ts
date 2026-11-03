import {
  GaugeIcon,
  LayoutDashboardIcon,
  type LucideIcon,
  MessagesSquareIcon,
  ScrollTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react";

import type { Capability } from "@/lib/auth/capabilities";

export type NavBadge = "new" | "updated" | "soon";

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  /** Hidden unless the current role holds this capability. */
  capability?: Capability;
}

interface NavItemBase {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: NavBadge;
  disabled?: boolean;
  newTab?: boolean;
  capability?: Capability;
}

export interface NavMainLinkItem extends NavItemBase {
  url: string;
  subItems?: never;
}

export interface NavMainParentItem extends NavItemBase {
  subItems: NavSubItem[];
}

export type NavMainItem = NavMainLinkItem | NavMainParentItem;

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

/**
 * Ordered by what a person does, not by what the backend owns: triage first,
 * then the agent's own surfaces, then the operational record.
 *
 * Capabilities are a UI filter only — every page and every API call is checked
 * again server-side, so hiding an item is a courtesy, never a control.
 */
export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Support",
    items: [
      {
        id: "overview",
        title: "Overview",
        url: "/dashboard/overview",
        icon: LayoutDashboardIcon,
        // Same capability the page itself guards on. A requester's landing screen
        // is their tickets, so offering Overview here would be an invitation to
        // `/unauthorized`.
        capability: "usage:read",
      },
      {
        id: "tickets",
        title: "Tickets",
        url: "/dashboard/tickets",
        icon: MessagesSquareIcon,
        capability: "ticket:read",
      },
      {
        id: "approvals",
        title: "Approvals",
        url: "/dashboard/approvals",
        icon: ShieldCheckIcon,
        capability: "approval:read",
      },
    ],
  },
  {
    id: 2,
    label: "Agent",
    items: [
      {
        id: "tools",
        title: "Tools",
        url: "/dashboard/tools",
        icon: WrenchIcon,
        capability: "tool:read",
      },
      {
        id: "evals",
        title: "Evaluations",
        url: "/dashboard/evals",
        icon: GaugeIcon,
        capability: "eval:read",
      },
    ],
  },
  {
    id: 3,
    label: "Operations",
    items: [
      {
        id: "audit",
        title: "Audit log",
        url: "/dashboard/audit",
        icon: ScrollTextIcon,
        capability: "audit:read",
      },
      {
        id: "directory",
        title: "Directory",
        url: "/dashboard/directory",
        icon: UsersIcon,
        capability: "directory:read",
      },
      {
        id: "settings",
        title: "Settings",
        icon: SettingsIcon,
        // Settings grew from one page into three: the account's own structure
        // (departments, members) plus the agent's switches. The section opens at
        // the service desk — how the agent is configured is not something a
        // person who only raises tickets is offered. The parent's capability also
        // decides whether the group appears at all, so a requester is left with
        // their tickets and nothing else.
        capability: "usage:read",
        subItems: [
          { id: "settings-overview", title: "Overview", url: "/dashboard/settings" },
          {
            id: "settings-departments",
            title: "Departments",
            url: "/dashboard/settings/departments",
            capability: "org:read",
          },
          {
            id: "settings-members",
            title: "Members",
            url: "/dashboard/settings/members",
            capability: "member:read",
          },
        ],
      },
    ],
  },
];

/** `true` when this session's capabilities allow the entry. */
function held(item: { capability?: Capability }, capabilities: readonly Capability[]): boolean {
  return !item.capability || capabilities.includes(item.capability);
}

/**
 * The navigation this session may actually use.
 *
 * Declaring `capability` above used to be decoration: the sidebar rendered
 * `sidebarItems` verbatim, so a requester was offered Approvals, Audit, Directory
 * and Members and met a refusal on every one. Hiding is a courtesy — the API
 * still checks each call — but a menu that lists what you cannot do is a menu
 * that teaches you that the product does not know what you are.
 *
 * A group whose every entry was dropped disappears too, and so does a parent
 * left with no reachable sub-item, rather than opening onto nothing.
 */
export function visibleSidebarItems(capabilities: readonly Capability[]): NavGroup[] {
  const visible: NavGroup[] = [];

  for (const group of sidebarItems) {
    const items: NavMainItem[] = [];

    for (const item of group.items) {
      if (!held(item, capabilities)) continue;

      if (!item.subItems) {
        items.push(item);
        continue;
      }

      const subItems = item.subItems.filter((sub) => held(sub, capabilities));
      // A parent whose every child was dropped would open onto nothing.
      if (subItems.length > 0) items.push({ ...item, subItems });
    }

    if (items.length > 0) visible.push({ ...group, items });
  }

  return visible;
}
