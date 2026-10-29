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
