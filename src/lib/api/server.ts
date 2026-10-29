import "server-only";

import { cookies } from "next/headers";

import { ACCESS_COOKIE, ORG_COOKIE } from "@/lib/auth/cookies";
import { env } from "@/lib/env";

import { ApiError } from "./errors";
import type { Paginated } from "./types";

type QueryValue = string | number | boolean | undefined | null;

export type ServerFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  accessToken?: string | null;
  organizationId?: string | null;
  headers?: Record<string, string>;
  cache?: RequestCache;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${env.apiBaseUrl}/api/v1${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Server-side API call.
 *
 * Deliberately does **not** refresh tokens: React Server Components cannot set
 * cookies, so a refresh here would silently discard the rotated token and log
 * the user out. Refresh happens in `proxy.ts`; a 401 here means the session is
 * genuinely gone and callers should redirect.
 */
export async function serverFetch<T>(path: string, options: ServerFetchOptions = {}): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = options.accessToken ?? cookieStore.get(ACCESS_COOKIE)?.value ?? null;
  const organizationId = options.organizationId ?? cookieStore.get(ORG_COOKIE)?.value ?? null;

  const headers = new Headers({ accept: "application/json", ...options.headers });
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  if (organizationId) headers.set("x-organization-id", organizationId);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body,
    cache: options.cache ?? "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  return (await response.json()) as T;
}

/** Convenience wrapper for pages that render an empty state instead of failing. */
export async function serverFetchOrNull<T>(path: string, options: ServerFetchOptions = {}): Promise<T | null> {
  try {
    return await serverFetch<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403 || error.status === 404)) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch a paginated list, tolerating a page that no longer exists.
 *
 * DRF answers an out-of-range page with 404 "Invalid page". That is correct for
 * an API, and wrong for a page: rows get deleted, links go stale, and someone
 * types a number into the URL. Landing on an error page for that is worse than
 * showing them page 1.
 */
export async function serverFetchPage<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<Paginated<T>> {
  try {
    return await serverFetch<Paginated<T>>(path, options);
  } catch (error) {
    const askedForPage = options.query?.page;
    if (error instanceof ApiError && error.status === 404 && askedForPage) {
      return serverFetch<Paginated<T>>(path, { ...options, query: { ...options.query, page: 1 } });
    }
    throw error;
  }
}
