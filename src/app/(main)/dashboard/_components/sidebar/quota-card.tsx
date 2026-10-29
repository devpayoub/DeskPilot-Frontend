import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type QuotaSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  periodEnd: string | null;
};

export function QuotaCard({ quota }: { quota: QuotaSnapshot | null }) {
  if (!quota || quota.limit <= 0) return null;

  const percent = Math.min(100, Math.round((quota.used / quota.limit) * 100));
  const isTight = percent >= 85;

  return (
    <Card size="sm" className="shadow-none group-data-[collapsible=icon]:hidden">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Chat requests</span>
          <span className={isTight ? "text-destructive" : "text-muted-foreground"}>{percent}%</span>
        </CardTitle>
        <CardDescription className="text-xs">
          {quota.used.toLocaleString()} of {quota.limit.toLocaleString()} used this period
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <Progress value={percent} className="h-1.5" />
        <Link
          href="/dashboard/usage"
          className="mt-2 inline-block text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
        >
          View usage
        </Link>
      </CardContent>
    </Card>
  );
}
