import type { ReactNode } from "react";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { CheckCircle2Icon } from "lucide-react";

import { BrandLockup } from "@/components/brand";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";
import { isTokenExpiringSoon } from "@/lib/auth/jwt";

const HIGHLIGHTS = [
  "Every answer screened before and after the model runs",
  "Grounding checks with cited source documents",
  "Per-request policy decisions you can audit",
];

export default async function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken && !isTokenExpiringSoon(accessToken)) {
    redirect("/dashboard/overview");
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:56px_56px]"
        />

        <div className="relative">
          <BrandLockup className="text-primary-foreground" tone="onDark" subtitle="Domain-restricted AI assistants" />
        </div>

        <div className="relative flex flex-col gap-6">
          <h1 className="font-display text-5xl leading-[1.02] tracking-tight">
            AI that stays
            <br />
            inside its lane.
          </h1>
          <p className="max-w-sm text-primary-foreground/70 text-sm leading-relaxed">
            Give customers a helpful assistant without giving the model a free rein. Define the domain, attach approved
            knowledge, and let the platform enforce the rest.
          </p>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-primary-foreground/80 text-sm">
                <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-brand-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-primary-foreground/40 text-xs">
          Multi-tenant · Role-based access · Idempotent chat API
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLockup />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
