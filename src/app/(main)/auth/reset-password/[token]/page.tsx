import type { Metadata } from "next";

import { ResetPasswordForm } from "../../_components/reset-password-form";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your DeskPilot account.",
  // A reset token is a live credential for the thirty minutes it is valid, and this
  // page loads scripts. Without this header the token can leave in a Referer value.
  referrer: "no-referrer",
};

/**
 * The page an emailed reset link lands on.
 *
 * The token is a path segment rather than `?token=`: query strings are what
 * analytics tools, proxy access logs and browser history keep longest, and this one
 * is not a page identifier but a password.
 */
export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl tracking-tight">Choose a new password</h1>
        <p className="text-muted-foreground text-sm">
          This link works once. Signing in anywhere else ends as soon as the new password is set.
        </p>
      </header>

      <ResetPasswordForm token={token} />
    </div>
  );
}
