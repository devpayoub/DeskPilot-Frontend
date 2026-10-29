import Link from "next/link";

import type { Metadata } from "next";

import { LoginForm } from "../_components/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your workspace.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-semibold text-2xl tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Sign in to manage your assistants.</p>
      </header>

      <LoginForm nextPath={next} />

      <p className="text-center text-muted-foreground text-sm">
        New here?{" "}
        <Link href="/auth/register" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
