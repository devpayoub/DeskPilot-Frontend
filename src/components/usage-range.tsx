"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** ISO date (yyyy-mm-dd) for `<input type="date">`, derived from a query param. */
function toDateInput(value: string | null): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function UsageRange({ basePath = "/dashboard/usage" }: { basePath?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(toDateInput(searchParams.get("from")));
  const [to, setTo] = useState(toDateInput(searchParams.get("to")));

  useEffect(() => {
    setFrom(toDateInput(searchParams.get("from")));
    setTo(toDateInput(searchParams.get("to")));
  }, [searchParams]);

  const apply = (event: React.FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams();

    // The API expects ISO 8601 datetimes, not bare dates.
    if (from) next.set("from", `${from}T00:00:00Z`);
    if (to) next.set("to", `${to}T23:59:59Z`);

    const query = next.toString();
    router.replace(query ? `${basePath}?${query}` : basePath);
  };

  const invalid = Boolean(from && to && from > to);

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="usage-from" className="text-muted-foreground text-xs">
          From
        </label>
        <Input
          id="usage-from"
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="h-8 w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="usage-to" className="text-muted-foreground text-xs">
          To
        </label>
        <Input
          id="usage-to"
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="h-8 w-40"
        />
      </div>
      <Button type="submit" size="sm" disabled={invalid}>
        Apply
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => {
          setFrom("");
          setTo("");
          router.replace(basePath);
        }}
      >
        Reset
      </Button>
      {invalid ? <span className="text-destructive text-xs">From must be before To.</span> : null}
    </form>
  );
}
