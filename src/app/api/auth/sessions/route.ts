import { forwardAuthenticated } from "@/lib/api/forward";
import { authorize, jsonError, persistRotation } from "@/lib/auth/server-api";

/**
 * Every sign-in on this account that can still renew itself.
 *
 * The list is the API's, from SimpleJWT's ledger, and it is passed through as-is —
 * including its honest gaps. There is no device name or IP address in that table, so
 * there is none here either, whatever a security page might otherwise want to show.
 *
 * `current_jti` is added server-side from this browser's own refresh cookie. It only
 * decides which row is labelled as the one you are using now; the API treats it as a
 * display hint, not as authority, so a client cannot use it to touch another session.
 */
export async function GET(request: Request) {
  const caller = await authorize();
  if (!caller) {
    return jsonError(401, "not_authenticated", "Your session has expired. Please sign in again.");
  }

  const forwarded = await forwardAuthenticated(request, "/auth/sessions/", {
    method: "GET",
    accessToken: caller.accessToken,
    query: { current_jti: caller.currentJti ?? undefined },
  });
  persistRotation(forwarded.response, caller);
  return forwarded.response;
}
