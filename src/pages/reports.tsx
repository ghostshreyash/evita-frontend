import { useMemo, useState } from "react"
import { BookOpen, Search, Sparkles, SprayCan, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { TablePager } from "@/components/common/data-table"
import { CategoryIcon } from "@/components/common/category-icon"
import { categoryLook } from "@/lib/category-icons"
import { AssetReportPanel } from "@/components/reports/asset-report-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  contaminationTone,
  findingLook,
  findings,
  reportRows,
  type Finding,
  type ReportRow,
} from "@/data/report-data"
import { assetCategories } from "@/data/master-data"
import { control, PAGE_SIZES } from "@/lib/data-table"

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
  return (
    <ReportCards
      report="contamination"
      rows={rows}
      selected={selected}
      onSelect={onSelect}
      onClose={onClose}
      onClear={onClear}
      status={(r) => r.contaminationStatus}
      badge={(r) => (
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", contaminationTone[r.contamination])}>
          {r.contamination} contamination
        </span>
      )}
      facts={(r) => [
        { label: "Health Score", value: r.healthScore === null ? "—" : `${r.healthScore} / 100` },
        { label: "Last Inspection", value: r.lastInspection || "—" },
        { label: "Next Due", value: r.nextInspectionDue || "—" },
      ]}
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
  return (
    <div className="space-y-3">
      {/* The client was explicit that this report carries no health score */}
      <p className="rounded-lg bg-info-soft px-3 py-2 text-sm">
        Point-specific condition report over the Phase-1 physical parameters. It carries no health score — that is the
        contamination report's job.
      </p>

      <ReportCards
        report="hygiene"
        rows={rows}
        selected={selected}
        onSelect={onSelect}
        onClose={onClose}
        onClear={onClear}
        status={(r) => r.hygieneStatus}
        badge={(r) => (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
            {r.hygieneOpen} of 8 points open
          </span>
        )}
        facts={(r) => [
          { label: "Open Points", value: `${r.hygieneOpen} of 8` },
          { label: "Last Cleaned", value: r.lastCleaned || "—" },
          { label: "Next Cleaning Due", value: r.nextCleaningDue || "—" },
        ]}
      />
    </div>
  )
}

/* ---------- Shared card grid ---------- */

/** One labelled figure under a card's heading */
type Fact = { label: string; value: string }

/**
 * The assets a report covers, as cards rather than as a table.
 *
 * The engineer reads this on a tablet, standing up: each asset gets its own
 * card, led by the glyph for the kind of equipment it is, with the report's own
 * figures underneath. The rows arrive in asset-id order and stay in it.
 *
 * The whole card opens the report; it is a button, so it is reachable by
 * keyboard and announces its own selected state.
 */
function ReportCards({
  rows,
  selected,
  onSelect,
  onClose,
  onClear,
  status,
  badge,
  facts,
  report,
}: {
  rows: ReportRow[]
  selected?: ReportRow
  onSelect: (row: ReportRow) => void
  onClose: () => void
  onClear: () => void
  /** The finding the card's badge reports */
  status: (row: ReportRow) => Finding
  /** The one chip that differs between the two reports */
  badge: (row: ReportRow) => React.ReactNode
  facts: (row: ReportRow) => Fact[]
  /** Which report this grid is, so the drawer opens on the matching record */
  report: "contamination" | "hygiene"
}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  /* Asset ID ascending, which is the order the client asked for - see reportRows */
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))

  const key = `${rows.length}-${pageSize}`
  const [lastKey, setLastKey] = useState(key)
  if (lastKey !== key) {
    setLastKey(key)
    setPage(1)
  }

  const start = (Math.min(page, pages) - 1) * pageSize
  const shown = rows.slice(start, start + pageSize)

  return (
    <div className="rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      {shown.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => {
            const on = selected?.asset.id === r.asset.id
            const look = findingLook[status(r)]
            return (
              <li key={r.asset.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => onSelect(r)}
                  className={cn(
                    "flex h-full w-full flex-col overflow-hidden rounded-2xl bg-card text-left ring-1 transition-[transform,box-shadow] duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary motion-safe:hover:-translate-y-0.5 active:translate-y-0",
                    on ? "ring-2 ring-primary" : "ring-foreground/10"
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col p-3">
                    {/* The kind of equipment as a glyph, the finding on the end */}
                    <span className="flex items-start gap-2.5">
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", categoryLook(r.asset.category).tint)}>
                        <CategoryIcon category={r.asset.category} className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold tabular-nums text-primary">{r.asset.id}</span>
                        <span className="block truncate text-base leading-tight font-bold text-brand-navy dark:text-foreground">
                          {r.asset.name}
                        </span>
                      </span>
                      <Badge variant={look.badge} className="h-auto shrink-0 rounded-full px-2 py-1 text-xs">
                        {status(r)}
                      </Badge>
                    </span>

                    <span className="mt-2 truncate text-xs text-muted-foreground">{r.asset.area}</span>

                    <span className="mt-2 block">{badge(r)}</span>

                    <dl className="mt-2 divide-y border-t text-sm">
                      {facts(r).map((f) => (
                        <div key={f.label} className="flex items-center justify-between gap-2 py-1.5">
                          <dt className="text-muted-foreground">{f.label}</dt>
                          <dd className="truncate font-semibold tabular-nums">{f.value}</dd>
                        </div>
                      ))}
                    </dl>

                    <span
                      className={cn(
                        "mt-auto flex min-h-11 items-center justify-center gap-1.5 rounded-lg pt-3 text-sm font-semibold",
                        on ? "text-primary" : "text-foreground"
                      )}
                    >
                      {on ? "Viewing report" : "View report"}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="py-12 text-center">
          <TriangleAlert className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No asset matches these filters.</p>
          <Button variant="link" onClick={onClear}>
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

      {/* The report is a drawer down the full height of the screen. It is not
          modal: the cards stay readable and clickable behind it, so another
          asset can be opened without closing this one first. */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && onClose()} modal={false}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-[32rem]">
          <SheetTitle className="sr-only">Asset details and health report</SheetTitle>
          <SheetDescription className="sr-only">
            The contamination and hygiene record for the selected asset.
          </SheetDescription>
          {selected ? <AssetReportPanel row={selected} from={report} onClose={onClose} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ---------- Pieces ---------- */

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
