import { useMemo, useState } from "react"
import { BookOpen, Download, HardDrive, Search, Sparkles, SprayCan, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { SortHead, TablePager } from "@/components/common/data-table"
import { CategoryIcon } from "@/components/common/category-icon"
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
  hygieneKpis,
  reportRows,
  uninspectedCount,
  type Finding,
  type ReportRow,
} from "@/data/report-data"
import { assetCategories } from "@/data/master-data"
import { control, nextSort, PAGE_SIZES, sortRows, td, th, type Accessors, type Sort } from "@/lib/data-table"
import { parseDmy } from "@/data/asset-data"

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
          r.asset.area.toLowerCase().includes(q)) &&
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
        {/* An underline rather than a segmented control: these are views of one
            report, not three filters, and the row has to scroll on a narrow tablet */}
        <TabsList className="h-auto w-full justify-start gap-0 overflow-x-auto rounded-none border-b bg-transparent p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { value: "contamination", icon: SprayCan, label: "Contamination Wise Report" },
              { value: "hygiene", icon: Sparkles, label: "Hygiene Wise Report" },
            ] as const
          ).map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="-mb-px min-h-12 shrink-0 gap-2 rounded-none border-b-2 border-transparent px-4 text-sm font-semibold whitespace-nowrap text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <tab.icon className="size-4" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ---------- Filters, shared by both report tabs ---------- */}
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
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
    <div className="rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
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
    <div className="rounded-2xl bg-card px-3 py-2.5 ring-1 ring-foreground/10">
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
