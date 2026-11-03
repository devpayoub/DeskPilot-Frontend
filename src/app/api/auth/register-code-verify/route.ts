import { forwardPublicJson, readJson } from "@/lib/api/forward";

/**
 * Sign-up step two: check the code, get the single-use token for step three.
 *
 * The token is high-entropy and short-lived, and it is what the password is
 * finally submitted against — the six-digit code never crosses the wire twice.
 */
export async function POST(request: Request) {
  const body = await readJson<{ email?: unknown; code?: unknown }>(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  return forwardPublicJson("/auth/register-code-verify/", request, { email, code });
}
