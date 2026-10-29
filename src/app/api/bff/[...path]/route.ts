import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, ORG_COOKIE } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prefix allowlist. Anything not listed here is rejected before a request is
 * built, so this proxy cannot be turned into an open forwarder.
 *
 * These are DeskPilot's resource roots. `auth` is deliberately absent: login,
 * refresh and logout have their own routes that manage the session cookies.
 */
const ALLOWED_PREFIXES = new Set([
  "tickets",
  "runs",
  "tools",
  "guardrails",
  "evals",
  "directory",
  "stats",
]);

const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message, details: null, request_id: "" } }, { status });
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;

  if (!path?.length) {
    return jsonError(400, "invalid_proxy_path", "No API path provided.");
  }

  const [prefix] = path;
  if (!ALLOWED_PREFIXES.has(prefix)) {
    return jsonError(400, "invalid_proxy_path", "This API path is not proxied.");
  }

  for (const segment of path) {
    if (!SAFE_SEGMENT.test(segment) || segment === "." || segment === "..") {
      return jsonError(400, "invalid_proxy_path", "Invalid path segment.");
    }
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!accessToken) {
    return jsonError(401, "not_authenticated", "Your session has expired. Please sign in again.");
  }
  const organizationId = cookieStore.get(ORG_COOKIE)?.value;

  const search = new URL(request.url).search;
  // Every API route is registered with a trailing slash. Next removes it from the
  // incoming URL before this handler runs, and Django's APPEND_SLASH cannot
  // redirect a POST body — so it is restored here instead of at each call site.
  const target = `${env.apiBaseUrl}/api/v1/${path.map(encodeURIComponent).join("/")}/${search}`;

  const headers = new Headers({ accept: "application/json", authorization: `Bearer ${accessToken}` });
  if (organizationId) headers.set("x-organization-id", organizationId);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);

  const requestId = request.headers.get("x-request-id");
  if (requestId) headers.set("x-request-id", requestId);

  // Without this, Django's per-IP rate limits see a single address (this server).
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength > 0) body = buffer;
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return jsonError(502, "upstream_unavailable", "The API is unreachable. Please try again.");
  }

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get("content-type");
  if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
  const retryAfter = upstream.headers.get("retry-after");
  if (retryAfter) responseHeaders.set("retry-after", retryAfter);

  if (upstream.status === 204) {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  const payload = await upstream.arrayBuffer();
  const response = new Response(payload, { status: upstream.status, headers: responseHeaders });

  if (upstream.status === 401) {
    for (const name of [ACCESS_COOKIE, ORG_COOKIE]) {
      response.headers.append("set-cookie", `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`);
    }
  }

  return response;
}

export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
