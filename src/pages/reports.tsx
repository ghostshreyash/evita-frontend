import { useMemo, useState } from "react"
import { BookOpen, Download, HardDrive, Search, Sparkles, SprayCan, TrendingUp, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { SortHead, TablePager } from "@/components/common/data-table"
import { CategoryIcon } from "@/components/common/category-icon"
import { DonutChart, TrendChart, type Slice } from "@/components/common/charts"
import { AssetReportPanel } from "@/components/reports/asset-report-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  contaminationKpis,
  contaminationTone,
  findingLook,
  findings,
  healthSplit,
  hygieneHotspots,
  hygieneKpis,
  hygieneTrend,
  reportRows,
  uninspectedCount,
  type Finding,
  type ReportRow,
} from "@/data/report-data"
import { assetCategories, healthScoreWeights } from "@/data/master-data"
import { control, nextSort, PAGE_SIZES, sortRows, td, th, type Accessors, type Sort } from "@/lib/data-table"
import { parseDmy } from "@/data/asset-data"
import { healthStatus } from "@/lib/status"

type Column = "id" | "name" | "category" | "area" | "level" | "score" | "status" | "inspected" | "due"

const ANY = "all"

/**
 * Asset Health Reports.
 *
 * Two Phase-1 reports plus the AI view, as the client defined them on
 * 23-09-2026. Three things from that answer shape this screen:
 *
 * - The filters open on the engineer's own enterprise and plant, and an ELPREMAR
 *   cannot reach outside their assignment — so the site is a fixed strip here
 *   rather than two dropdowns.
 * - Rows come in Asset ID order by default, stable, and every column is the
 *   user's to sort by.
 * - The tiles recalculate for whatever the filters and search leave on screen,
 *   rather than always reporting the whole plant.
 *
 * Trend Analysis is deliberately absent, both as a tab here and as a tab inside
 * the panel, on the client's instruction at review.
 */
