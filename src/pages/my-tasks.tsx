import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import type { DateRange } from "react-day-picker"
import { format, isAfter, isBefore, startOfDay } from "date-fns"
import { ArrowDownUp, CalendarDays, Clock, Factory, MapPin, Play, Search, X } from "lucide-react"
import { cn } from "cn"

import { ChipTabs, type ChipTab } from "@/components/common/chip-tabs"
import { DateRangeFilter, TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { CategoryIcon } from "@/components/common/category-icon"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { priorityTone, slotLabel } from "@/data/occ-tables"
import { control } from "@/lib/data-table"
import { openPanel } from "@/lib/ui-store"
import { categoryFor, fieldStatuses, fieldStatusLook, isOverdue, isToday, jobKindLook, jobPath, parseDay, thisWeek, useMyJobs, when, type FieldStatus, type Job, type JobKind } from "@/lib/work"

/** The bar down the left of a card, and the tint behind an overdue one */
const statusEdge: Record<FieldStatus, string> = {
  open: "bg-info",
  overdue: "bg-critical",
  in_progress: "bg-attention",
  report_due: "bg-attention",
  completed: "bg-healthy",
}

type SortKey = "due" | "priority" | "status" | "asset" | "id"

const sortLabels: Record<SortKey, string> = {
  due: "Due date",
  priority: "Priority",
  status: "Status",
  asset: "Asset",
  id: "Task ID",
}

const priorityRank: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
/**
 * Work needing the engineer first, then finished.
 *
 * Report Due leads: the work on site is done and only the report is missing, so
 * it is the quickest thing on the book to clear and the easiest to forget.
 */
const statusRank: Record<FieldStatus, number> = { report_due: 0, overdue: 1, in_progress: 2, open: 3, completed: 4 }

const sortValue: Record<SortKey, (j: Job) => string | number> = {
  due: when,
  priority: (j) => -priorityRank[j.priority],
  status: (j) => statusRank[j.field],
  asset: (j) => j.asset,
  id: (j) => j.id,
}

/**
 * The ELPREMAR's maintenance book.
 *
 * Inspections are not here. They are not assigned work in the same sense - the
 * engineer starts one by standing at an asset - so they have a section of their
 * own, and My Tasks is left to the maintenance and cleaning that genuinely is
 * handed out with a date on it.
 *
 * A card per task rather than a table row. On a tablet held at arm's length a
 * task is read as a block — what it is, where it is, when it is due — and the
 * seven-column table it used to be made that a scan across the screen. The
 * status tabs along the top do the work the KPI tiles used to.
 *
 * `only` locks the screen to one kind of work, which is what the Inspections
 * section is: the same screen reading the other half of the book.
 *
 * The dashboard links here with `?status=` (Open, Overdue, In Progress,
 * Completed), `?type=` (inspection, maintenance) or `?date=today`,
 * which preset the filters.
 */
export function MyTasksPage({ only }: { only?: JobKind }) {
  // The dashboard can link here while My Tasks is already open; a new query string resets the filters
  const [params] = useSearchParams()
  return <MyTasks key={`${only ?? "all"}-${params.toString()}`} only={only} />
}

function MyTasks({ only }: { only?: JobKind }) {
  const jobs = useMyJobs()
  const [params] = useSearchParams()

  const initialStatus = params.get("status")
  const [status, setStatus] = useState<FieldStatus | "all">(
    fieldStatuses.includes(initialStatus as FieldStatus) ? (initialStatus as FieldStatus) : "all"
  )
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (params.get("date") === "week") return thisWeek()
    if (params.get("date") !== "today") return undefined
    const today = startOfDay(new Date())
    return { from: today, to: today }
  })
  const [query, setQuery] = useState("")
  /*
   * One kind of work per screen. Inspections have a section of their own, so My
   * Tasks is the maintenance book - there is nothing left for a Type filter to
   * choose between, and the query string's ?type= is ignored with it.
   */
  const kind = only ?? "maintenance"
  const [sort, setSort] = useState<SortKey>("status")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /** The kind of work on view, before the status, date and search filters */
  const scoped = useMemo(() => {
    const mine = jobs.filter((j) => j.kind === kind)
    /*
     * An inspection is never overdue. It is a visit the engineer starts when
     * they get to the plant, not a job with a deadline attached, so a booking
     * that has gone past is still simply open.
     */
    return only === "inspection" ? mine.map((j) => (j.field === "overdue" ? { ...j, field: "open" as const } : j)) : mine
  }, [jobs, kind, only])

  /** Everything but the status filter, so the tab counts show what choosing one would give */
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))
    return scoped.filter((j) => {
      if (from) {
        const on = parseDay(j.date)
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      if (!q) return true
      return [j.id, j.asset, j.plant, j.enterprise, j.activity, j.date, j.priority, fieldStatusLook[j.field].label].some((f) =>
        f.toLowerCase().includes(q)
      )
    })
  }, [scoped, range, query])

  const filtered = useMemo(() => matched.filter((j) => status === "all" || j.field === status), [matched, status])

  const sorted = useMemo(() => {
    const value = sortValue[sort]
    return [...filtered].sort((a, b) => {
      const [x, y] = [value(a), value(b)]
      const first = x < y ? -1 : x > y ? 1 : 0
      // Within one group the earliest booking comes first, as it does on site
      return first || when(a) - when(b)
    })
  }, [filtered, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const tabs: ChipTab[] = [
    { value: "all", label: "All", count: matched.length },
    ...fieldStatuses
      .filter((s) => !(only === "inspection" && s === "overdue"))
      .map((s) => ({ value: s, label: fieldStatusLook[s].label, count: matched.filter((j) => j.field === s).length })),
  ]

  const filtersOn = !!query || status !== "all" || !!range?.from
  const label = only === "inspection" ? "inspection" : "task"
  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title={only === "inspection" ? "Inspections" : only ? `${jobKindLook[only].long}s` : "Tasks"}
        description={
          only === "inspection"
            ? "Each one covers a single area of a plant, whatever departments and assets sit in it. You can also start an inspection at any asset without being booked for it."
            : "The maintenance and cleaning assigned to you. Inspections have a section of their own."
        }
        breadcrumbs={[{ label: only === "inspection" ? "Inspections" : only ? `${jobKindLook[only].long}s` : "Tasks" }]}
        actions={
          only === "inspection" ? (
            <Button onClick={() => openPanel({ kind: "begin-inspection" })}>
              <Play className="fill-current" /> Start Inspection
            </Button>
          ) : undefined
        }
      />

      {/* ---------- Search, then the filters as chips ---------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => reset(() => setQuery(e.target.value))}
            placeholder={only === "inspection" ? "Search by plant, enterprise or ID" : "Search task, asset or location"}
            aria-label={`Search ${label}s`}
            className={cn(control, "bg-card pl-9")}
          />
        </div>
        <DateRangeFilter label="Due" range={range} onApply={(r) => reset(() => setRange(r))} />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger aria-label={`Sort ${label}s`} className={cn(control, "w-auto min-w-36 bg-card")}>
            <ArrowDownUp className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {sortLabels[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className={cn(control, "bg-card")}
          disabled={!filtersOn}
          onClick={() =>
            reset(() => {
              setQuery("")
              setStatus("all")
              setRange(undefined)
            })
          }
        >
          <X /> Clear
        </Button>
      </div>

      <ChipTabs
        label={only === "inspection" ? "Inspection status" : "Task status"}
        tabs={tabs}
        value={status}
        onChange={(v) => reset(() => setStatus(v as typeof status))}
        className="mb-3"
      />

      {/* ---------- A card per task ---------- */}
      {shown.length ? (
        <ul className="grid gap-2.5 xl:grid-cols-2">
          {shown.map((job) =>
            only === "inspection" ? <VisitCard key={job.id} job={job} /> : <TaskCard key={job.id} job={job} />
          )}
        </ul>
      ) : (
        <p className="rounded-2xl bg-card py-16 text-center text-sm text-muted-foreground shadow-xs ring-1 ring-foreground/10">
          Nothing matches these filters.
        </p>
      )}

      <TablePager
        page={current}
        pages={pages}
        pageSize={pageSize}
        total={sorted.length}
        start={start}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n)
          setPage(1)
        }}
      />
    </div>
  )
}

