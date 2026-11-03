import { NextResponse } from "next/server";

import { readJson } from "@/lib/api/forward";
import type { Membership, User } from "@/lib/api/types";
import { applySessionCookies, sessionFromMembership } from "@/lib/auth/session-server";
import { env } from "@/lib/env";

type RegisterResponse = {
  access: string;
  refresh: string;
  user: User;
  organization: Membership;
};

/**
 * Sign-up step three: company name and password, and the console is signed in.
 *
 * The API returns tokens with the account it created, so this is where the httpOnly
 * cookies are set — the same two cookies `/auth/login/` would have written, from
 * the same response that proves the address was verified.
 */
export async function POST(request: Request) {
  const body = await readJson<{ verification?: unknown; company_name?: unknown; password?: unknown }>(request);
  const verification = typeof body?.verification === "string" ? body.verification : "";
  const companyName = typeof body?.company_name === "string" ? body.company_name.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  let upstream: Response;
  try {
    upstream = await fetch(`${env.apiBaseUrl}/api/v1/auth/register/`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ verification, company_name: companyName, password }),
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

  const issued = (await upstream.json()) as RegisterResponse;
  const response = NextResponse.json(sessionFromMembership(issued.user, issued.organization));
  applySessionCookies(response, {
    access: issued.access,
    refresh: issued.refresh,
    organizationId: issued.organization.organization_id,
  });
  return response;
}
