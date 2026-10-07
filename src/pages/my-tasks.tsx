import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import type { DateRange } from "react-day-picker"
import { format, isAfter, isBefore, startOfDay } from "date-fns"
import { Clock, MapPin, Search, X } from "lucide-react"
import { cn } from "cn"

import { DateRangeFilter, SortHead, TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { CountTile, FilterSelect } from "@/components/common/list-controls"
import { CategoryIcon } from "@/components/common/category-icon"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { priorityTone, slotLabel } from "@/data/occ-tables"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { categoryFor, fieldStatuses, fieldStatusLook, isOverdue, isToday, parseDay, thisWeek, useMyJobs, when, type FieldStatus, type Job, type JobKind } from "@/lib/work"

/** Tile tint per status, matching the status badges */
const tileTone: Record<FieldStatus, string> = {
  open: "bg-info-soft text-info",
  overdue: "bg-critical-soft text-critical",
  in_progress: "bg-attention-soft text-attention",
  completed: "bg-healthy-soft text-healthy",
  approved: "bg-highlight-soft text-highlight",
}

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

const kinds: JobKind[] = ["inspection", "maintenance"]

/**
 * The ELPREMAR's book of work from both OCC queues: inspections (Testing &
 * Measurements) and maintenance activities, told apart by the Work filter.
 *
 * The dashboard links here with `?status=` (Open, Overdue, In Progress,
 * Completed, Approved), `?type=` (inspection, maintenance) or `?date=today`,
 * which preset the filters.
 */
export function MyTasksPage() {
  // The dashboard can link here while My Tasks is already open; a new query string resets the filters
  const [params] = useSearchParams()
  return <MyTasks key={params.toString()} />
}

function MyTasks() {
  const navigate = useNavigate()
  const jobs = useMyJobs()
  const [params] = useSearchParams()

  const initialStatus = params.get("status")
  const initialType = params.get("type")
  const [status, setStatus] = useState<FieldStatus | "all">(fieldStatuses.includes(initialStatus as FieldStatus) ? (initialStatus as FieldStatus) : "all")
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (params.get("date") === "week") return thisWeek()
    if (params.get("date") !== "today") return undefined
    const today = startOfDay(new Date())
    return { from: today, to: today }
  })
  const [query, setQuery] = useState("")
  const [type, setType] = useState<JobKind | "all">(kinds.includes(initialType as JobKind) ? (initialType as JobKind) : "all")
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /** The kind of work on view, before the status, date and search filters */
  const scoped = useMemo(() => jobs.filter((j) => type === "all" || j.kind === type), [jobs, type])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))
    return scoped.filter((j) => {
      if (status !== "all" && j.field !== status) return false
      if (from) {
        const on = parseDay(j.date)
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      if (!q) return true
      return [j.id, j.asset, j.plant, j.enterprise, j.activity, j.date, j.priority, fieldStatusLook[j.field].label].some((f) => f.toLowerCase().includes(q))
    })
  }, [scoped, status, range, query])

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
        title="My Tasks"
        description="Everything OCC has assigned to you. Filter by Work for Testing & Measurements (inspections) or Maintenance Activities."
        breadcrumbs={[{ label: "My Tasks" }]}
      />

      {/* ---------- Where the work stands; a tile applies that status filter ---------- */}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {fieldStatuses.map((s) => (
          <CountTile
            key={s}
            label={fieldStatusLook[s].label}
            value={scoped.filter((j) => j.field === s).length}
            tone={tileTone[s]}
            active={status === s}
            onClick={() => reset(() => setStatus(status === s ? "all" : s))}
          />
        ))}
      </div>

      <section className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => reset(() => setQuery(e.target.value))} placeholder="Search task, asset or plant" aria-label="Search tasks" className={cn(control, "pl-9")} />
          </div>
          <FilterSelect
            label="Status"
            value={status}
            onChange={(v) => reset(() => setStatus(v as typeof status))}
            options={fieldStatuses.map((s) => ({ value: s, label: fieldStatusLook[s].label }))}
          />
          <FilterSelect
            label="Work"
            value={type}
            onChange={(v) => reset(() => setType(v as typeof type))}
            options={[
              { value: "inspection", label: "Testing & Measurements" },
              { value: "maintenance", label: "Maintenance Activities" },
            ]}
          />
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

        <div className="mt-3 overflow-x-auto">
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
                <TableRow key={j.id} onClick={() => navigate(`/my-tasks/${j.id}`)} className={cn("h-20 cursor-pointer", isOverdue(j) && "bg-critical-soft/40 hover:bg-critical-soft/60")}>
                  <TableCell className={cn(td, "tabular-nums font-bold whitespace-nowrap max-lg:hidden")}>{j.id}</TableCell>
                  <TableCell className={cn(td, "whitespace-normal")}>
                    <span className="block font-semibold text-brand-navy dark:text-foreground">{j.asset}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold", categoryLook(categoryFor(j.asset)).tint)}>
                        <CategoryIcon category={categoryFor(j.asset)} className="size-3.5" />
                        {shortCategory(categoryFor(j.asset))}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {j.plant}, {j.enterprise}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className={cn(td, "max-w-44 whitespace-normal")}>{j.activity}</TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap", isOverdue(j) && "font-semibold text-critical")}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 shrink-0" />
                      {isToday(j.date) ? "Today" : format(parseDay(j.date), "d MMM yyyy")}
                    </span>
                    <span className={cn("block pl-5.5 tabular-nums text-xs", isOverdue(j) ? "text-critical" : "text-muted-foreground")}>
                      {slotLabel(j.slot)}
                      {isOverdue(j) ? " · Overdue" : ""}
                    </span>
                  </TableCell>
                  <TableCell className={cn(td, "max-md:hidden")}>
                    <span className={cn("rounded-md px-2 py-1 text-xs font-bold tracking-wide uppercase", priorityTone[j.priority])}>{j.priority}</span>
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
