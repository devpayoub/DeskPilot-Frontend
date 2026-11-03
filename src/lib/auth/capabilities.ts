import type { Capability, Role } from "@/lib/api/types";

// Re-exported so the console's existing `from "@/lib/auth/capabilities"` imports
// keep working; the union itself lives with the other DTOs, next to `Role`.
export type { Capability };

/**
 * Which role holds which capability is decided once, in Python, at
 * `backend/apps/common/capabilities.py`, and served by `/auth/me/` as
 * `role_capabilities`. This file used to carry a second copy of that answer and
 * the two drifted: endpoints this table called administrator-only were open to
 * anybody signed in, because the only thing enforcing the table was the table.
 * So there is deliberately no role→capability map here any more — adding one is
 * how the drift comes back.
 */

/**
 * The session's capabilities, read out of the map the server sent.
 *
 * An unknown role yields nothing, which is the fail-closed direction: a role the
 * backend does not know renders no controls rather than every one of them. The
 * API re-checks each call regardless, so a stale map can hide a button — it can
 * never grant one.
 */
export function capabilitiesForRole(
  roleCapabilities: Partial<Record<Role, Capability[]>> | undefined,
  role: Role | null | undefined,
): Capability[] {
  if (!role || !roleCapabilities) return [];
  return roleCapabilities[role] ?? [];
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  TECHNICIAN: "Technician",
  SERVICE_DESK: "Service desk",
  REQUESTER: "Requester",
};

/** Roles that can be assigned to a person, highest privilege last. */
export const ASSIGNABLE_ROLES: Role[] = ["REQUESTER", "SERVICE_DESK", "TECHNICIAN", "ADMIN"];

/**
 * Where a signed-in person is sent: the first surface their own role can render.
 *
 * A requester holds no `usage:read`, so `/dashboard/overview` would be a page of
 * refusals for them. Their tickets are the one surface that is actually theirs.
 */
export function landingPath(capabilities: readonly Capability[]): string {
  return capabilities.includes("usage:read") ? "/dashboard/overview" : "/dashboard/tickets";
}
