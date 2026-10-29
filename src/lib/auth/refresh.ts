import { env } from "@/lib/env";

export type RefreshResult = {
  access: string;
  refresh: string | null;
};

/**
 * In-flight refreshes keyed by refresh token.
 *
 * The backend rotates refresh tokens and blacklists the previous one, so two
 * concurrent refreshes would invalidate each other and log the user out.
 * Collapsing them into a single promise is what keeps the session alive.
 *
 * This covers a single Node process (`next start`, `next dev`). Multi-instance
 * deployments would need a shared lock (Redis); out of scope for now.
 */
const inFlight = new Map<string, Promise<RefreshResult | null>>();

export async function refreshTokens(refreshToken: string): Promise<RefreshResult | null> {
  const existing = inFlight.get(refreshToken);
  if (existing !== undefined) return existing;

  const promise = performRefresh(refreshToken).finally(() => {
    inFlight.delete(refreshToken);
  });

  inFlight.set(refreshToken, promise);
  return promise;
}

async function performRefresh(refreshToken: string): Promise<RefreshResult | null> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { access?: string; refresh?: string };
    if (!data.access) return null;

    return { access: data.access, refresh: data.refresh ?? null };
  } catch {
    return null;
  }
}
