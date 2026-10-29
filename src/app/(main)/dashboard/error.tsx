"use client";

import { useEffect } from "react";

import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Dashboard-level error boundary.
 *
 * Server Components throw `ApiError` when the API is unreachable or a request
 * fails, which would otherwise surface as Next's default error screen.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the digest visible in the console; it matches the API request id in logs.
    console.error("Dashboard request failed", error);
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <TriangleAlertIcon className="size-5" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">This page could not load</p>
          <p className="max-w-md text-muted-foreground text-sm">
            {error.message || "The API did not answer in time. Try again in a moment."}
          </p>
          {error.digest ? <p className="font-mono text-muted-foreground text-xs">ref {error.digest}</p> : null}
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RefreshCwIcon className="size-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
