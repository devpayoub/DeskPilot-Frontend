"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { SessionsResponse, SignIn } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

import { ChangePasswordForm } from "./change-password-form";
import { SessionsList } from "./sessions-list";

/**
 * The two security surfaces, sharing one read of the token ledger.
 *
 * They are wired together rather than each fetching for itself because a change of
 * password is also an event in the list: it ends every sign-in below and starts one
 * new one. Two independent fetches would mean a page that can show a stale date
 * under a heading about that same date.
 */
export function SecuritySections() {
  const [sessions, setSessions] = useState<SignIn[]>([]);
  const [passwordUpdatedAt, setPasswordUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [pendingJti, setPendingJti] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sessions", { headers: { accept: "application/json" } });
      if (!response.ok) {
        throw await ApiError.fromResponse(response);
      }
      const data = (await response.json()) as SessionsResponse;
      setSessions(data.sessions);
      setPasswordUpdatedAt(data.password_updated_at);
      setLoaded(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (session: SignIn) => {
    setPendingJti(session.jti);
    setError("");
    try {
      const response = await fetch(`/api/auth/sessions/${session.jti}`, {
        method: "DELETE",
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        throw await ApiError.fromResponse(response);
      }

      if (session.current) {
        // The route cleared the session cookies, since the token inside them is now
        // refused. Going to the sign-in page immediately beats leaving a console on
        // screen that still looks live.
        window.location.assign("/auth/login");
        return;
      }

      await load();
    } catch (caught) {
      // A 404 means the row this button was rendered from has already ended: the
      // backend rotates a refresh token out from under an open page, and the id on
      // screen is the one it just replaced. The list is now known to be wrong, so
      // reload it rather than leave sign-ins on offer that no longer exist.
      if (caught instanceof ApiError && caught.status === 404) {
        await load();
      }
      setError(errorMessage(caught));
    } finally {
      setPendingJti(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Password</span>
            <p className="text-muted-foreground text-sm">{lastChangedLine(loaded, passwordUpdatedAt)}</p>
          </div>
          <ChangePasswordForm onChanged={load} />
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Sign-ins</span>
            <p className="text-muted-foreground text-sm">
              Each row is one place this password can still open a session. The ledger records the credential, not the
              machine behind it, so there is no browser or address to show.
            </p>
          </div>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <SessionsList
            sessions={sessions}
            loading={loading}
            pendingJti={pendingJti}
            onRevoke={(session) => void revoke(session)}
            onReload={() => void load()}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * When the password was last set, in the words the data supports.
 *
 * A null here means the column predates the record, not "recently" and not "never" —
 * the account was created with a password like every other one, the console simply
 * did not write the date down at the time.
 */
function lastChangedLine(loaded: boolean, passwordUpdatedAt: string | null): string {
  if (!loaded) return "Reading your account…";
  if (!passwordUpdatedAt) return "No password change is recorded: this account predates that date being kept.";
  return `Last changed ${formatDateTime(passwordUpdatedAt)}. Every sign-in below started after it.`;
}
