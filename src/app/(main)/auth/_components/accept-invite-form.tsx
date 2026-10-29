"use client";

import { type FormEvent, useState } from "react";

import Link from "next/link";

import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, errorMessage } from "@/lib/api/errors";

const MIN_LENGTH = 8;

type Issued = { email: string; organization: string };

/**
 * Set a password against an invitation token.
 *
 * The two failures worth distinguishing are "that token is not valid any more"
 * (expired, already used, or invented) and "the passwords do not match" — so the
 * first is surfaced verbatim from the API and the second is caught here, before a
 * pointless round trip.
 */
export function AcceptInviteForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [issued, setIssued] = useState<Issued | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < MIN_LENGTH) {
      setError(`Choose a password of at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Those two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const failure = await ApiError.fromResponse(response);
        setError(errorMessage(failure));
        return;
      }

      const body = (await response.json()) as { email: string; organization: string };
      setIssued({ email: body.email, organization: body.organization });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  if (issued) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
          <CheckCircle2Icon className="mt-0.5 size-4 text-emerald-600 dark:text-emerald-400" />
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Password set</span>
            <span className="text-muted-foreground text-sm">
              You can now sign in to {issued.organization} as {issued.email}.
            </span>
          </div>
        </div>

        <Button asChild>
          <Link href="/auth/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-password">Password</Label>
        <Input
          id="invite-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          autoFocus
          required
          disabled={busy}
        />
        <p className="text-muted-foreground text-xs">At least {MIN_LENGTH} characters.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-confirm">Confirm password</Label>
        <Input
          id="invite-confirm"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
          disabled={busy}
        />
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" disabled={busy || !password || !confirm}>
        {busy ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
        Set password
      </Button>

      <p className="text-center text-muted-foreground text-xs">
        Invitations expire after seven days. If yours has, ask for a new one.
      </p>
    </form>
  );
}
