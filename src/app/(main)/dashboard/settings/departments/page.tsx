import { redirect } from "next/navigation";

import { NetworkIcon } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { serverFetch } from "@/lib/api/server";
import type { Department } from "@/lib/api/types";
import { requireTenant } from "@/lib/tenant/server";

import { DepartmentActions } from "./_components/department-actions";
import { DepartmentCreate } from "./_components/department-create";

export const metadata: Metadata = {
  title: "Departments",
};

export default async function DepartmentsPage() {
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("org:read")) {
    redirect("/unauthorized");
  }

  // Only an administrator of *this* account can change the structure. Everyone
  // else can read it, because knowing where you sit is not privileged.
  const canManage = tenant.session.capabilities.includes("department:manage");

  const { results: departments } = await serverFetch<{ results: Department[] }>("/org/departments/", {
    query: { include_archived: 1 },
  });
  const nameById = new Map(departments.map((department) => [department.id, department.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-muted-foreground text-sm">
          Departments group the people who work this account — service desk, field technicians, whoever answers the
          queue. They are not the departments of the directory you support; those come from AD and are read-only here.
        </p>
        {canManage ? <DepartmentCreate departments={departments} /> : null}
      </div>

      {departments.length === 0 ? (
        <Card className="py-0">
          <CardContent className="px-0">
            <Empty className="border-none py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <NetworkIcon />
                </EmptyMedia>
                <EmptyTitle>No departments yet</EmptyTitle>
                <EmptyDescription>
                  {canManage
                    ? "Add one to group your staff. Tickets and members can then be scoped to it."
                    : "An administrator of this account can add the first one."}
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
                  <TableHead className="pl-4">Department</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{department.name}</span>
                        {department.code ? (
                          <Badge variant="outline" className="font-mono font-normal text-xs">
                            {department.code}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {department.parent_id ? (nameById.get(department.parent_id) ?? "—") : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{department.member_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={department.is_active ? "secondary" : "outline"} className="font-normal">
                        {department.is_active ? "active" : "archived"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      {canManage ? (
                        <DepartmentActions department={department} departments={departments} />
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
