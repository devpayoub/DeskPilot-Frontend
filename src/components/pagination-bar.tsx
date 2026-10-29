import Link from "next/link";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type SearchParams = Record<string, string | undefined>;

function buildHref(basePath: string, params: SearchParams, page: number): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") next.set(key, value);
  }
  if (page > 1) next.set("page", String(page));
  const query = next.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function PaginationBar({
  basePath,
  params,
  page,
  count,
  pageSize,
}: {
  basePath: string;
  params: SearchParams;
  page: number;
  count: number;
  pageSize: number;
}) {
  const pageCount = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-muted-foreground text-sm tabular-nums">
        Showing {from}–{to} of {count}
      </p>

      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" disabled={page <= 1}>
          <Link
            href={buildHref(basePath, params, Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          >
            <ChevronLeftIcon className="size-4" />
            Previous
          </Link>
        </Button>
        <span className="text-muted-foreground text-sm tabular-nums">
          Page {page} of {pageCount}
        </span>
        <Button asChild variant="outline" size="sm" disabled={page >= pageCount}>
          <Link
            href={buildHref(basePath, params, Math.min(pageCount, page + 1))}
            aria-disabled={page >= pageCount}
            className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
          >
            Next
            <ChevronRightIcon className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
