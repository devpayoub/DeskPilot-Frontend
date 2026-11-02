"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

/**
 * End the current session.
 *
 * A DeskPilot platform administrator lands on the unauthorised page because they
 * belong to no customer account. They still need a way out of it — signing out
 * and back in as a company administrator is exactly the path to a workspace.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const handleSignOut = async () => {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/auth/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <Button onClick={handleSignOut} disabled={pending} variant="outline" size="lg">
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
