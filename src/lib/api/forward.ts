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

export type Forwarded = {
  /** The API's answer, ready to return from the route handler. */
  response: NextResponse;
  /**
   * That same answer parsed, when it was JSON. Handed back with the response
   * rather than left to read from it because a body can only be consumed once, and
   * a change-password needs the tokens inside the response it is also forwarding.
   */
  json: unknown;
};

type AuthenticatedOptions = {
  accessToken: string;
  body?: unknown;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | undefined>;
  organizationId?: string | null;
};

/**
 * Forward a JSON request on behalf of the signed-in user.
 *
 * Used by session-scoped actions that are not plain resource CRUD and therefore
 * do not belong on the generic BFF proxy: changing a password, listing and
 * revoking sign-ins, editing one's own profile. The proxy exists for resources;
 * these own the session, which is the one thing it must not touch.
 *
 * Status, message and `Retry-After` pass straight through, so the throttled
 * "too many attempts" answer the API gives is the one the person reads.
 */
export async function forwardAuthenticated(
  request: Request,
  path: string,
  options: AuthenticatedOptions,
): Promise<Forwarded> {
  const url = new URL(`${env.apiBaseUrl}/api/v1${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value) url.searchParams.set(key, value);
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${options.accessToken}`,
  };
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.organizationId) headers["x-organization-id"] = options.organizationId;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers["x-forwarded-for"] = forwardedFor;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: options.method ?? "POST",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return {
      response: NextResponse.json(
        {
          error: {
            code: "upstream_unavailable",
            message: "The API is unreachable. Please try again.",
            details: null,
            request_id: "",
          },
        },
        { status: 502 },
      ),
      json: null,
    };
  }

  const text = upstream.status === 204 ? null : await upstream.text();

  const response = new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) response.headers.set("retry-after", retryAfter);

  return { response, json: parseJson(text) };
}

function parseJson(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
