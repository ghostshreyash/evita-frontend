import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableHead } from "@/components/ui/table"
import { control, PAGE_SIZES, th, type Sort } from "@/lib/data-table"

/**
 * The parts every EVITA list screen shares: sortable column heads and the pager.
 * Ported from occ-frontend `src/components/common/data-table.tsx` and resized for
 * the tablets — the header cell and the pager controls come from lib/data-table,
 * where the tablet density lives.
 */

export function SortHead<K extends string>({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: string
  column: K
  sort: Sort<K>
  onSort: (c: K) => void
  className?: string
}) {
  const active = sort?.key === column
  const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead
      className={cn(th, className)}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "-mx-1 inline-flex min-h-9 cursor-pointer items-center gap-1 rounded px-1 uppercase hover:bg-foreground/5 hover:text-foreground",
          active && "text-primary"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  )
}

export function TablePager({
  page,
  pages,
  pageSize,
  total,
  start,
  onPage,
  onPageSize,
}: {
  page: number
  pages: number
  pageSize: number
  total: number
  /** Index of the first row on this page, for the "1–10 of 84" read-out */
  start: number
  onPage: (p: number) => void
  onPageSize: (n: number) => void
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
          <SelectTrigger size="sm" className={cn(control, "w-20 bg-card")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {total ? `${start + 1}–${Math.min(start + pageSize, total)} of ${total}` : "0 of 0"}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" className={cn(control, "bg-card")} disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <span className="px-2 tabular-nums">
          Page {page} of {pages}
        </span>
        <Button variant="outline" className={cn(control, "bg-card")} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
