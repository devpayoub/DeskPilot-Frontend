import type { ApiErrorBody } from "./types";

/**
 * Normalised API failure.
 *
 * The backend always answers with `{error: {code, message, details, request_id}}`,
 * so one class covers validation, auth, quota and provider failures.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | null;
  readonly requestId: string;
  readonly retryAfter: number | null;

  constructor(options: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
    requestId?: string;
    retryAfter?: number | null;
  }) {
    super(options.message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details ?? null;
    this.requestId = options.requestId ?? "";
    this.retryAfter = options.retryAfter ?? null;
  }

  /** Field-level errors for `validation_error` responses. */
  get fieldErrors(): Record<string, string[]> {
    if (!this.details) return {};
    const result: Record<string, string[]> = {};
    for (const [field, value] of Object.entries(this.details)) {
      if (Array.isArray(value)) {
        result[field] = value.map(String);
      } else if (typeof value === "string") {
        result[field] = [value];
      }
    }
    return result;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfter = retryAfterHeader && Number.isFinite(Number(retryAfterHeader)) ? Number(retryAfterHeader) : null;

    let body: Partial<ApiErrorBody> | null = null;
    try {
      body = (await response.json()) as Partial<ApiErrorBody>;
    } catch {
      body = null;
    }

    const payload = body?.error;
    return new ApiError({
      status: response.status,
      code: payload?.code ?? fallbackCode(response.status),
      message: payload?.message ?? fallbackMessage(response.status),
      details: payload?.details ?? null,
      requestId: payload?.request_id ?? "",
      retryAfter,
    });
  }
}

function fallbackCode(status: number): string {
  if (status === 401) return "not_authenticated";
  if (status === 403) return "permission_denied";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "request_failed";
}

function fallbackMessage(status: number): string {
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "We could not find that resource.";
  if (status === 429) return "Too many requests. Please try again shortly.";
  if (status >= 500) return "The server could not complete the request.";
  return "The request could not be completed.";
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Human-readable message for toasts and inline errors. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "rate_limited" && error.retryAfter) {
      return `Too many attempts. Try again in ${error.retryAfter}s.`;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
