import { forwardAuthenticated } from "@/lib/api/forward";
import { authorize, clearSessionCookies, jsonError, persistRotation } from "@/lib/auth/server-api";

/**
 * A JWT id is base64url text, and this one arrives from a URL segment that gets
 * placed inside the upstream path. Checked rather than sanitised, because anything
 * else is not a session this account could own.
 */
const JTI = /^[A-Za-z0-9_-]{8,128}$/;

export async function DELETE(request: Request, context: { params: Promise<{ jti: string }> }) {
  const { jti } = await context.params;

  if (!JTI.test(jti)) {
    return jsonError(400, "invalid_jti", "That sign-in id is not valid.");
  }

  const caller = await authorize();
  if (!caller) {
    return jsonError(401, "not_authenticated", "Your session has expired. Please sign in again.");
  }

  const forwarded = await forwardAuthenticated(request, `/auth/sessions/${jti}/`, {
    method: "DELETE",
    accessToken: caller.accessToken,
  });
  persistRotation(forwarded.response, caller);

  // Ending the sign-in you are standing on is a real thing to want — that is what
  // "sign out of this machine" means. But the cookie now holds a credential the
  // server refuses, so leaving it set would keep the page looking signed in until
  // the next refresh quietly failed.
  if (forwarded.response.ok && jti === caller.currentJti) {
    clearSessionCookies(forwarded.response);
  }

  return forwarded.response;
}
