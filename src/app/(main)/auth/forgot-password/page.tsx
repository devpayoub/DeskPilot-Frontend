import Link from "next/link";

import type { Metadata } from "next";

import { ForgotPasswordForm } from "../_components/forgot-password-form";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Email a one-time link to take back your DeskPilot account.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground text-sm">
          Tell us the address on your account and we will email a link that works once.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="text-center text-muted-foreground text-sm">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
