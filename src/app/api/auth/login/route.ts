import { NextResponse } from "next/server";

import { applySessionCookies, establishSession } from "@/lib/auth/session-server";

type LoginBody = { email?: unknown; password?: unknown };

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, details: null, request_id: "" } }, { status });
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return jsonError(400, "invalid_body", "Send a JSON body with email and password.");
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return jsonError(400, "invalid_credentials", "Email and password are required.");
  }

  const result = await establishSession({
    email,
    password,
    forwardedFor: request.headers.get("x-forwarded-for"),
  });

  if (!result.ok) {
    return new NextResponse(result.body, {
      status: result.status,
      headers: { "content-type": result.contentType },
    });
  }

  const response = NextResponse.json(result.session);
  applySessionCookies(response, {
    access: result.access,
    refresh: result.refresh,
    organizationId: result.session.organizationId,
  });
  return response;
}
