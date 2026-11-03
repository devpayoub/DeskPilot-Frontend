import Link from "next/link";

import type { Metadata } from "next";

import { redirectIfSignedIn } from "@/lib/auth/session-server";

import { RegisterForm } from "../_components/register-form";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Sign up with your email, verify it, and open your own workspace.",
};

export default async function RegisterPage() {
  await redirectIfSignedIn();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">
          A code to your email first, then the name of your company and a password.
        </p>
      </header>

      <RegisterForm />

      <p className="text-center text-muted-foreground text-xs">
        Already invited by a teammate?{" "}
        <Link href="/auth/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
