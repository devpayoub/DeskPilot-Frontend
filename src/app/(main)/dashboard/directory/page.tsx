import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { serverFetch, serverFetchPage } from "@/lib/api/server";
import type { Device, Employee, Paginated } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { requireTenant } from "@/lib/tenant/server";

export const metadata: Metadata = {
  title: "Directory",
};

type SearchParams = { page?: string };

export default async function DirectoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const tenant = await requireTenant();

  if (!tenant.session.capabilities.includes("directory:read")) {
    redirect("/unauthorized");
  }

  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const [employeePage, devicePage] = await Promise.all([
    serverFetchPage<Employee>("/directory/employees/", { query: { page } }),
    serverFetch<Paginated<Device>>("/directory/devices/", { query: { page_size: 100 } }).catch(
      () => ({ count: 0, next: null, previous: null, page: 1, page_size: 100, results: [] }) as Paginated<Device>,
    ),
  ]);
  const employees = employeePage.results;
  const devices = devicePage.results;

  const locked = employees.filter((employee) => employee.locked_out).length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Directory"
        description="The account and device tenant the agent reads from. A seeded fake by default, swappable for LDAP behind the same interface."
      />

      <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
        <span>{employees.length} people</span>
        <span>·</span>
        <span>{devices.length} devices</span>
        {locked ? (
          <>
            <span>·</span>
            <span className="text-amber-600 dark:text-amber-400">{locked} locked out</span>
          </>
        ) : null}
      </div>

      <Card className="overflow-hidden py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Account</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead className="pr-4 text-right">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const device = devices.find((row) => row.assigned_to === employee.sam);

                return (
                  <TableRow key={employee.sam}>
                    <TableCell className="pl-4 font-mono text-sm">{employee.sam}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">{employee.display_name}</span>
                        <span className="text-muted-foreground text-xs">{employee.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{employee.department || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={employee.account_enabled ? "secondary" : "destructive"} className="font-normal">
                          {employee.account_enabled ? "enabled" : "disabled"}
                        </Badge>
                        {employee.locked_out === true ? (
                          <Badge variant="destructive" className="font-normal">
                            locked
                          </Badge>
                        ) : employee.locked_out === null ? (
                          // Not "unlocked": the backend genuinely cannot tell us.
                          <Badge variant="outline" className="font-normal">
                            lockout unknown
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[16rem] text-muted-foreground text-xs">
                      {employee.groups.length ? employee.groups.join(", ") : "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right text-muted-foreground text-sm tabular-nums">
                      {device ? formatDateTime(device.last_seen) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationBar
        basePath="/dashboard/directory"
        params={{}}
        page={employeePage.page}
        count={employeePage.count}
        pageSize={employeePage.page_size}
      />
    </div>
  );
}
