import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";

import type { LoginResponse, Membership, MeResponse, User } from "@/lib/api/types";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  baseCookieOptions,
  ORG_COOKIE,
  ORG_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "@/lib/auth/cookies";
import { isTokenExpiringSoon } from "@/lib/auth/jwt";
import { env } from "@/lib/env";

export type SessionPayload = {
  user: User;
  memberships: Membership[];
  organizationId: string | null;
};

export type EstablishSessionResult =
  | { ok: true; session: SessionPayload; access: string; refresh: string }
  | { ok: false; status: number; body: string; contentType: string };

/**
 * Exchange credentials for a session.
 *
 * Two upstream calls are required: `/auth/login/` returns the tokens and user,
 * `/auth/me/` returns the memberships we need to pick an active organization.
 */
export async function establishSession(options: {
  email: string;
  password: string;
  forwardedFor?: string | null;
}): Promise<EstablishSessionResult> {
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  if (options.forwardedFor) headers["x-forwarded-for"] = options.forwardedFor;

  const loginResponse = await fetch(`${env.apiBaseUrl}/api/v1/auth/login/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email: options.email, password: options.password }),
    cache: "no-store",
  });

  if (!loginResponse.ok) {
    return {
      ok: false,
      status: loginResponse.status,
      body: await loginResponse.text(),
      contentType: loginResponse.headers.get("content-type") ?? "application/json",
    };
  }

  const tokens = (await loginResponse.json()) as LoginResponse;

  const meResponse = await fetch(`${env.apiBaseUrl}/api/v1/auth/me/`, {
    headers: { authorization: `Bearer ${tokens.access}`, accept: "application/json" },
    cache: "no-store",
  });

  const me = meResponse.ok ? ((await meResponse.json()) as MeResponse) : null;
  const organizationId = me?.memberships?.[0]?.organization_id ?? null;

  return {
    ok: true,
    access: tokens.access,
    refresh: tokens.refresh,
    session: {
      user: tokens.user,
      memberships: me?.memberships ?? [],
      organizationId,
    },
  };
}

/**
 * The session as the console needs it, from a response that already carries the
 * membership.
 *
 * `/auth/register/` returns the organisation it just created, so asking
 * `/auth/me/` which account the caller is in would be a second round trip to learn
 * what the first one already said.
 */
export function sessionFromMembership(user: User, organization: Membership): SessionPayload {
  return { user, memberships: [organization], organizationId: organization.organization_id };
}

/** Attach the three session cookies to an outgoing response. */
export function applySessionCookies(
  response: NextResponse,
  tokens: { access: string; refresh: string; organizationId: string | null },
): void {
  response.cookies.set(ACCESS_COOKIE, tokens.access, { ...baseCookieOptions, maxAge: ACCESS_MAX_AGE });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh, { ...baseCookieOptions, maxAge: REFRESH_MAX_AGE });
  if (tokens.organizationId) {
    response.cookies.set(ORG_COOKIE, tokens.organizationId, { ...baseCookieOptions, maxAge: ORG_MAX_AGE });
  }
}

/**
 * Send a browser that already holds a session away from a sign-in style page.
 *
 * This used to sit in `auth/layout.tsx`, which covers every page under `/auth/` —
 * including the reset link. A signed-in browser is exactly the one that can be
 * holding a link asked for from another device, and bouncing it to the dashboard
 * throws a live credential away with no explanation. The guard therefore belongs
 * on the pages that offer to start a session, not on the shell around all of them.
 */
export async function redirectIfSignedIn(): Promise<void> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken && !isTokenExpiringSoon(accessToken)) {
    // Resolved by `/dashboard` itself, so the landing page is decided in one place
    // and follows the role rather than hardcoding a screen requesters cannot open.
    redirect("/dashboard");
  }
}
