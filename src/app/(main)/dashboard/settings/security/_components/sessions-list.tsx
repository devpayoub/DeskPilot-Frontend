"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { SignIn } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

/**
 * The rows, with no opinion about where they came from.
 *
 * Fetching and revoking live in `SecuritySections`, because the same response also
 * answers "when was this password last set" — and a page whose two cards disagree
 * about that date is worse than a page with one fetch.
 *
 * Revoking is not "sign out of that machine". The other browser keeps its access
 * token until it lapses, roughly fifteen minutes, and then finds it cannot renew.
 * Anything sharper would need the server to reach a browser it has never seen.
 */
export function SessionsList({
  sessions,
  loading,
  pendingJti,
  onRevoke,
  onReload,
}: {
  readonly sessions: SignIn[];
  readonly loading: boolean;
  readonly pendingJti: string | null;
  readonly onRevoke: (session: SignIn) => void;
  readonly onReload: () => void;
}) {
  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Spinner className="size-4" />
        Loading sign-ins…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No live sign-in is recorded for this account. Anything still open is running on an access token that cannot be
          renewed.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {sessions.map((session) => (
            <li key={session.jti} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0">
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">Signed in {formatDateTime(session.signed_in_at)}</span>
                  {session.current ? (
                    <Badge variant="secondary" className="font-normal">
                      this sign-in
                    </Badge>
                  ) : null}
                </div>
                <span className="text-muted-foreground text-xs">
                  Stops renewing {formatDateTime(session.expires_at)}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRevoke(session)}
                disabled={pendingJti !== null}
              >
                {pendingJti === session.jti ? <Spinner className="size-4" /> : null}
                {session.current ? "End and sign out" : "End"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={onReload} disabled={pendingJti !== null}>
          Check again
        </Button>
        <span className="text-muted-foreground text-xs">
          {sessions.length} live {sessions.length === 1 ? "credential" : "credentials"}
        </span>
      </div>
    </div>
  );
}