/**
 * One task, as a block: the asset it is against, where it is, when it is due,
 * and the one thing the engineer can do with it right now.
 *
 * The whole card opens the task. A link stretched over the card does that
 * rather than a click handler on a wrapping button, so the card stays
 * keyboard-reachable and the action button can sit above it without one button
 * being nested inside another.
 */
function TaskCard({ job }: { job: Job }) {
  const category = categoryFor(job.asset)
  const overdue = isOverdue(job)

  return (
    <li
      className={cn(
        "relative flex items-stretch overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary",
        overdue && "bg-critical-soft/40"
      )}
    >
      <span aria-hidden className={cn("w-1.5 shrink-0", statusEdge[job.field])} />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 p-3">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", categoryLook(category).tint)}>
          <CategoryIcon category={category} className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* No kind chip: every row on this page is the same kind of work */}
            <span className="tabular-nums text-xs font-bold text-muted-foreground">{job.id}</span>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[0.7rem] font-bold tracking-wide uppercase", priorityTone[job.priority])}>
              {job.priority}
            </span>
          </div>
          <h3 className="mt-0.5 truncate text-base font-bold text-brand-navy dark:text-foreground">{job.asset}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-semibold">{shortCategory(category)}</span>
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">
                {job.plant}, {job.enterprise}
              </span>
            </span>
          </div>
          <p className="mt-1 truncate text-sm">{job.activity}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={cn("flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap", overdue && "text-critical")}>
            <Clock className="size-4" />
            {isToday(job.date) ? "Today" : format(parseDay(job.date), "d MMM yyyy")}
          </span>
          <span className={cn("tabular-nums text-xs", overdue ? "text-critical" : "text-muted-foreground")}>
            {slotLabel(job.slot)}
            {overdue ? " · Overdue" : ""}
          </span>
          <JobStatusBadge job={job} />
          {/* Above the stretched link, so the action fires instead of opening the task */}
          <JobActionButton job={job} className="relative z-10 mt-1 w-28" />
        </div>
      </div>

      <Link
        to={jobPath(job)}
        aria-label={`Open task ${job.id}, ${job.asset}`}
        className="absolute inset-0 rounded-2xl outline-none"
      />
    </li>
  )
}

