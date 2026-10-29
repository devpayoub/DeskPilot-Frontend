import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, ACCESS_MAX_AGE, baseCookieOptions, REFRESH_COOKIE, REFRESH_MAX_AGE } from "@/lib/auth/cookies";
import { refreshTokens } from "@/lib/auth/refresh";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "not_authenticated", message: "No session to refresh.", details: null, request_id: "" } },
      { status: 401 },
    );
  }

  const result = await refreshTokens(refreshToken);

  if (!result) {
    const response = NextResponse.json(
      { error: { code: "session_expired", message: "Your session has expired.", details: null, request_id: "" } },
      { status: 401 },
    );
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, result.access, { ...baseCookieOptions, maxAge: ACCESS_MAX_AGE });
  if (result.refresh) {
    response.cookies.set(REFRESH_COOKIE, result.refresh, { ...baseCookieOptions, maxAge: REFRESH_MAX_AGE });
  }
  return response;
}
