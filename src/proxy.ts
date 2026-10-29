import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  baseCookieOptions,
  ORG_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  withUpdatedCookies,
} from "@/lib/auth/cookies";
import { isTokenExpiringSoon } from "@/lib/auth/jwt";
import { refreshTokens } from "@/lib/auth/refresh";

/**
 * Session guard for the dashboard.
 *
 * Refresh happens here and only here: React Server Components cannot set
 * cookies, so a refresh inside `serverFetch` would drop the rotated token and
 * log the user out on the next request.
 *
 * Two things must happen together for a refresh to be visible immediately:
 *   1. `Set-Cookie` on the response, so the browser stores the new token.
 *   2. A rewritten `cookie` request header, so *this* render already sees it.
 * Skipping (2) causes a redirect loop right after a token expires.
 */
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

  if (accessToken && !isTokenExpiringSoon(accessToken)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const result = await refreshTokens(refreshToken);
  if (!result) {
    return redirectToLogin(request, { clearSession: true });
  }

  const nextRefreshToken = result.refresh ?? refreshToken;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    "cookie",
    withUpdatedCookies(request.headers.get("cookie"), {
      [ACCESS_COOKIE]: result.access,
      [REFRESH_COOKIE]: nextRefreshToken,
    }),
  );

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set(ACCESS_COOKIE, result.access, { ...baseCookieOptions, maxAge: ACCESS_MAX_AGE });
  response.cookies.set(REFRESH_COOKIE, nextRefreshToken, { ...baseCookieOptions, maxAge: REFRESH_MAX_AGE });
  return response;
}

function redirectToLogin(request: NextRequest, options: { clearSession?: boolean } = {}) {
  const url = new URL("/auth/login", request.url);
  const target = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (target && target !== "/dashboard") {
    url.searchParams.set("next", target);
  }

  const response = NextResponse.redirect(url);
  if (options.clearSession) {
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    response.cookies.delete(ORG_COOKIE);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
