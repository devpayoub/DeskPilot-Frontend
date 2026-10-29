import { NextResponse } from "next/server";

import { env } from "@/lib/env";

/**
 * Forward an unauthenticated JSON request to the API and pass the response
 * through unchanged (status, body, content type).
 *
 * Used by the pre-session flows: password reset and email verification.
 */
export async function forwardPublicJson(path: string, request: Request, body: unknown): Promise<Response> {
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;

  const upstream = await fetch(`${env.apiBaseUrl}/api/v1${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

/**
 * Forward a JSON request on behalf of the signed-in user.
 *
 * Used by session-scoped actions that are not plain resource CRUD and therefore
 * do not belong on the generic BFF proxy (password change, verification resend,
 * account deactivation).
 */
export async function forwardAuthenticated(
  request: Request,
  path: string,
  options: { accessToken: string; body?: unknown; method?: "POST" | "PATCH" | "DELETE" },
): Promise<Response> {
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${options.accessToken}`,
  };
  if (options.body !== undefined) headers["content-type"] = "application/json";

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;

  const upstream = await fetch(`${env.apiBaseUrl}/api/v1${path}`, {
    method: options.method ?? "POST",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (upstream.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
