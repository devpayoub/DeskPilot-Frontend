import type { Role } from "@/lib/api/types";

/**
 * Role → capability map.
 *
 * Mirrors the role ladder and each tool's `allowed_roles` in
 * `backend/apps/accounts/models.py` and `packages/toolcore`. This is a
 * *presentation* aid only: the API re-checks every action server-side, so a drift
 * bug here can hide a button but never grant access.
 */
export const CAPABILITIES = [
  "ticket:read",
  "ticket:write",
  "run:trigger",
  "tool:read",
  "tool:invoke",
  "approval:read",
  "approval:decide",
  "audit:read",
  "usage:read",
  "eval:read",
  "directory:read",
  "policy:write",
  "killswitch:write",
  // Tenancy. `org:read` is "see which account I am in"; the two `:manage` entries
  // are what a *client administrator* — not a platform operator — is allowed to do
  // inside their own account.
  "org:read",
  "member:read",
  "department:manage",
  "member:manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

/**
 * A requester sees only their own tickets. They can raise one and read it — they
 * can never trigger the agent, approve anything, or look at another person's
 * account, which is also what the API enforces.
 */
const REQUESTER: Capability[] = ["ticket:read", "org:read"];

const SERVICE_DESK: Capability[] = [
  ...REQUESTER,
  "ticket:write",
  "tool:read",
  "approval:read",
  "audit:read",
  "usage:read",
  // Seeing who is in the account is a desk-level thing; changing it is not.
  "member:read",
];

const TECHNICIAN: Capability[] = [...SERVICE_DESK, "run:trigger", "tool:invoke", "approval:decide", "directory:read"];

const ADMIN: Capability[] = [
  ...TECHNICIAN,
  "eval:read",
  "policy:write",
  "killswitch:write",
  // Adding departments and people to your own account. Scoped server-side to the
  // organisation in the session — this flag never grants cross-tenant access.
  "department:manage",
  "member:manage",
];

export const ROLE_CAPABILITIES: Record<Role, Capability[]> = {
  REQUESTER,
  SERVICE_DESK,
  TECHNICIAN,
  ADMIN,
};

export function capabilitiesForRole(role: Role | null | undefined): Capability[] {
  if (!role) return [];
  return ROLE_CAPABILITIES[role] ?? [];
}

export function roleCan(role: Role | null | undefined, capability: Capability): boolean {
  return capabilitiesForRole(role).includes(capability);
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  TECHNICIAN: "Technician",
  SERVICE_DESK: "Service desk",
  REQUESTER: "Requester",
};

/** Roles that can be assigned to a person, highest privilege last. */
export const ASSIGNABLE_ROLES: Role[] = ["REQUESTER", "SERVICE_DESK", "TECHNICIAN", "ADMIN"];
