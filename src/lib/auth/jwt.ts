/**
 * Minimal JWT inspection.
 *
 * The frontend never verifies signatures — it has no signing key, and Django
 * remains the only authority. This is used solely to decide *when* to refresh.
 */
export type JwtPayload = {
  exp?: number;
  iat?: number;
  user_id?: string;
  token_type?: string;
  [claim: string]: unknown;
};

export function decodeJwtPayload(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;

  const segments = token.split(".");
  if (segments.length < 2) return null;

  try {
    const normalized = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = atob(padded);
    const json = decodeURIComponent(
      Array.from(decoded)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** True when the token is missing, malformed, or expires within `skewSeconds`. */
export function isTokenExpiringSoon(token: string | undefined | null, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 - Date.now() <= skewSeconds * 1000;
}