export function ReportsPage() {
  const [query, setQuery] = useState("")
  const [department, setDepartment] = useState(ANY)
  const [category, setCategory] = useState(ANY)
  const [status, setStatus] = useState(ANY)
  /** The row whose View was pressed; the panel is closed until there is one */
  const [selected, setSelected] = useState<ReportRow>()

  const departments = useMemo(() => [...new Set(reportRows.map((r) => r.asset.department))].sort(), [])
  const categories = useMemo(() => assetCategories.filter((c) => reportRows.some((r) => r.asset.category === c)), [])

  const site = reportRows[0].asset
  const filtersOn = [query, department, category, status].some((v) => v && v !== ANY)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reportRows.filter(
      (r) =>
        (!q ||
          r.asset.id.toLowerCase().includes(q) ||
          r.asset.tag.toLowerCase().includes(q) ||
          r.asset.name.toLowerCase().includes(q) ||
          r.asset.serial.toLowerCase().includes(q)) &&
        (department === ANY || r.asset.department === department) &&
        (category === ANY || r.asset.category === category) &&
        (status === ANY || r.contaminationStatus === status || r.hygieneStatus === status)
    )
  }, [query, department, category, status])

  const close = () => setSelected(undefined)

  const clear = () => {
    setQuery("")
    setDepartment(ANY)
    setCategory(ANY)
    setStatus(ANY)
  }

  return (
    <div>
      <PageHeader
        title="Asset Health Reports"
        description="Contamination and hygiene reporting from inspection, testing and historical data."
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

      {/* The scope an ELPREMAR reports on is their own posting and nothing wider */}
      <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-info-soft px-3 py-2 text-sm">
        <HardDrive className="size-4 text-primary" />
        <span className="font-semibold">{site.plant}</span>
        <span className="text-muted-foreground">·</span>
        <span>{site.enterprise}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {uninspectedCount
            ? `Your assigned scope · ${uninspectedCount} not yet inspected, so not reported on`
            : "Your assigned scope"}
        </span>
      </p>

      <Tabs defaultValue="contamination">
        <TabsList className="w-full">
          <TabsTrigger value="contamination" className="flex-1">
            <SprayCan className="size-4" /> Contamination Wise Report
          </TabsTrigger>
          <TabsTrigger value="hygiene" className="flex-1">
            <Sparkles className="size-4" /> Hygiene Wise Report
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex-1">
            <TriangleAlert className="size-4" /> AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ---------- Filters, shared by both report tabs ---------- */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search asset ID, tag, name or serial"
              aria-label="Search assets"
              className={cn(control, "pl-9")}
            />
          </div>
          <Filter label="Department" value={department} onChange={setDepartment} options={departments} />
          <Filter label="Category" value={category} onChange={setCategory} options={categories} />
          <Filter
            label="Status"
            value={status}
            onChange={setStatus}
            options={findings}
          />
          <Button variant="outline" className={cn(control, "bg-card")} onClick={clear} disabled={!filtersOn}>
            <X /> Clear
          </Button>
        </div>

        <div className="mt-3">
          <TabsContent value="contamination" className="mt-0">
            <ContaminationReport rows={rows} selected={selected} onSelect={setSelected} onClose={close} onClear={clear} />
          </TabsContent>
          <TabsContent value="hygiene" className="mt-0">
            <HygieneReport rows={rows} selected={selected} onSelect={setSelected} onClose={close} onClear={clear} />
          </TabsContent>
          <TabsContent value="insights" className="mt-0">
            <AiInsights rows={rows} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

/* ---------- Contamination ---------- */

const contaminationOrder = ["Low", "Medium", "High"]
const findingOrder: Finding[] = ["Healthy", "Alarming", "At Risk"]

function ContaminationReport({
  rows,
  selected,
  onSelect,
  onClose,
  onClear,
}: {
  rows: ReportRow[]
  selected?: ReportRow
  onSelect: (row: ReportRow) => void
  onClose: () => void
  onClear: () => void
}) {
  const kpis = contaminationKpis(rows)

  const accessors: Accessors<ReportRow, Column> = {
    id: (r) => r.asset.id,
    name: (r) => r.asset.name,
    category: (r) => r.asset.category,
    area: (r) => r.asset.area,
    level: (r) => contaminationOrder.indexOf(r.contamination),
    score: (r) => r.healthScore ?? -1,
    status: (r) => findingOrder.indexOf(r.contaminationStatus),
    inspected: (r) => (r.lastInspection ? parseDmy(r.lastInspection).getTime() : 0),
    due: (r) => (r.nextInspectionDue ? parseDmy(r.nextInspectionDue).getTime() : 0),
  }

  return (
    <ReportTable
      title="Assets (Contamination Analysis)"
      rows={rows}
      accessors={accessors}
      selected={selected}
      onSelect={onSelect}
      onClose={onClose}
      onClear={onClear}
      kpis={
        <>
          <Kpi label="Total Assets" value={kpis.total} note="In this scope" tone="bg-info-soft text-info" />
          <Kpi label="Healthy" value={kpis.healthy} note="Score 70 and above" tone="bg-healthy-soft text-healthy" />
          <Kpi label="Alarming" value={kpis.attention} note="Score 50 – 69" tone="bg-attention-soft text-attention" />
          <Kpi label="At Risk" value={kpis.atRisk} note="Score below 50" tone="bg-critical-soft text-critical" />
        </>
      }
      head={(sort, onSort) => (
        <>
          <SortHead label="Contamination" column="level" sort={sort} onSort={onSort} />
          <SortHead label="Health Score" column="score" sort={sort} onSort={onSort} />
          <SortHead label="Status" column="status" sort={sort} onSort={onSort} />
          <SortHead label="Last Inspection" column="inspected" sort={sort} onSort={onSort} />
          <SortHead label="Next Due" column="due" sort={sort} onSort={onSort} />
        </>
      )}
      cells={(r) => (
        <>
          <TableCell className={td}>
            <span className={cn("rounded px-2 py-1 text-xs font-semibold", contaminationTone[r.contamination])}>
              {r.contamination}
            </span>
          </TableCell>
          <TableCell className={cn(td, "font-semibold tabular-nums")}>
            {r.healthScore ?? <span className="font-normal text-muted-foreground">—</span>}
          </TableCell>
          <TableCell className={td}>
            <Badge variant={findingLook[r.contaminationStatus].badge} className="h-auto rounded px-2 py-1 text-xs">
              {r.contaminationStatus}
            </Badge>
          </TableCell>
          <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{r.lastInspection || "—"}</TableCell>
          <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{r.nextInspectionDue || "—"}</TableCell>
        </>
      )}
    />
  )
}

/* ---------- Hygiene ---------- */

function HygieneReport({
  rows,
  selected,
  onSelect,
  onClose,
  onClear,
}: {
  rows: ReportRow[]
  selected?: ReportRow
  onSelect: (row: ReportRow) => void
  onClose: () => void
  onClear: () => void
}) {
  const kpis = hygieneKpis(rows)
  const trend = hygieneTrend(rows)
  const slices: Slice[] = [
    { key: "healthy", label: "Healthy", value: kpis.clear, color: findingLook.Healthy.color },
    { key: "attention", label: "Alarming", value: kpis.attention, color: findingLook["Alarming"].color },
    { key: "risk", label: "At Risk", value: kpis.atRisk, color: findingLook["At Risk"].color },
  ]

  const accessors: Accessors<ReportRow, Column> = {
    id: (r) => r.asset.id,
    name: (r) => r.asset.name,
    category: (r) => r.asset.category,
    area: (r) => r.asset.area,
    level: (r) => r.hygieneOpen,
    score: (r) => r.hygieneOpen,
    status: (r) => findingOrder.indexOf(r.hygieneStatus),
    inspected: (r) => (r.lastCleaned ? parseDmy(r.lastCleaned).getTime() : 0),
    due: (r) => (r.nextCleaningDue ? parseDmy(r.nextCleaningDue).getTime() : 0),
  }

  return (
    <div className="space-y-3">
      {/* The client was explicit that this report carries no health score */}
      <p className="rounded-lg bg-info-soft px-3 py-2 text-sm">
        Point-specific condition report over the Phase-1 physical parameters. It carries no health score — that is the
        contamination report's job.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
            <Sparkles className="size-5 text-primary" /> Asset Hygiene Status Distribution
          </h3>
          <DonutChart slices={slices} centreLabel="Total Assets" />
        </section>

        <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
            <TrendingUp className="size-5 text-primary" /> Hygiene Trend (Last 6 Months)
          </h3>
          <TrendChart
            data={trend}
            xKey="month"
            series={[
              { key: "Healthy", label: "Healthy", color: findingLook.Healthy.color },
              { key: "Alarming", label: "Alarming", color: findingLook["Alarming"].color },
              { key: "At Risk", label: "At Risk", color: findingLook["At Risk"].color },
            ]}
          />
        </section>
      </div>

      <ReportTable
        title="Asset Hygiene Details"
        rows={rows}
        accessors={accessors}
        selected={selected}
        onSelect={onSelect}
        onClose={onClose}
        onClear={onClear}
        kpis={
          <>
            <Kpi label="All Points Clear" value={kpis.clear} note="Nothing outstanding" tone="bg-healthy-soft text-healthy" />
            <Kpi label="Alarming" value={kpis.attention} note="Minor points open" tone="bg-attention-soft text-attention" />
            <Kpi label="At Risk" value={kpis.atRisk} note="Needs acting on" tone="bg-critical-soft text-critical" />
            <Kpi label="Open Points" value={kpis.openPoints} note="Across this scope" tone="bg-info-soft text-info" />
          </>
        }
        head={(sort, onSort) => (
          <>
            <SortHead label="Hygiene Status" column="status" sort={sort} onSort={onSort} />
            <SortHead label="Open Points" column="level" sort={sort} onSort={onSort} />
            <SortHead label="Last Cleaned" column="inspected" sort={sort} onSort={onSort} />
            <SortHead label="Next Cleaning Due" column="due" sort={sort} onSort={onSort} />
          </>
        )}
        cells={(r) => (
          <>
            <TableCell className={td}>
              <Badge variant={findingLook[r.hygieneStatus].badge} className="h-auto rounded px-2 py-1 text-xs">
                {r.hygieneStatus}
              </Badge>
            </TableCell>
            <TableCell className={cn(td, "tabular-nums")}>{r.hygieneOpen} of 8</TableCell>
            <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{r.lastCleaned || "—"}</TableCell>
            <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{r.nextCleaningDue || "—"}</TableCell>
          </>
        )}
      />
    </div>
  )
}

/* ---------- AI Insights ---------- */

/**
 * Grounded in the register rather than written out: every count below is read
 * off the rows on screen. The client's answer is explicit that AI output stays
 * advisory — it may recommend a product, a priority or a date, but nothing is
 * executed, scheduled or closed from it without an authorised user accepting it.
 */
function AiInsights({ rows }: { rows: ReportRow[] }) {
  const split = healthSplit(rows)
  const hotspots = hygieneHotspots(rows).filter((h) => h.failing > 0).slice(0, 5)

  /** Categories carrying the most assets below the healthy band */
  const byCategory = worstCategories(rows)

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-lg bg-highlight-soft px-3 py-2 text-sm">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-highlight" />
        <span>
          Advisory only. Recommendations may name a cleaning product, a priority or a next inspection date, but nothing is
          scheduled, executed or closed from them until an authorised user accepts it. Engineering and safety rules take
          precedence.
        </span>
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-2 text-base font-semibold text-brand-navy dark:text-foreground">Where the risk sits</h3>
          {byCategory.length ? (
            <ul className="space-y-2">
              {byCategory.map((c) => (
                <li key={c.category} className="flex items-center gap-2.5 text-sm">
                  <CategoryIcon category={c.category} className="size-5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{c.category}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {c.failing} of {c.total} below healthy
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">Nothing below the healthy band in this scope.</p>
          )}
        </section>

        <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-2 text-base font-semibold text-brand-navy dark:text-foreground">
            What the score is weighted on
          </h3>
          <ul className="space-y-2">
            {healthScoreWeights.map((w) => (
              <li key={w.input} className="flex items-center gap-2 text-sm">
                <span className="min-w-44 shrink-0">{w.input}</span>
                <span className="h-2 rounded-full bg-primary" style={{ width: `${w.weight}%` }} />
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{w.weight}%</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            From the scoring rules in the platform specification, not inferred from this data.
          </p>
        </section>

        <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-2 text-base font-semibold text-brand-navy dark:text-foreground">Health distribution</h3>
          <ul className="space-y-2 text-sm">
            {(
              [
                ["Healthy", split.healthy, "bg-healthy"],
                [healthStatus.attention.label, split.attention, "bg-attention"],
                ["At Risk", split.critical, "bg-critical"],
              ] as const
            ).map(([label, value, tone]) => (
              <li key={label} className="flex items-center gap-2">
                <span className={cn("size-2.5 shrink-0 rounded-full", tone)} />
                <span className="min-w-0 flex-1">{label}</span>
                <span className="shrink-0 font-semibold tabular-nums">{value}</span>
                <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                  {rows.length ? Math.round((value / rows.length) * 100) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-2 text-base font-semibold text-brand-navy dark:text-foreground">
            Physical points to work through
          </h3>
          {hotspots.length ? (
            <ul className="space-y-2 text-sm">
              {hotspots.map((h) => (
                <li key={h.check} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate">{h.check}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{h.failing} assets</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No physical points outstanding in this scope.</p>
          )}
        </section>
      </div>
    </div>
  )
}

/** Which categories carry the most assets below the healthy band */
function worstCategories(rows: ReportRow[]) {
  const map = new Map<string, { total: number; failing: number }>()
  for (const r of rows) {
    const entry = map.get(r.asset.category) ?? { total: 0, failing: 0 }
    entry.total += 1
    if (r.contaminationStatus === "At Risk" || r.contaminationStatus === "Alarming") entry.failing += 1
    map.set(r.asset.category, entry)
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .filter((c) => c.failing > 0)
    .sort((a, b) => b.failing - a.failing)
    .slice(0, 6)
}

/* ---------- Shared table ---------- */

function ReportTable({
  title,
  rows,
  accessors,
  selected,
  onSelect,
  onClose,
  onClear,
  kpis,
  head,
  cells,
}: {
  title: string
  rows: ReportRow[]
  accessors: Accessors<ReportRow, Column>
  selected?: ReportRow
  onSelect: (row: ReportRow) => void
  onClose: () => void
  onClear: () => void
  kpis: React.ReactNode
  /** The columns that differ between the two reports */
  head: (sort: Sort<Column>, onSort: (c: Column) => void) => React.ReactNode
  cells: (row: ReportRow) => React.ReactNode
}) {
  /* Asset ID ascending by default, which is the order the client asked for */
  const [sort, setSort] = useState<Sort<Column>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  // The accessors are rebuilt by the caller each render, so there is nothing a
  // memo could hold on to - and sorting a plant's register is cheap
  const ordered = sortRows(rows, sort, accessors)
  const pages = Math.max(1, Math.ceil(ordered.length / pageSize))

  const key = `${rows.length}-${pageSize}`
  const [lastKey, setLastKey] = useState(key)
  if (lastKey !== key) {
    setLastKey(key)
    setPage(1)
  }

  const start = (Math.min(page, pages) - 1) * pageSize
  const shown = ordered.slice(start, start + pageSize)
  const onSort = (c: Column) => setSort(nextSort(sort, c))

  return (
    <div className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">{kpis}</div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-brand-navy dark:text-foreground">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          className={cn(control, "bg-card")}
          onClick={() => toast.info("Export runs on the server and respects your filters and permissions.")}
        >
          <Download /> Export
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <SortHead label="Asset ID" column="id" sort={sort} onSort={onSort} />
              <SortHead label="Asset" column="name" sort={sort} onSort={onSort} />
              <SortHead label="Category" column="category" sort={sort} onSort={onSort} />
              <SortHead label="Location" column="area" sort={sort} onSort={onSort} />
              {head(sort, onSort)}
              <TableHead className={cn(th, "text-right")}>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => (
              <TableRow
                key={r.asset.id}
                aria-selected={selected?.asset.id === r.asset.id}
                /* The whole row opens the report; View stays for keyboard reach */
                onClick={() => onSelect(r)}
                className={cn(
                  "cursor-pointer",
                  selected?.asset.id === r.asset.id && "bg-info-soft hover:bg-info-soft"
                )}
              >
                {/* Colour alone would not carry the selection, so the row also
                    takes an accent bar down its left edge */}
                <TableCell
                  className={cn(
                    td,
                    "border-l-4 font-semibold whitespace-nowrap text-primary tabular-nums",
                    selected?.asset.id === r.asset.id ? "border-l-primary" : "border-l-transparent"
                  )}
                >
                  {r.asset.id}
                </TableCell>
                <TableCell className={cn(td, "max-w-56 whitespace-normal")}>
                  <span className="font-medium">{r.asset.name}</span>
                  <span className="block text-xs text-muted-foreground">{r.asset.tag}</span>
                </TableCell>
                <TableCell className={cn(td, "max-w-44 whitespace-normal")}>
                  <span className="flex items-center gap-1.5">
                    <CategoryIcon category={r.asset.category} className="size-5 shrink-0 text-muted-foreground" />
                    {r.asset.category}
                  </span>
                </TableCell>
                <TableCell className={cn(td, "max-w-40 whitespace-normal")}>{r.asset.area}</TableCell>
                {cells(r)}
                <TableCell className={cn(td, "text-right")}>
                  <Button
                    variant={selected?.asset.id === r.asset.id ? "default" : "outline"}
                    size="sm"
                    className={cn(selected?.asset.id !== r.asset.id && "bg-card")}
                    onClick={() => onSelect(r)}
                  >
                    {selected?.asset.id === r.asset.id ? "Viewing" : "View"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {shown.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="py-12 text-center">
                  <TriangleAlert className="mx-auto mb-2 size-6 text-muted-foreground" />
                  <p className="text-sm font-medium">No asset matches these filters.</p>
                  <Button variant="link" onClick={onClear}>
                    Clear the filters
                  </Button>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <TablePager
        page={Math.min(page, pages)}
        pages={pages}
        pageSize={pageSize}
        total={ordered.length}
        start={start}
        onPage={setPage}
        onPageSize={setPageSize}
      />

      {/* The report is a drawer down the full height of the screen. It is not
          modal: the table stays readable and clickable behind it, so another
          row can be opened without closing this one first. */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && onClose()} modal={false}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[32rem]">
          <SheetTitle className="sr-only">Asset details and health report</SheetTitle>
          <SheetDescription className="sr-only">
            The contamination and hygiene record for the selected asset.
          </SheetDescription>
          {selected ? <AssetReportPanel row={selected} onClose={onClose} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ---------- Pieces ---------- */

function Kpi({ label, value, note, tone }: { label: string; value: number; note: string; tone: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-foreground/10">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums", tone)}>
          {value}
        </span>
        <span className="text-xs leading-tight text-muted-foreground">{note}</span>
      </div>
    </div>
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
