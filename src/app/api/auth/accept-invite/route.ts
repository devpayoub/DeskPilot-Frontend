import { NextResponse } from "next/server";

import { env } from "@/lib/env";

/**
 * Public invitation acceptance.
 *
 * Deliberately not routed through the BFF: that proxy requires a session cookie,
 * and the entire point of an invitation is that the person does not have one yet.
 * Nothing is authenticated here — the token *is* the credential, it is single-use
 * and it expires, and it is checked by Django, not by this handler.
 */
function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, details: null, request_id: "" } }, { status });
}

export async function POST(request: Request) {
  let body: { token?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { token?: unknown; password?: unknown };
  } catch {
    return jsonError(400, "invalid_body", "Send a JSON body with a token and a password.");
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!token || !password) {
    return jsonError(400, "invalid_invite", "An invitation token and a password are required.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${env.apiBaseUrl}/api/v1/org/invites/accept/`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
      cache: "no-store",
    });
  } catch {
    return jsonError(502, "upstream_unavailable", "The API is unreachable. Please try again.");
  }

  const payload = await upstream.text();
  return new NextResponse(payload, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
