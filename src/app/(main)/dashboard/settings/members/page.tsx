import { redirect } from "next/navigation";

import { UsersIcon } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serverFetch } from "@/lib/api/server";
import type { Department, OrganizationMember } from "@/lib/api/types";
import { ROLE_LABELS } from "@/lib/auth/capabilities";
import { requireTenant } from "@/lib/tenant/server";

import { AddMember } from "./_components/add-member";
import { MemberActions } from "./_components/member-actions";

export const metadata: Metadata = {
  title: "Members",
};

const STATUS_VARIANT: Record<OrganizationMember["status"], "secondary" | "outline" | "destructive"> = {
  active: "secondary",
  invited: "outline",
  disabled: "destructive",
};

export default async function MembersPage() {
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("member:read")) {
    redirect("/unauthorized");
  }

  const canManage = tenant.session.capabilities.includes("member:manage");

  const [{ results: members }, { results: departments }] = await Promise.all([
    serverFetch<{ results: OrganizationMember[] }>("/org/members/"),
    serverFetch<{ results: Department[] }>("/org/departments/").catch(
      () => ({ results: [] }) as { results: Department[] },
    ),
  ]);

  const activeDepartments = departments.filter((department) => department.is_active);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-muted-foreground text-sm">
          Everyone with access to <span className="text-foreground">{tenant.organizationName}</span>, and the role they
          hold here. A role applies to this account only — the same person can be a requester somewhere else.
        </p>
        {canManage ? <AddMember departments={activeDepartments} /> : null}
      </div>

      {members.length === 0 ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <Empty className="border-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>Nobody here yet</EmptyTitle>
                <EmptyDescription>
                  Add the first person to this account, with a password they can sign in with.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="pl-4">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{member.full_name}</span>
                          {member.is_owner ? (
                            <Badge variant="outline" className="font-normal text-xs">
                              owner
                            </Badge>
                          ) : null}
                        </div>
                        <span className="text-muted-foreground text-xs">{member.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ROLE_LABELS[member.role] ?? member.role}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{member.department_name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[member.status]} className="font-normal">
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {canManage ? (
                        <MemberActions member={member} departments={activeDepartments} />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
