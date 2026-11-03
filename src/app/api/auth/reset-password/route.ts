import { NextResponse } from "next/server";

import { readJson } from "@/lib/api/forward";
import { applySessionCookies, establishSession } from "@/lib/auth/session-server";
import { env } from "@/lib/env";

/**
 * Password reset, step two: the token from the emailed link, and the new password.
 *
 * On success the console is signed in with that password. The API hands back the
 * account's email precisely so this route can open the session — and going through
 * the normal login makes the reset prove itself: a password that resets but does
 * not sign in is a broken flow that nobody would notice until the next time the
 * person is locked out.
 *
 * Every other session for the account is already gone; the API blacklists the
 * outstanding refresh tokens when it writes the password.
 */
export async function POST(request: Request) {
  const body = await readJson<{ token?: unknown; password?: unknown }>(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  let upstream: Response;
  try {
    upstream = await fetch(`${env.apiBaseUrl}/api/v1/auth/reset-password/`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(request.headers.get("x-forwarded-for")
          ? { "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "" }
          : {}),
      },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "upstream_unavailable",
          message: "The API is unreachable. Please try again.",
          details: null,
          request_id: "",
        },
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
    });
  }

  const done = (await upstream.json()) as { email?: string };
  const email = typeof done.email === "string" ? done.email : "";

  const result = email ? await establishSession({ email, password }) : null;
  if (!result?.ok) {
    // The password is changed either way, so the link is spent and the person can
    // still sign in by hand. Say what happened rather than pretending a session
    // exists.
    return NextResponse.json({ done: true, signedIn: false });
  }

  const response = NextResponse.json({ ...result.session, done: true, signedIn: true });
  applySessionCookies(response, {
    access: result.access,
    refresh: result.refresh,
    organizationId: result.session.organizationId,
  });
  return response;
}
