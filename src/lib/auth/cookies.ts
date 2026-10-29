/**
 * Session cookie contract.
 *
 * All three cookies are httpOnly: the browser never reads a token, so an XSS bug
 * cannot exfiltrate a session. Django is only ever called server-to-server with
 * a Bearer header, which also means the cookies are not a CSRF surface.
 */
export const ACCESS_COOKIE = "ap_at";
export const REFRESH_COOKIE = "ap_rt";
export const ORG_COOKIE = "ap_org";

/** Access tokens live 15 minutes on the backend. */
export const ACCESS_MAX_AGE = 60 * 15;
/** Refresh tokens live 7 days on the backend. */
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;
/** Remembered organization selection. */
export const ORG_MAX_AGE = 60 * 60 * 24 * 30;

const isProduction = process.env.NODE_ENV === "production";

export const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
} as const;

export type SessionTokens = {
  access: string;
  refresh?: string;
};

/**
 * Rewrite the outgoing `cookie` header for a proxied request.
 *
 * Next's proxy can set response cookies, but the RSC render of the *current*
 * request still sees the old header. Without this rewrite the page renders with
 * an expired token and bounces back to the login screen.
 */
export function withUpdatedCookies(
  currentHeader: string | null,
  updates: Record<string, string | null | undefined>,
): string {
  const jar = new Map<string, string>();

  for (const part of (currentHeader ?? "").split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    jar.set(trimmed.slice(0, separator), trimmed.slice(separator + 1));
  }

  for (const [name, value] of Object.entries(updates)) {
    if (value === null || value === undefined) {
      jar.delete(name);
    } else {
      jar.set(name, value);
    }
  }

  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}
