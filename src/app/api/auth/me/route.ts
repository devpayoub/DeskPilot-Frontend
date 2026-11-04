import { forwardAuthenticated, readJson } from "@/lib/api/forward";
import { authorize, jsonError, persistRotation } from "@/lib/auth/server-api";

async function handle(request: Request, method: "GET" | "PATCH", body?: unknown) {
  const caller = await authorize();
  if (!caller) {
    return jsonError(401, "not_authenticated", "Your session has expired. Please sign in again.");
  }

  const forwarded = await forwardAuthenticated(request, "/auth/me/", {
    method,
    accessToken: caller.accessToken,
    organizationId: caller.organizationId,
    body,
  });
  persistRotation(forwarded.response, caller);
  return forwarded.response;
}

/** The signed-in person, their accounts, and the capability map the API enforces. */
export function GET(request: Request) {
  return handle(request, "GET");
}

/**
 * Change the caller's own profile.
 *
 * The body is forwarded as the form sent it rather than filtered down to the one
 * editable field. That is deliberate: `/auth/me/` answers a request that includes
 * `email` by naming it, and a proxy that quietly dropped the field would turn that
 * explanation into a silent success — the page would say "saved" about an address
 * that did not change. Which keys are allowed is the API's answer, so it stays in
 * one place.
 */
export async function PATCH(request: Request) {
  const body = await readJson(request);
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return jsonError(400, "invalid_body", "Send a JSON object of the fields to change.");
  }

  return handle(request, "PATCH", body);
}
