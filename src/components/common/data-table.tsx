import { useState } from "react"
import type { DateRange } from "react-day-picker"
import { format, startOfDay } from "date-fns"
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarRange, ChevronLeft, ChevronRight, X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableHead } from "@/components/ui/table"
import { control, PAGE_SIZES, th, type Sort } from "@/lib/data-table"

/**
 * The parts every list screen shares: header density, column sorting, the
 * scheduled/due range filter and the pager. Kept here so the Maintenance and
 * Inspection screens can't drift apart.
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
    <TableHead className={cn(th, className)} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "-mx-1 inline-flex min-h-10 cursor-pointer items-center gap-1 rounded px-1 uppercase hover:bg-foreground/5 hover:text-foreground",
          active && "text-primary"
        )}
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  )
}

/* ---------- Date range filter ---------- */

const sameDate = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

/**
 * Picks one range across two months. The choice is held as a draft until Ok, so
 * an exploratory click doesn't re-filter the table under the picker; the cross
 * closes without applying anything.
 */
export function DateRangeFilter({
  label,
  range,
  onApply,
}: {
  /** What the column is called, e.g. "Scheduled" or "Due" */
  label: string
  range?: DateRange
  onApply: (r?: DateRange) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRange | undefined>(range)

  const text = !range?.from
    ? `${label}: any date`
    : range.to && !sameDate(range.from, range.to)
      ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")}`
      : format(range.from, "d MMM yyyy")

  return (
    <Popover open={open} onOpenChange={(o) => { if (o) setDraft(range); setOpen(o) }}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn(control, "bg-card font-normal")}>
          <CalendarRange className="size-3.5 text-muted-foreground" />
          {text}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="center">
        <div className="flex items-center justify-between gap-6 border-b px-3 py-2">
          <span className="text-sm font-semibold">{label} between</span>
          <Button variant="ghost" size="icon-sm" aria-label="Close date picker" onClick={() => setOpen(false)}>
            <X />
          </Button>
        </div>
        <Calendar mode="range" numberOfMonths={2} showOutsideDays={false} selected={draft} onSelect={setDraft} autoFocus />
        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button variant="ghost" size="sm" className={control} onClick={() => { setDraft(undefined); onApply(undefined); setOpen(false) }}>
            Clear dates
          </Button>
          <Button size="sm" className={control} disabled={!draft?.from} onClick={() => { onApply(draft); setOpen(false) }}>
            Ok
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/* ---------- Pager ---------- */

export function TablePager({
  page,
  pages,
  pageSize,
  total,
  start,
  onPage,
  onPageSize,
  note,
}: {
  page: number
  pages: number
  pageSize: number
  total: number
  /** Index of the first row on this page, for the "1–10 of 52" read-out */
  start: number
  onPage: (p: number) => void
  onPageSize: (n: number) => void
  /** Anything extra to show beside the count, e.g. a selection tally */
  note?: React.ReactNode
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSize(Number(v))}>
          <SelectTrigger className={cn(control, "w-20 bg-card")}><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {total ? `${start + 1}–${Math.min(start + pageSize, total)} of ${total}` : "0 of 0"}
        </span>
        {note}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className={cn(control, "bg-card")} disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-3.5" /> Previous
        </Button>
        <span className="px-2 tabular-nums">Page {page} of {pages}</span>
        <Button variant="outline" size="sm" className={cn(control, "bg-card")} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
