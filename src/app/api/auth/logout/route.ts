import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, ORG_COOKIE, REFRESH_COOKIE } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  // Best-effort: blacklist the refresh token server-side. A failure here must
  // not keep the user signed in locally.
  if (refreshToken) {
    try {
      await fetch(`${env.apiBaseUrl}/api/v1/auth/logout/`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      });
    } catch {
      // Ignore — cookies are cleared below regardless.
    }
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(ORG_COOKIE);
  return response;
}
