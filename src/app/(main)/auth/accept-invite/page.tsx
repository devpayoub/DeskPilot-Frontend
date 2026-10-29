import Link from "next/link";

import type { Metadata } from "next";

import { AcceptInviteForm } from "../_components/accept-invite-form";

export const metadata: Metadata = {
  title: "Accept invitation",
  description: "Choose a password to join your team's workspace.",
};

export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl tracking-tight">You have been invited</h1>
        <p className="text-muted-foreground text-sm">Choose a password and you are in.</p>
      </header>

      {token ? (
        <AcceptInviteForm token={token} />
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-destructive text-sm">
            This link is missing its invitation token. Ask the person who invited you to send a new one.
          </p>
          <Link href="/auth/login" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
