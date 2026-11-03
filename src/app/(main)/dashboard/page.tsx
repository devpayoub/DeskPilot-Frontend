import { redirect } from "next/navigation";

import { landingPath } from "@/lib/auth/capabilities";
import { getSession } from "@/lib/auth/session";

export default async function Page() {
  // `/dashboard/overview` for everybody was a wall of refusals for the largest
  // group in the product: a requester holds no `usage:read`, so the overview's
  // account-wide numbers are not theirs to see. Their tickets are.
  //
  // Deliberately not `permanentRedirect`: the destination depends on who is asking,
  // and a 308 is cached by the browser against the URL, not against the session.
  // One requester following a redirect an administrator received would be sent to a
  // screen by someone else's permissions.
  const session = await getSession();
  redirect(session ? landingPath(session.capabilities) : "/auth/login");
}
