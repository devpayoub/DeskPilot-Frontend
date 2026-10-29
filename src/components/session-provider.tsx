"use client";

import { createContext, type ReactNode, use } from "react";

import type { Membership, Role } from "@/lib/api/types";
import type { Capability } from "@/lib/auth/capabilities";

export type SessionContextValue = {
  user: {
    id: string;
    email: string;
    full_name: string;
    is_email_verified: boolean;
  };
  memberships: Membership[];
  activeOrganizationId: string | null;
  activeOrganization: Membership | null;
  role: Role | null;
  capabilities: Capability[];
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ value, children }: { value: SessionContextValue; children: ReactNode }) {
  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): SessionContextValue {
  const context = use(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside <SessionProvider>.");
  }
  return context;
}

/**
 * UI capability check.
 *
 * The API enforces the same capability server-side; this only decides whether
 * to show, hide or disable a control.
 */
export function useCan(capability: Capability): boolean {
  const { capabilities } = useSession();
  return capabilities.includes(capability);
}
