import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import type { DateRange } from "react-day-picker"
import { format, isAfter, isBefore, startOfDay } from "date-fns"
import { ClipboardList, Search, Wrench, X } from "lucide-react"
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
import { actionFor, isOverdue, isToday, parseDay, statusLook, useMyJobs, when, type Job, type JobKind } from "@/lib/work"

/** The quick views the dashboard tiles link to (`?view=`) */
const views = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "overdue", label: "Overdue" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
] as const
type View = (typeof views)[number]["key"]

const inView: Record<View, (j: Job) => boolean> = {
  today: (j) => isToday(j.date),
  upcoming: (j) => parseDay(j.date) > startOfDay(new Date()),
  overdue: isOverdue,
  completed: (j) => j.status === "completed",
  all: () => true,
}

type SortKey = "id" | "asset" | "activity" | "due" | "priority" | "status"
const priorityRank: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
/** Work needing the engineer first, then work waiting on OCC, then finished */
const actionRank = { rework: 0, continue: 1, start: 2, view: 3 }
const sortValue: Record<SortKey, (j: Job) => string | number> = {
  id: (j) => j.id,
  asset: (j) => j.asset,
  activity: (j) => j.activity,
  due: when,
  priority: (j) => priorityRank[j.priority],
  status: (j) => actionRank[actionFor(j)],
}

/**
 * The ELPREMAR's book of work from both OCC queues: inspections and
 * maintenance. Also serves Testing & Measurements (inspections only) and
 * Maintenance Activities (maintenance only) through `kind`.
 */
export function MyTasksPage({ kind, title = "My Tasks" }: { kind?: JobKind; title?: string }) {
  const navigate = useNavigate()
  const jobs = useMyJobs()
  const [params, setParams] = useSearchParams()

  const view = (views.some((v) => v.key === params.get("view")) ? params.get("view") : "all") as View
  const [query, setQuery] = useState("")
  const [type, setType] = useState<JobKind | "all">("all")
  const [status, setStatus] = useState("all")
  const [range, setRange] = useState<DateRange | undefined>()
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const scoped = useMemo(() => jobs.filter((j) => (kind ? j.kind === kind : type === "all" || j.kind === type)), [jobs, kind, type])
  const statusOptions = useMemo(() => [...new Set(scoped.map((j) => statusLook(j).label))].sort(), [scoped])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))
    return scoped.filter((j) => {
      if (!inView[view](j)) return false
      if (status !== "all" && statusLook(j).label !== status) return false
      if (from) {
        const on = parseDay(j.date)
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      if (!q) return true
      return [j.id, j.asset, j.plant, j.enterprise, j.activity, j.date, j.priority, statusLook(j).label].some((f) => f.toLowerCase().includes(q))
    })
  }, [scoped, view, status, range, query])

  // Default order: what needs doing first, then by time
  const sorted = useMemo(
    () => (sort ? sortRows(filtered, sort, sortValue) : [...filtered].sort((a, b) => actionRank[actionFor(a)] - actionRank[actionFor(b)] || when(a) - when(b))),
    [filtered, sort]
  )
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const setView = (v: View) => {
    setParams((p) => {
      p.set("view", v)
      return p
    }, { replace: true })
    setPage(1)
  }
  const filtersOn = !!query || type !== "all" || status !== "all" || !!range?.from
  const onSort = (c: SortKey) => setSort(nextSort(sort, c))

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
        {/* Quick views */}
        <div className="flex gap-2 overflow-x-auto border-b px-3 pt-3 pb-3">
          {views.map((v) => {
            const count = scoped.filter(inView[v.key]).length
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-medium ring-1",
                  view === v.key ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/15 hover:bg-muted"
                )}
              >
                {v.label}
                <span className={cn("rounded px-1.5 text-xs tabular-nums", view === v.key ? "bg-primary-foreground/20" : "bg-muted")}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 py-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search task, asset, plant…"
              className="bg-card pl-10"
            />
          </div>
          {!kind ? (
            <Select value={type} onValueChange={(v) => { setType(v as typeof type); setPage(1) }}>
              <SelectTrigger className={cn(control, "w-44 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work</SelectItem>
                <SelectItem value="inspection">Inspections</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className={cn(control, "w-48 bg-card")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <DateRangeFilter label="Due" range={range} onApply={(r) => { setRange(r); setPage(1) }} />
          <Button
            variant="outline"
            className={cn(control, "bg-card")}
            disabled={!filtersOn}
            onClick={() => { setQuery(""); setType("all"); setStatus("all"); setRange(undefined) }}
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
                  <TableCell className={cn(td, "max-w-44 whitespace-normal")}>
                    <span className="flex items-start gap-1.5">
                      {j.kind === "inspection" ? <ClipboardList className="mt-0.5 size-4 shrink-0 text-info" /> : <Wrench className="mt-0.5 size-4 shrink-0 text-highlight" />}
                      {j.activity}
                    </span>
                  </TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>
                    {isToday(j.date) ? "Today" : format(parseDay(j.date), "d MMM yyyy")}
                    <span className="block text-xs text-muted-foreground">{slotLabel(j.slot)}</span>
                    {isOverdue(j) ? <span className="block text-xs font-semibold text-critical">Overdue</span> : null}
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
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    {view === "today" ? "Nothing booked for today." : "No tasks match these filters."}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <TablePager
            page={current}
            pages={pages}
            pageSize={pageSize}
            total={sorted.length}
            start={start}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1) }}
          />
        </div>
      </section>
    </div>
  )
}