/**
 * One inspection, as the visit it is.
 *
 * No asset on it: the client was clear on 12-10-2026 that an inspection sends
 * the ELPREMAR to a place rather than to one asset, and which assets get
 * inspected is settled on site, by onboarding them or scanning their labels.
 *
 * A visit covers a single area of a plant, whatever departments and assets
 * happen to sit in it, so the card leads with the area and names the plant
 * under it. Beyond that it carries only the day and the booked hour - nothing
 * it cannot know yet.
 *
 * Nothing here is overdue: an inspection is started when the engineer gets to
 * the plant, so a booking that has gone past is still simply open.
 */
function VisitCard({ job }: { job: Job }) {
  return (
    <li className="relative flex items-stretch overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary">
      <span aria-hidden className={cn("w-1.5 shrink-0", statusEdge[job.field])} />

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 p-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-info-soft text-primary">
          <Factory className="size-6" />
        </span>

        <div className="min-w-0 flex-1">
          {/* No priority on an inspection: it is a booked visit, not a job queue */}
          <span className="tabular-nums text-xs font-bold text-muted-foreground">{job.id}</span>
          <h3 className="mt-0.5 truncate text-base font-bold text-brand-navy dark:text-foreground">
            {job.area || job.plant}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {job.plant}, {job.enterprise}
          </p>
          <p className="mt-1 truncate text-sm">{job.activity}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap">
            <CalendarDays className="size-4" />
            {isToday(job.date) ? "Today" : format(parseDay(job.date), "d MMM yyyy")}
          </span>
          <span className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
            <Clock className="size-3.5" />
            {slotLabel(job.slot)}
          </span>
          <JobStatusBadge job={job} />
          {/* Above the stretched link, so the action fires instead of opening it */}
          <JobActionButton job={job} className="relative z-10 mt-1 w-28" />
        </div>
      </div>

      <Link
        to={jobPath(job)}
        aria-label={`Open inspection ${job.id} at ${job.area || job.plant}, ${job.plant}`}
        className="absolute inset-0 rounded-2xl outline-none"
      />
    </li>
  )
}
