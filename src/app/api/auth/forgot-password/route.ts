import { forwardPublicJson, readJson } from "@/lib/api/forward";

/**
 * Password reset, step one: ask the API to mail a link to an address.
 *
 * Passed through untouched. The API answers identically for an address with an
 * account and one without, so this route cannot become a way to list who is
 * registered — which is the whole reason it does not inspect the body beyond
 * trimming the email.
 */
export async function POST(request: Request) {
  const body = await readJson<{ email?: unknown }>(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  return forwardPublicJson("/auth/forgot-password/", request, { email });
}
