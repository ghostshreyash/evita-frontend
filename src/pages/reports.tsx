import { useMemo, useState } from "react"
import { BookOpen, CalendarClock, FileText, MapPin, Search, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { TablePager } from "@/components/common/data-table"
import { CategoryIcon } from "@/components/common/category-icon"
import { categoryLook } from "@/lib/category-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { contaminationTone, findingLook, findings, reportRows, type ReportRow } from "@/data/report-data"
import { openReport, sampleReports, type ReportKind } from "@/data/sample-reports"
import { assetCategories } from "@/data/master-data"
import { healthBandFor } from "@/data/master-data"
import { healthStatus } from "@/lib/status"
import { control, PAGE_SIZES } from "@/lib/data-table"
import { useScope } from "@/lib/scope"

const ANY = "all"

/**
 * Deal the assets with no cleaning report evenly through the ones that have it.
 *
 * Both groups keep their asset-id order; only where they sit changes, so the
 * list stays predictable while no page is left looking as though every asset is
 * fully reported.
 */
function mix(rows: ReportRow[]) {
  const waiting = rows.filter((r) => !r.lastCleaned)
  const reported = rows.filter((r) => r.lastCleaned)
  if (!waiting.length || !reported.length) return rows

  const step = (reported.length + waiting.length) / waiting.length
  const out: ReportRow[] = []
  let next = 0
  for (const row of reported) {
    // One waiting asset each time the running position passes the interval
    if (next < waiting.length && out.length >= Math.round(next * step)) out.push(waiting[next++])
    out.push(row)
  }
  return [...out, ...waiting.slice(next)]
}

/**
 * Asset Health Reports.
 *
 * One screen, not a tab per report. An asset has three documents against it -
 * contamination, hygiene, and the before-and-after of its last clean - and the
 * question being asked here is "what has this asset got", not "show me every
 * asset's contamination". So each asset is a card carrying its score, when it
 * was last seen and when it is next due, and its three reports underneath, each
 * opening as a PDF.
 *
 * The filters open on the engineer's own enterprise and plant, and an ELPREMAR
 * cannot reach outside their assignment, so there is no site chooser. Rows are
 * in asset-id order, which is the order the client asked for, with the assets
 * still waiting on a clean dealt evenly through them - see `mix`.
 *
 * Trend Analysis is deliberately absent, on the client's instruction at review.
 */
export function ReportsPage() {
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState(ANY)
  const [category, setCategory] = useState(ANY)
  const [status, setStatus] = useState(ANY)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  /* The enterprise the engineer is working in; nothing else is reported on */
  const { enterprise } = useScope()
  const scoped = useMemo(() => reportRows.filter((r) => r.asset.enterprise === enterprise), [enterprise])

  const departments = useMemo(() => [...new Set(scoped.map((r) => r.asset.department))].sort(), [scoped])
  const categories = useMemo(() => assetCategories.filter((c) => scoped.some((r) => r.asset.category === c)), [scoped])

  const filtersOn = [query, department, category, status].some((v) => v && v !== ANY)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = scoped.filter(
      (r) =>
        (!q ||
          r.asset.id.toLowerCase().includes(q) ||
          r.asset.tag.toLowerCase().includes(q) ||
          r.asset.name.toLowerCase().includes(q) ||
          r.asset.area.toLowerCase().includes(q)) &&
        (department === ANY || r.asset.department === department) &&
        (category === ANY || r.asset.category === category) &&
        (status === ANY || r.contaminationStatus === status || r.hygieneStatus === status)
    )
    /*
     * The assets still waiting on a clean are spread through the list.
     *
     * In asset-id order they clustered by category and none reached the first
     * page; piled at the top instead, they read as a separate list. Dealt out
     * at an even interval they are simply part of the register, and every page
     * carries some - which is what the screen is for. Deterministic, as all the
     * mock data here is: no shuffle, just one taken every so often.
     */
    return mix(matched)
  }, [scoped, query, department, category, status])

  const clear = () => {
    setQuery("")
    setDepartment(ANY)
    setCategory(ANY)
    setStatus(ANY)
    setPage(1)
  }

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const start = (Math.min(page, pages) - 1) * pageSize
  const shown = rows.slice(start, start + pageSize)

  // A filter that empties the last page should not leave the pager stranded
  const key = `${rows.length}-${pageSize}`
  const [lastKey, setLastKey] = useState(key)
  if (lastKey !== key) {
    setLastKey(key)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Asset Health Reports"
        breadcrumbs={[{ label: "Reports" }]}
        actions={
          <Button
            variant="outline"
            onClick={() => toast.info("The report guide is published with the field handbook.")}
          >
            <BookOpen /> Report Guide
          </Button>
        }
      />

      {/* ---------- Filters ---------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search asset ID, tag, name or location"
            aria-label="Search assets"
            className={cn(control, "pl-9")}
          />
        </div>
        <Filter label="Department" value={department} onChange={setDepartment} options={departments} />
        <Filter label="Category" value={category} onChange={setCategory} options={categories} />
        <Filter label="Status" value={status} onChange={setStatus} options={findings} />
        <Button variant="outline" className={cn(control, "bg-card")} onClick={clear} disabled={!filtersOn}>
          <X /> Clear
        </Button>
      </div>

      {shown.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((row) => (
            <li key={row.asset.id}>
              <AssetReportCard row={row} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl bg-card py-12 text-center shadow-xs ring-1 ring-foreground/10">
          <TriangleAlert className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No asset matches these filters.</p>
          <Button variant="link" onClick={clear}>
            Clear the filters
          </Button>
        </div>
      )}

      <TablePager
        page={Math.min(page, pages)}
        pages={pages}
        pageSize={pageSize}
        total={rows.length}
        start={start}
        onPage={setPage}
        onPageSize={setPageSize}
      />
    </div>
  )
}

/**
 * One asset and the three documents it holds.
 *
 * The head carries what is asked first - what it is, how it is scoring - and
 * one line under it for where it stands, when it was last inspected and when it
 * is next due. Then a row per report, each opening the document itself.
 */
function AssetReportCard({ row }: { row: ReportRow }) {
  const band = row.healthScore === null ? null : healthBandFor(row.healthScore)

  /** What each report has to say about this asset, beside its name */
  const note: Record<ReportKind, React.ReactNode> = {
    contamination: (
      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", contaminationTone[row.contamination])}>
        {row.contamination}
      </span>
    ),
    hygiene: (
      <Badge variant={findingLook[row.hygieneStatus].badge} className="h-auto rounded-full px-2 py-0.5 text-xs">
        {row.hygieneOpen ? `${row.hygieneOpen} of 8 open` : "All points clear"}
      </Badge>
    ),
    cleaning: row.lastCleaned ? (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">{row.lastCleaned}</span>
    ) : null,
  }

  /* A cleaning report is the before and after of a clean, so it exists only once one has happened */
  const has = (kind: ReportKind) => kind !== "cleaning" || !!row.lastCleaned

  return (
    <article className="flex h-full flex-col rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      {/* The asset, and how it is scoring */}
      <div className="flex items-start gap-2.5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", categoryLook(row.asset.category).tint)}>
          <CategoryIcon category={row.asset.category} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold tabular-nums text-primary">{row.asset.id}</div>
          <div className="truncate text-base leading-tight font-bold text-brand-navy dark:text-foreground">
            {row.asset.name}
          </div>
        </div>
        {band ? (
          <span className={cn("flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold", healthStatus[band.tone].tile)}>
            <span aria-hidden className={cn("size-2 rounded-full", healthStatus[band.tone].dot)} />
            {band.label} · <span className="tabular-nums">{row.healthScore}</span>
          </span>
        ) : null}
      </div>

      {/* Where it stands, when it was last seen, when it is due again - one line */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{row.asset.area}</span>
        </span>
        <span className="flex items-center gap-1 tabular-nums">
          <CalendarClock className="size-3.5 shrink-0" />
          Last {row.lastInspection || "—"} · Next {row.nextInspectionDue || "—"}
        </span>
      </div>

      {/* A line per report, each opening the document */}
      <ul className="mt-3 divide-y border-t">
        {sampleReports.map((report) => (
          <li key={report.kind} className="flex items-center gap-2 py-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{report.title}</span>
                {note[report.kind]}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {has(report.kind) ? report.detail : "Raised once this asset has been cleaned"}
              </p>
            </div>
            {has(report.kind) ? (
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0 bg-card"
                onClick={() => openReport(report)}
                aria-label={`View the ${report.title.toLowerCase()} for ${row.asset.id}`}
              >
                <FileText /> View
              </Button>
            ) : (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">Not cleaned yet</span>
            )}
          </li>
        ))}
      </ul>
    </article>
  )
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className={cn(control, "w-auto min-w-36 bg-card")}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{label}: All</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
