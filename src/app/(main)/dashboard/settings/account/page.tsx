import Link from "next/link";

import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/capabilities";
import { formatDate } from "@/lib/format";
import { requireSession } from "@/lib/tenant/server";

import { ProfileForm } from "./_components/profile-form";

export const metadata: Metadata = {
  title: "Account",
};

/**
 * The person, not the workspace.
 *
 * Everything here belongs to the account itself and follows it into every
 * organisation it is a member of — which is the reason it is not on the workspace
 * settings pages beside departments and members, where the same person can hold a
 * different role in each.
 */
export default async function AccountPage() {
  const session = await requireSession();
  const { user } = session;

  return (
    <div className="flex flex-col gap-5">
      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <span className="font-medium text-sm">Display name</span>
          <p className="text-muted-foreground text-sm">
            {user.display_name
              ? "Shown beside your tickets and runs. The workspace settings and this page both read it from your account."
              : "Nothing is set, so the console shows your email address wherever it needs to name you."}
          </p>
          <div className="pt-1">
            <ProfileForm displayName={user.display_name} />
          </div>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-2 p-4">
          <span className="font-medium text-sm">Sign-in</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-sm">{user.email}</span>
            <Badge variant="outline" className="font-normal">
              not editable
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            This address is the username — the console has no separate one — and it is where password reset links are
            mailed. <span className="text-foreground">PATCH /auth/me/</span> refuses it by name rather than ignoring it,
            so a form that sends it gets told why nothing changed.
          </p>
          <p className="text-muted-foreground text-sm">
            The password is a different page:{" "}
            <Link
              className="font-medium text-foreground underline-offset-4 hover:underline"
              href="/dashboard/settings/security"
            >
              Security
            </Link>
            {user.date_joined ? <> · this account was created on {formatDate(user.date_joined)}</> : null}.
          </p>
        </CardContent>
      </Card>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <span className="font-medium text-sm">Workspaces</span>
            <p className="text-muted-foreground text-sm">
              A role belongs to one workspace, not to you. The same address can be an administrator here and a requester
              somewhere else.
            </p>
          </div>

          {session.memberships.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This account is not a member of any workspace, so there is nothing to switch to.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {session.memberships.map((membership) => {
                const active = membership.organization_id === session.activeOrganizationId;
                return (
                  <li key={membership.organization_id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={active ? "font-medium" : "text-muted-foreground"}>
                      {membership.organization_name}
                    </span>
                    <Badge variant={active ? "secondary" : "outline"} className="font-normal">
                      {ROLE_LABELS[membership.role] ?? membership.role}
                    </Badge>
                    {membership.is_owner ? (
                      <Badge variant="outline" className="font-normal text-xs">
                        owner
                      </Badge>
                    ) : null}
                    {active ? <span className="text-muted-foreground text-xs">you are here</span> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
