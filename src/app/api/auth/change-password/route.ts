import { NextResponse } from "next/server";

import { forwardAuthenticated, readJson } from "@/lib/api/forward";
import type { ChangePasswordResponse } from "@/lib/api/types";
import { authorize, jsonError, persistRotation } from "@/lib/auth/server-api";
import { applySessionCookies } from "@/lib/auth/session-server";

/**
 * Change the password from inside the account — the security page, not a reset link.
 *
 * Three things happen upstream: the current password is checked, the new one has to
 * pass the strength rules, and every sign-in on the account is revoked. The API then
 * mints a replacement pair, which is what lets the tab that asked for this stay open
 * while the laptop at home is logged out.
 *
 * That pair belongs in this browser's cookie jar and nowhere else. The tokens are
 * read off the response here and deliberately not forwarded: the page gets the
 * count of ended sign-ins, which is the part it can show.
 */
export async function POST(request: Request) {
  const caller = await authorize();
  if (!caller) {
    return jsonError(401, "not_authenticated", "Your session has expired. Please sign in again.");
  }

  const body = await readJson<{ current_password?: unknown; password?: unknown }>(request);
  const currentPassword = typeof body?.current_password === "string" ? body.current_password : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!currentPassword || !password) {
    return jsonError(400, "invalid_body", "Send your current password and the new one.");
  }

  const forwarded = await forwardAuthenticated(request, "/auth/change-password/", {
    method: "POST",
    accessToken: caller.accessToken,
    body: { current_password: currentPassword, password },
  });
  persistRotation(forwarded.response, caller);

  if (!forwarded.response.ok) return forwarded.response;

  const done = forwarded.json as ChangePasswordResponse;
  const response = NextResponse.json({
    revoked_sessions: done.revoked_sessions,
    user: done.user,
  });
  applySessionCookies(response, {
    access: done.access,
    refresh: done.refresh,
    organizationId: caller.organizationId,
  });
  return response;
}
