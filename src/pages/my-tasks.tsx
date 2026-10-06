import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import type { DateRange } from "react-day-picker"
import { format, isAfter, isBefore, startOfDay } from "date-fns"
import { Search, X } from "lucide-react"
import { cn } from "cn"

import { DateRangeFilter, SortHead, TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { priorityTone, slotLabel } from "@/data/occ-tables"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { fieldStatuses, fieldStatusLook, isOverdue, isToday, parseDay, useMyJobs, when, type FieldStatus, type Job, type JobKind } from "@/lib/work"

type SortKey = "id" | "asset" | "activity" | "due" | "priority" | "status"
const priorityRank: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
/** Work needing the engineer first (overdue, running, open), then finished */
const statusRank: Record<FieldStatus, number> = { overdue: 0, in_progress: 1, open: 2, completed: 3, approved: 4 }
const sortValue: Record<SortKey, (j: Job) => string | number> = {
  id: (j) => j.id,
  asset: (j) => j.asset,
  activity: (j) => j.activity,
  due: when,
  priority: (j) => priorityRank[j.priority],
  status: (j) => statusRank[j.field],
}

/**
 * The ELPREMAR's book of work from both OCC queues: inspections and
 * maintenance. Also serves Testing & Measurements (inspections only) and
 * Maintenance Activities (maintenance only) through `kind`.
 *
 * The dashboard links here with `?status=` (Open, Overdue, In Progress,
 * Completed, Approved) or `?date=today`, which preset the filters.
 */
export function MyTasksPage(props: { kind?: JobKind; title?: string }) {
  // The dashboard can link here while My Tasks is already open; a new query string resets the filters
  const [params] = useSearchParams()
  return <MyTasks key={params.toString()} {...props} />
}

function MyTasks({ kind, title = "My Tasks" }: { kind?: JobKind; title?: string }) {
  const navigate = useNavigate()
  const jobs = useMyJobs()
  const [params] = useSearchParams()

  const initialStatus = params.get("status")
  const [status, setStatus] = useState<FieldStatus | "all">(fieldStatuses.includes(initialStatus as FieldStatus) ? (initialStatus as FieldStatus) : "all")
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (params.get("date") !== "today") return undefined
    const today = startOfDay(new Date())
    return { from: today, to: today }
  })
  const [query, setQuery] = useState("")
  const [type, setType] = useState<JobKind | "all">("all")
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))
    return jobs.filter((j) => {
      if (kind ? j.kind !== kind : type !== "all" && j.kind !== type) return false
      if (status !== "all" && j.field !== status) return false
      if (from) {
        const on = parseDay(j.date)
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      if (!q) return true
      return [j.id, j.asset, j.plant, j.enterprise, j.activity, j.date, j.priority, fieldStatusLook[j.field].label].some((f) => f.toLowerCase().includes(q))
    })
  }, [jobs, kind, type, status, range, query])

  // Default order: what needs doing first, then by time
  const sorted = useMemo(
    () => (sort ? sortRows(filtered, sort, sortValue) : [...filtered].sort((a, b) => statusRank[a.field] - statusRank[b.field] || when(a) - when(b))),
    [filtered, sort]
  )
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const filtersOn = !!query || type !== "all" || status !== "all" || !!range?.from
  const onSort = (c: SortKey) => setSort(nextSort(sort, c))
  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title={title}
        description={
          kind === "inspection"
            ? "Inspections and tests assigned to you. Start one to record readings, observations and evidence."
            : kind === "maintenance"
              ? "Maintenance assigned to you. Record the work and submit it to OCC for approval."
              : "Everything OCC has assigned to you, inspections and maintenance together."
        }
        breadcrumbs={[{ label: title }]}
      />

      <section className="rounded-lg bg-card shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2 px-3 py-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => reset(() => setQuery(e.target.value))} placeholder="Search task, asset, plant…" className="bg-card pl-10" />
          </div>
          <Select value={status} onValueChange={(v) => reset(() => setStatus(v as typeof status))}>
            <SelectTrigger className={cn(control, "w-44 bg-card")} aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {fieldStatuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {fieldStatusLook[s].label} ({jobs.filter((j) => (kind ? j.kind === kind : true) && j.field === s).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!kind ? (
            <Select value={type} onValueChange={(v) => reset(() => setType(v as typeof type))}>
              <SelectTrigger className={cn(control, "w-44 bg-card")} aria-label="Type of work"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work</SelectItem>
                <SelectItem value="inspection">Inspections</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <DateRangeFilter label="Due" range={range} onApply={(r) => reset(() => setRange(r))} />
          <Button
            variant="outline"
            className={cn(control, "bg-card")}
            disabled={!filtersOn}
            onClick={() => reset(() => { setQuery(""); setType("all"); setStatus("all"); setRange(undefined) })}
          >
            <X /> Clear
          </Button>
        </div>

        <div className="overflow-x-auto px-2 pb-3">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <SortHead label="Task" column="id" sort={sort} onSort={onSort} className="max-lg:hidden" />
                <SortHead label="Asset / Location" column="asset" sort={sort} onSort={onSort} />
                <SortHead label="Activity" column="activity" sort={sort} onSort={onSort} />
                <SortHead label="Due" column="due" sort={sort} onSort={onSort} />
                <SortHead label="Priority" column="priority" sort={sort} onSort={onSort} className="max-md:hidden" />
                <SortHead label="Status" column="status" sort={sort} onSort={onSort} />
                <TableHead className={cn(th, "text-center")}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((j) => (
                <TableRow key={j.id} onClick={() => navigate(`/my-tasks/${j.id}`)} className="cursor-pointer">
                  <TableCell className={cn(td, "font-medium whitespace-nowrap tabular-nums max-lg:hidden")}>{j.id}</TableCell>
                  <TableCell className={cn(td, "whitespace-normal")}>
                    <span className="font-medium">{j.asset}</span>
                    <span className="block text-xs text-muted-foreground">{j.plant}, {j.enterprise}</span>
                  </TableCell>
                  <TableCell className={cn(td, "max-w-44 whitespace-normal")}>{j.activity}</TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap tabular-nums", isOverdue(j) && "font-semibold text-critical")}>
                    {isToday(j.date) ? "Today" : format(parseDay(j.date), "d MMM yyyy")}
                    <span className={cn("block text-xs", isOverdue(j) ? "text-critical" : "text-muted-foreground")}>{slotLabel(j.slot)}</span>
                  </TableCell>
                  <TableCell className={cn(td, "max-md:hidden")}>
                    <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityTone[j.priority])}>{j.priority}</span>
                  </TableCell>
                  <TableCell className={td}><JobStatusBadge job={j} /></TableCell>
                  <TableCell className={cn(td, "py-1.5 text-center")}><JobActionButton job={j} /></TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No tasks match these filters.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <TablePager page={current} pages={pages} pageSize={pageSize} total={sorted.length} start={start} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1) }} />
        </div>
      </section>
    </div>
  )
}
