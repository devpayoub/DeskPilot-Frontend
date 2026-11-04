import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  baseCookieOptions,
  ORG_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "@/lib/auth/cookies";
import { decodeJwtPayload, isTokenExpiringSoon } from "@/lib/auth/jwt";
import { refreshTokens } from "@/lib/auth/refresh";

/**
 * Server-side plumbing for the `/api/auth/*` routes that need a session.
 *
 * These could not reuse the `/api/bff` proxy, and the reason is the cookies. The
 * proxy forwards a bearer it read from the jar and never writes one back, because
 * it does not own the session; a password change does — the API hands it a brand
 * new pair to store — and revoking your own sign-in has to forget a token that is
 * now dead on the server.
 *
 * The second reason is freshness. `src/proxy.ts` refreshes on `/dashboard/:path*`
 * page loads, and an API route is not a page. A security tab left open past the
 * 15-minute access token would otherwise answer the next action with a 401 and
 * walk the person through the login screen in the middle of a form.
 */

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, details: null, request_id: "" } }, { status });
}

export type Caller = {
  accessToken: string;
  organizationId: string | null;
  /**
   * The id claim of the refresh token in this browser's cookie, when it has one.
   * The session list labels itself with it; nothing authorises on it.
   */
  currentJti: string | null;
  /**
   * A refresh token that replaced the one in the cookie during this call. The
   * backend blacklists the old one as it rotates, so a route that returns without
   * storing this logs the person out on their next request.
   */
  rotatedRefresh: string | null;
};

/**
 * The session behind this request, renewed if it is about to lapse.
 *
 * Null means there is nothing usable to forward: no access token, or one too old
 * to be saved by a refresh. Callers answer 401 in that case rather than sending a
 * request they know will fail.
 */
export async function authorize(): Promise<Caller | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value ?? null;
  const organizationId = store.get(ORG_COOKIE)?.value ?? null;

  if (!accessToken) return null;

  if (!isTokenExpiringSoon(accessToken)) {
    return toCaller(accessToken, organizationId, refreshToken, null);
  }

  if (!refreshToken) return null;

  const result = await refreshTokens(refreshToken);
  if (!result) return null;

  const rotated = result.refresh ?? null;
  // Whichever token this browser ends up keeping is the sign-in to label — after a
  // rotation that is the new one, since the old is already blacklisted.
  return toCaller(result.access, organizationId, rotated ?? refreshToken, rotated);
}

function toCaller(
  accessToken: string,
  organizationId: string | null,
  refreshToken: string | null,
  rotatedRefresh: string | null,
): Caller {
  const payload = decodeJwtPayload(refreshToken);
  const jti = typeof payload?.jti === "string" ? payload.jti : null;
  return { accessToken, organizationId, currentJti: jti, rotatedRefresh };
}

/**
 * Persist the pair a refresh produced on the way in.
 *
 * Both cookies, not just the refresh one, and for the reason `src/proxy.ts`
 * gives: a page load reads the access token from the jar. Leaving it stale means
 * the next navigation refreshes again for a token this route already had.
 */
export function persistRotation(response: NextResponse, caller: Caller): void {
  if (!caller.rotatedRefresh) return;

  response.cookies.set(ACCESS_COOKIE, caller.accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, caller.rotatedRefresh, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

/** Forget this browser's session. Used when the action just revoked the token it holds. */
export function clearSessionCookies(response: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, ORG_COOKIE]) {
    response.cookies.set(name, "", { ...baseCookieOptions, maxAge: 0 });
  }
}
