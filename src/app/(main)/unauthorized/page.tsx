import Link from "next/link";

import { Lock } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";

import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Where a session lands when it is not allowed to proceed.
 *
 * Two different situations end up here, and they need different answers:
 *
 * * a **member** who lacks a capability — they have a workspace, they just
 *   cannot see this page, so the way back is their dashboard;
 * * a **DeskPilot platform administrator** — they belong to no customer
 *   account at all, so there is no dashboard to go back to and the link would
 *   bounce them straight back here. Their way forward is to sign out and sign
 *   in as a company administrator.
 */
export default async function page() {
  const session = await getSession();
  const hasWorkspace = Boolean(session?.activeOrganization);

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <Lock className="text-primary mx-auto size-12" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Unauthorized Access</h1>

        {hasWorkspace ? (
          <>
            <p className="text-muted-foreground mt-4">
              You do not have permission to view the requested content. Please contact the site administrator if you
              believe this is an error.
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href="/dashboard" prefetch={false}>
                  Go to Homepage
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground mt-4">
              {session
                ? "You are signed in as a DeskPilot platform administrator, and you do not belong to any customer workspace."
                : "You are not signed in, or your session has expired."}{" "}
              {session
                ? "Platform administrators operate DeskPilot itself rather than a customer account, so there is no workspace to open."
                : "Sign in with an account that belongs to a workspace to continue."}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {session ? <SignOutButton /> : null}
              <Button asChild size="lg">
                <Link href="/auth/login" prefetch={false}>
                  {session ? "Sign in as someone else" : "Sign in"}
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
