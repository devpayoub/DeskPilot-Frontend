import "server-only";

import { redirect } from "next/navigation";

import { getSession, type Session } from "@/lib/auth/session";

export type TenantContext = {
  session: Session;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: NonNullable<Session["role"]>;
};

/** Require a session, otherwise send the user to the login screen. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

/**
 * Require a session **and** an active workspace.
 *
 * DeskPilot is single-tenant and `/auth/me/` always returns exactly one
 * membership, so this normally cannot fail. If it ever does, the honest
 * outcome is "not authorised", not a self-service onboarding flow this
 * product does not have.
 */
export async function requireTenant(): Promise<TenantContext> {
  const session = await requireSession();

  if (!session.activeOrganization || !session.role) {
    redirect("/unauthorized");
  }

  return {
    session,
    organizationId: session.activeOrganization.organization_id,
    organizationName: session.activeOrganization.organization_name,
    organizationSlug: session.activeOrganization.organization_slug,
    role: session.role,
  };
}
