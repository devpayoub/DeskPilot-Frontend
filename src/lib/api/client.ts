"use client";

import { toast } from "sonner";

import { ApiError } from "./errors";

/**
 * Browser-side API client.
 *
 * Every call goes to the same-origin BFF, which attaches the httpOnly session
 * cookie and forwards to Django. No token is ever readable from JavaScript.
 */
type RequestOptions = {
  /** Sent as `Idempotency-Key`; the API replays the original response for 24h. */
  idempotencyKey?: string;
};

async function request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    accept: "application/json",
    ...(init.body instanceof FormData ? {} : init.body ? { "content-type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (options.idempotencyKey) {
    headers["idempotency-key"] = options.idempotencyKey;
  }

  const response = await fetch(`/api/bff/${path.replace(/^\//, "")}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 401) {
    // The BFF already cleared the session cookies. Refresh only happens in the
    // proxy, so a 401 here means the session is genuinely gone: send the user to
    // sign in and bring them back to where they were.
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/dashboard")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.assign(`/auth/login?next=${next}`);
    }
    throw await ApiError.fromResponse(response);
  }

  if (response.status === 429) {
    const error = await ApiError.fromResponse(response);
    toast.error(
      error.retryAfter
        ? `Too many requests. Try again in ${error.retryAfter}s.`
        : "Too many requests. Please slow down.",
    );
    throw error;
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }, options);
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: formData });
}
