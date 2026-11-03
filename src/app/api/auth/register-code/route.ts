import { forwardPublicJson, readJson } from "@/lib/api/forward";

/**
 * Sign-up step one: ask the API to put a code on an address.
 *
 * Passed through untouched, and that is the whole design — the API answers
 * identically whether or not the address is free, so this page cannot be used to
 * list who already has an account. Nothing here adds a session: there is nothing
 * to session yet.
 */
export async function POST(request: Request) {
  const body = await readJson<{ email?: unknown }>(request);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  return forwardPublicJson("/auth/register-code/", request, { email });
}
