import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import type { DateRange } from "react-day-picker"
import { format, isAfter, isBefore, startOfDay } from "date-fns"
import { Clock, CloudCheck, CloudOff, CloudUpload, Search, X } from "lucide-react"
import { cn } from "cn"

import { DateRangeFilter, SortHead, TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { CategoryIcon } from "@/components/common/category-icon"
import { CountTile, FilterSelect } from "@/components/common/list-controls"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { InspectionDetail } from "@/data/inspection-detail"
import { useInspectionDetails } from "@/data/inspection-store"
import { healthBands, inspectionTypes } from "@/data/master-data"
import { slotLabel } from "@/data/occ-tables"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { bandLook } from "@/lib/health"
import { inspectionTypeFor } from "@/lib/testing"
import { categoryFor, isOverdue, isToday, parseDay, useMyJobs, when, type FieldStatus, type Job } from "@/lib/work"

/** The statuses an inspection can be in; Approved is a maintenance-only state */
const statuses: { key: FieldStatus; label: string; tone: string }[] = [
  { key: "open", label: "Open", tone: "bg-info-soft text-info" },
  { key: "overdue", label: "Overdue", tone: "bg-critical-soft text-critical" },
  { key: "in_progress", label: "In Progress", tone: "bg-attention-soft text-attention" },
  { key: "completed", label: "Completed", tone: "bg-healthy-soft text-healthy" },
]

type Sync = "synced" | "pending" | "draft" | "none"
const syncLook: Record<Sync, { label: string; icon: typeof CloudCheck; tone: string }> = {
  synced: { label: "Synced", icon: CloudCheck, tone: "text-healthy" },
  pending: { label: "Pending sync", icon: CloudUpload, tone: "text-attention" },
  draft: { label: "Draft on tablet", icon: CloudOff, tone: "text-muted-foreground" },
  none: { label: "Not started", icon: CloudOff, tone: "text-muted-foreground/60" },
}

/** One register row: the job plus what its record says */
type Row = Job & {
  detail?: InspectionDetail
  type: string
  category: string
  score?: number
  sync: Sync
}

type SortKey = "id" | "asset" | "type" | "due" | "health" | "status"
const statusRank: Record<FieldStatus, number> = { overdue: 0, in_progress: 1, open: 2, completed: 3, approved: 4 }

/**
 * Testing & Measurements: every inspection assigned to the signed-in ELPREMAR,
 * with the health score it produced and
 * whether the server has it yet. Opening a row goes to the task, where Start /
 * Continue opens the capture screen and View the Inspection Completed record.
 *
 * Stands in for GET /api/v1/inspections (scoped to the ELPREMAR) joined with
 * GET /api/v1/sync/status for the tablet's queue.
 */
export function TestingMeasurementsPage() {
  const [params] = useSearchParams()
  return <TestingMeasurements key={params.toString()} />
}

function TestingMeasurements() {
  const navigate = useNavigate()
  const jobs = useMyJobs()
  const details = useInspectionDetails()
  const [params] = useSearchParams()

  const initial = params.get("status") as FieldStatus | null
  const [status, setStatus] = useState<FieldStatus | "all">(statuses.some((s) => s.key === initial) ? initial! : "all")
  const [type, setType] = useState("all")
  const [health, setHealth] = useState("all")
  const [sync, setSync] = useState<Sync | "all">("all")
  const [range, setRange] = useState<DateRange | undefined>()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const rows = useMemo<Row[]>(
    () =>
      jobs
        .filter((j) => j.kind === "inspection")
        .map((j) => {
          const detail = details[j.id]
          const category = categoryFor(j.asset)
          return {
            ...j,
            detail,
            type: inspectionTypeFor(j.activity),
            category,
            score: detail?.result?.healthScore,
            sync: j.field === "open" || j.field === "overdue" ? "none" : (detail?.sync?.state ?? "synced"),
          }
        }),
    [jobs, details]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))
    return rows.filter((r) => {
      if (status !== "all" && r.field !== status) return false
      if (type !== "all" && r.type !== type) return false
      if (sync !== "all" && r.sync !== sync) return false
      if (health !== "all") {
        if (health === "none" ? r.score !== undefined : r.score === undefined || bandLook(r.score).label !== health) return false
      }
      if (from) {
        const on = parseDay(r.date)
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      if (!q) return true
      return [r.id, r.asset, r.plant, r.activity, r.type, r.detail?.assetTag ?? "", r.category].some((f) => f.toLowerCase().includes(q))
    })
  }, [rows, status, type, sync, health, range, query])

  const sorted = useMemo(
    () =>
      sort
        ? sortRows(filtered, sort, {
            id: (r) => r.id,
            asset: (r) => r.asset,
            type: (r) => r.type,
            due: when,
            health: (r) => r.score ?? -1,
            status: (r) => statusRank[r.field],
          })
        : [...filtered].sort((a, b) => statusRank[a.field] - statusRank[b.field] || when(a) - when(b)),
    [filtered, sort]
  )
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const pending = rows.filter((r) => r.sync === "pending").length
  const filtersOn = !!query || status !== "all" || type !== "all" || health !== "all" || sync !== "all" || !!range?.from
  const onSort = (c: SortKey) => setSort(nextSort(sort, c))
  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Testing & Measurements"
        description="Inspections assigned to you. Capture asset images, thermal points, contamination and the fire prevention system for each asset."
        breadcrumbs={[{ label: "Testing & Measurements" }]}
      />

      {/* ---------- Where the inspections stand; a tile applies its filter ---------- */}
      <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {statuses.map((s) => (
          <CountTile key={s.key} label={s.label} value={rows.filter((r) => r.field === s.key).length} tone={s.tone} active={status === s.key} onClick={() => reset(() => setStatus(status === s.key ? "all" : s.key))} />
        ))}
        <CountTile label="Pending Sync" value={pending} tone="bg-attention-soft text-attention" active={sync === "pending"} onClick={() => reset(() => setSync(sync === "pending" ? "all" : "pending"))} />
      </div>

      <section className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => reset(() => setQuery(e.target.value))} placeholder="Search inspection, asset, Asset ID or plant" aria-label="Search inspections" className={cn(control, "pl-9")} />
          </div>
          <FilterSelect label="Status" value={status} onChange={(v) => reset(() => setStatus(v as typeof status))} options={statuses.map((s) => ({ value: s.key, label: s.label }))} />
          <FilterSelect label="Type" value={type} onChange={(v) => reset(() => setType(v))} options={inspectionTypes} />
          <FilterSelect
            label="Health"
            value={health}
            onChange={(v) => reset(() => setHealth(v))}
            options={[...healthBands.map((b) => ({ value: b.label, label: `${b.label} (${b.min}–${b.max})` })), { value: "none", label: "Not Inspected" }]}
          />
          <FilterSelect label="Sync" value={sync} onChange={(v) => reset(() => setSync(v as typeof sync))} options={(["synced", "pending", "draft"] as const).map((s) => ({ value: s, label: syncLook[s].label }))} />
          <DateRangeFilter label="Due" range={range} onApply={(r) => reset(() => setRange(r))} />
          <Button
            variant="outline"
            className={cn(control, "bg-card")}
            disabled={!filtersOn}
            onClick={() => reset(() => { setQuery(""); setStatus("all"); setType("all"); setHealth("all"); setSync("all"); setRange(undefined) })}
          >
            <X /> Clear
          </Button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <SortHead label="Inspection" column="id" sort={sort} onSort={onSort} className="max-xl:hidden" />
                <SortHead label="Asset" column="asset" sort={sort} onSort={onSort} />
                <SortHead label="Inspection Type" column="type" sort={sort} onSort={onSort} className="max-lg:hidden" />
                <SortHead label="Due" column="due" sort={sort} onSort={onSort} />
                <SortHead label="Health" column="health" sort={sort} onSort={onSort} />
                <TableHead className={cn(th, "max-md:hidden")}>Sync</TableHead>
                <SortHead label="Status" column="status" sort={sort} onSort={onSort} />
                <TableHead className={cn(th, "text-center")}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r) => (
                <TableRow key={r.id} onClick={() => navigate(`/my-tasks/${r.id}`)} className={cn("h-20 cursor-pointer", isOverdue(r) && "bg-critical-soft/40 hover:bg-critical-soft/60")}>
                  <TableCell className={cn(td, "tabular-nums font-bold whitespace-nowrap max-xl:hidden")}>{r.id}</TableCell>
                  <TableCell className={cn(td, "whitespace-normal")}>
                    <span className="block font-semibold text-brand-navy dark:text-foreground">{r.asset}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold", categoryLook(r.category).tint)}>
                        <CategoryIcon category={r.category} className="size-3.5" />
                        {shortCategory(r.category)}
                      </span>
                      {r.detail?.assetTag ? <span className="tabular-nums text-xs text-muted-foreground">{r.detail.assetTag}</span> : null}
                    </span>
                  </TableCell>
                  <TableCell className={cn(td, "max-w-44 whitespace-normal max-lg:hidden")}>
                    <span className="block font-medium">{r.type}</span>
                    {r.activity !== r.type ? <span className="text-xs text-muted-foreground">{r.activity}</span> : null}
                  </TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap", isOverdue(r) && "font-semibold text-critical")}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 shrink-0" />
                      {isToday(r.date) ? "Today" : format(parseDay(r.date), "d MMM yyyy")}
                    </span>
                    <span className={cn("block pl-5.5 tabular-nums text-xs", isOverdue(r) ? "text-critical" : "text-muted-foreground")}>
                      {slotLabel(r.slot)}
                      {isOverdue(r) ? " · Overdue" : ""}
                    </span>
                  </TableCell>
                  <TableCell className={td}>
                    {r.score !== undefined ? (
                      <span className={cn("inline-flex items-baseline gap-1 rounded-lg px-2.5 py-1", bandLook(r.score).soft)}>
                        <span className="tabular-nums text-base font-bold">{r.score}</span>
                        <span className="text-xs font-semibold">{bandLook(r.score).label}</span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not Inspected</span>
                    )}
                  </TableCell>
                  <TableCell className={cn(td, "max-md:hidden")}>
                    <SyncCell sync={r.sync} at={r.detail?.sync?.at} />
                  </TableCell>
                  <TableCell className={td}><JobStatusBadge job={r} /></TableCell>
                  <TableCell className={cn(td, "py-1.5 text-center")}><JobActionButton job={r} /></TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No inspections match these filters.</TableCell>
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

function SyncCell({ sync, at }: { sync: Sync; at?: string }) {
  const look = syncLook[sync]
  return (
    <span className={cn("flex items-center gap-1.5 text-sm font-medium", look.tone)}>
      <look.icon className="size-4 shrink-0" />
      <span>
        {look.label}
        {at && sync !== "none" ? <span className="block tabular-nums text-xs font-normal text-muted-foreground">{at.split(" ")[1]}</span> : null}
      </span>
    </span>
  )
}
