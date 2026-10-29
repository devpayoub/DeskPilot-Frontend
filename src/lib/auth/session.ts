import "server-only";

import { cache } from "react";

import { cookies } from "next/headers";

import { serverFetch } from "@/lib/api/server";
import type { Membership, MeResponse, Role } from "@/lib/api/types";
import { type Capability, capabilitiesForRole } from "@/lib/auth/capabilities";
import { ACCESS_COOKIE, ORG_COOKIE } from "@/lib/auth/cookies";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  is_email_verified: boolean;
};

export type Session = {
  user: SessionUser;
  memberships: Membership[];
  activeOrganizationId: string | null;
  activeOrganization: Membership | null;
  role: Role | null;
  capabilities: Capability[];
};

/**
 * Current session, resolved once per request.
 *
 * `cache()` dedupes the `/auth/me` call across the layout and every page that
 * needs the session in the same render pass.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  let me: MeResponse;
  try {
    me = await serverFetch<MeResponse>("/auth/me/", { accessToken });
  } catch {
    return null;
  }

  const preferredOrgId = cookieStore.get(ORG_COOKIE)?.value ?? null;
  const activeOrganization =
    me.memberships.find((membership) => membership.organization_id === preferredOrgId) ?? me.memberships[0] ?? null;

  return {
    user: {
      id: me.user.id,
      email: me.user.email,
      full_name: me.user.full_name,
      is_email_verified: me.user.is_email_verified,
    },
    memberships: me.memberships,
    activeOrganizationId: activeOrganization?.organization_id ?? null,
    activeOrganization,
    role: activeOrganization?.role ?? null,
    capabilities: capabilitiesForRole(activeOrganization?.role ?? null),
  };
});
