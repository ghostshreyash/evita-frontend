import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { ChevronRight, HardDrive, LayoutGrid, List, Plus, Search, SlidersHorizontal, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { ChipTabs, type ChipTab } from "@/components/common/chip-tabs"
import { AssetPhoto } from "@/components/common/asset-photo"
import { SortHead, TablePager } from "@/components/common/data-table"
import { CategoryIcon } from "@/components/common/category-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseDmy, type AssetRecord } from "@/data/asset-data"
import { kpisFor, useAssetRows } from "@/data/asset-store"
import { assetCategories, assetCriticality, healthBandFor } from "@/data/master-data"
import { control, nextSort, PAGE_SIZES, sortRows, td, th, type Accessors, type Sort } from "@/lib/data-table"
import { criticalityTone } from "@/data/occ-tables"
import { healthStatus } from "@/lib/status"

/** The columns a tap on the header can order the register by, in list view */
type Column = "id" | "name" | "category" | "area" | "criticality" | "health" | "onboarded"

const accessors: Accessors<AssetRecord, Column> = {
  id: (a) => a.id,
  name: (a) => a.name,
  category: (a) => a.category,
  area: (a) => a.area,
  // Ordered by how badly a failure would hurt, not alphabetically
  criticality: (a) => ["Low", "Medium", "High"].indexOf(a.criticality),
  // Unscored assets sort below every scored one rather than above At Risk
  health: (a) => a.health ?? -1,
  onboarded: (a) => parseDmy(a.onboarded).getTime(),
}

/** Sentinel for a filter that is not narrowing anything; Select has no empty value */
const ANY = "all"

/** Health bands, as the Health filter offers them */
const bands = [
  { value: "healthy", label: healthStatus.healthy.label },
  { value: "attention", label: healthStatus.attention.label },
  { value: "critical", label: healthStatus.critical.label },
]

/**
 * The asset register for the engineer's own site.
 *
 * A grid of cards by default: on a tablet an asset is found by its picture and
 * its name, not by reading across eight columns. The table is still there as
 * the list view for anyone who wants to sort by a column, and both views read
 * the same filtered rows.
 *
 * EVITA never shows another plant's equipment, so there is no enterprise or
 * plant filter — the strip under the header says which site this is, and
 * everything below belongs to it.
 */
export function AssetsPage() {
  const [params, setParams] = useSearchParams()
  const register = useAssetRows()

  // The dashboard's category tiles deep-link here, so that filter starts from the URL
  const [category, setCategory] = useState(params.get("category") ?? ANY)
  /* A scanned label arrives as ?asset=<id> and lands in the search box, so the
     code the camera read is visible and can be corrected if it misread */
  const [query, setQuery] = useState(params.get("asset") ?? "")
  const [area, setArea] = useState(ANY)
  const [criticality, setCriticality] = useState(ANY)
  const [band, setBand] = useState(ANY)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<Sort<Column>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  const narrowed = [area, criticality, band].filter((v) => v !== ANY).length
  const filtersOn = [query, category, area, criticality, band].some((v) => v && v !== ANY)

  const kpis = useMemo(() => kpisFor(register), [register])

  /* Only the areas actually on site, so a filter can never come up empty */
  const areas = useMemo(() => [...new Set(register.map((a) => a.area))].sort(), [register])

  /** Everything but the category chips, so their counts show what choosing one would give */
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase()
    return register.filter(
      (a) =>
        (!q ||
          a.id.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.area.toLowerCase().includes(q)) &&
        (area === ANY || a.area === area) &&
        (criticality === ANY || a.criticality === criticality) &&
        (band === ANY || (a.health !== null && healthBandFor(a.health).tone === band))
    )
  }, [register, query, area, criticality, band])

  const rows = useMemo(
    () => sortRows(matched.filter((a) => category === ANY || a.category === category), sort, accessors),
    [matched, category, sort]
  )

  const categoryTabs: ChipTab[] = useMemo(
    () => [
      { value: ANY, label: "All", count: matched.length },
      ...assetCategories
        .map((c) => ({ value: c, label: c, count: matched.filter((a) => a.category === c).length }))
        .filter((tab) => tab.count > 0 || tab.value === category),
    ],
    [matched, category]
  )

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))

  /*
   * A filter change can leave the list on a page that no longer exists, so the
   * pager goes back to the first page whenever the filters move. Adjusted during
   * render rather than in an effect: an effect would paint the empty page first.
   */
  const filterKey = JSON.stringify([query, category, area, criticality, band, pageSize])
  const [lastFilters, setLastFilters] = useState(filterKey)
  if (lastFilters !== filterKey) {
    setLastFilters(filterKey)
    setPage(1)
  }

  const start = (Math.min(page, pages) - 1) * pageSize
  const shown = rows.slice(start, start + pageSize)

  const reset = () => {
    setQuery("")
    setCategory(ANY)
    setArea(ANY)
    setCriticality(ANY)
    setBand(ANY)
    setSort(null)
    setParams({}, { replace: true })
  }

  const site = register[0]

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Every asset registered at your plant, and the condition it was last left in."
        breadcrumbs={[{ label: "Assets" }]}
        actions={
          <Button asChild>
            <Link to="/assets/onboarding">
              <Plus /> Onboard Asset
            </Link>
          </Button>
        }
      />

      {/* Which site this register belongs to — EVITA shows one plant and no other */}
      <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl bg-info-soft px-3 py-2 text-sm">
        <HardDrive className="size-4 text-primary" />
        <span className="font-semibold">{site.plant}</span>
        <span className="text-muted-foreground">·</span>
        <span>{site.enterprise}</span>
      </p>

      {/* ---------- What the register adds up to ---------- */}
      <div className="mb-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Kpi label="Total Assets" value={kpis.total} note={`${kpis.categories} categories`} tone="bg-info-soft text-info" />
        <Kpi label={healthStatus.healthy.label} value={kpis.healthy} note="Score 70 and above" tone="bg-healthy-soft text-healthy" />
        <Kpi label={healthStatus.attention.label} value={kpis.attention} note="Score 50 – 69" tone="bg-attention-soft text-attention" />
        <Kpi label={healthStatus.critical.label} value={kpis.critical} note="Score below 50" tone="bg-critical-soft text-critical" />
      </div>

      {/* ---------- Search, the rest of the filters behind a toggle, and the view ---------- */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search asset ID, tag, name or location"
            aria-label="Search assets"
            className={cn(control, "bg-card pl-9")}
          />
        </div>

        <Button
          variant="outline"
          aria-expanded={showFilters}
          className={cn(control, "bg-card", narrowed && "border-primary text-primary")}
          onClick={() => setShowFilters((open) => !open)}
        >
          <SlidersHorizontal /> Filter
          {narrowed ? <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">{narrowed}</span> : null}
        </Button>

        <div className="flex h-11 shrink-0 items-center rounded-2xl bg-card p-1 ring-1 ring-foreground/15">
          <ViewToggle current={view} value="grid" icon={LayoutGrid} label="Grid view" onChange={setView} />
          <ViewToggle current={view} value="list" icon={List} label="List view" onChange={setView} />
        </div>

        <Button variant="outline" className={cn(control, "bg-card")} onClick={reset} disabled={!filtersOn && !sort}>
          <X /> Clear
        </Button>
      </div>

      {showFilters ? (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
          <Filter label="Location" value={area} onChange={setArea} options={areas} />
          <Filter label="Criticality" value={criticality} onChange={setCriticality} options={assetCriticality} />
          <Filter label="Health Status" value={band} onChange={setBand} options={bands} />
        </div>
      ) : null}

      <ChipTabs label="Asset category" tabs={categoryTabs} value={category} onChange={setCategory} className="mb-3" />

      {/* ---------- The register ---------- */}
      {shown.length === 0 ? (
        <div className="rounded-2xl bg-card py-14 text-center shadow-xs ring-1 ring-foreground/10">
          <TriangleAlert className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No asset matches these filters.</p>
          <Button variant="link" onClick={reset}>
            Clear the filters
          </Button>
        </div>
      ) : view === "grid" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </ul>
      ) : (
        <AssetTable rows={shown} sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
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
 * One asset as a card: its picture, what it is called, where it stands and the
 * condition it was last left in.
 *
 * Seeded assets carry no captured photograph, so `AssetPhoto` draws the
 * category glyph instead of a broken image.
 */
function AssetCard({ asset }: { asset: AssetRecord }) {
  const health = asset.health === null ? null : healthBandFor(asset.health)

  return (
    <li className="overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-primary">
      <Link to={`/assets/${asset.id}`} className="block outline-none">
        <div className="relative h-32 bg-muted/40">
          <AssetPhoto label={asset.category} />
          <Badge
            variant={health ? healthStatus[health.tone].badge : "neutral"}
            className="absolute top-2 right-2 h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {health ? health.label : "Onboarded"}
          </Badge>
        </div>

        <div className="p-3">
          <h3 className="truncate text-base font-bold text-brand-navy dark:text-foreground">{asset.name}</h3>
          <p className="mt-0.5 truncate text-sm tabular-nums font-medium text-primary">{asset.id}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CategoryIcon category={asset.category} className="size-4 shrink-0" />
            <span className="truncate">{asset.area}</span>
          </p>
          <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", criticalityTone[asset.criticality])}>
              {asset.criticality}
            </span>
            {health ? (
              <span className="flex items-center gap-1.5 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", healthStatus[health.tone].dot)} />
                <span className="font-bold tabular-nums">{asset.health}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Not inspected yet</span>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}

/** The register as a sortable table, for anyone who wants to order by a column */
function AssetTable({ rows, sort, onSort }: { rows: AssetRecord[]; sort: Sort<Column>; onSort: (column: Column) => void }) {
  const navigate = useNavigate()
  return (
    <div className="overflow-x-auto rounded-2xl bg-card p-1 shadow-xs ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <SortHead label="Asset ID" column="id" sort={sort} onSort={onSort} />
            <SortHead label="Asset" column="name" sort={sort} onSort={onSort} />
            <SortHead label="Category" column="category" sort={sort} onSort={onSort} />
            <SortHead label="Location" column="area" sort={sort} onSort={onSort} />
            <SortHead label="Criticality" column="criticality" sort={sort} onSort={onSort} />
            <SortHead label="Score" column="health" sort={sort} onSort={onSort} />
            <TableHead className={th}>Health Status</TableHead>
            <SortHead label="Onboarded On" column="onboarded" sort={sort} onSort={onSort} />
            <TableHead className={cn(th, "text-right")}>
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => {
            const health = a.health === null ? null : healthBandFor(a.health)
            return (
              <TableRow key={a.id} onClick={() => navigate(`/assets/${a.id}`)} className="cursor-pointer">
                <TableCell className={cn(td, "font-semibold whitespace-nowrap text-primary tabular-nums")}>{a.id}</TableCell>
                <TableCell className={cn(td, "max-w-56 whitespace-normal")}>
                  <span className="font-medium">{a.name}</span>
                  <span className="block text-xs text-muted-foreground">{a.tag}</span>
                </TableCell>
                <TableCell className={cn(td, "max-w-44 whitespace-normal")}>
                  <span className="flex items-center gap-1.5">
                    <CategoryIcon category={a.category} className="size-5 shrink-0 text-muted-foreground" />
                    {a.category}
                  </span>
                </TableCell>
                <TableCell className={cn(td, "max-w-44 whitespace-normal")}>{a.area}</TableCell>
                <TableCell className={td}>
                  <span className={cn("rounded px-2 py-1 text-xs font-semibold", criticalityTone[a.criticality])}>{a.criticality}</span>
                </TableCell>
                <TableCell className={td}>
                  {health ? (
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2 shrink-0 rounded-full", healthStatus[health.tone].dot)} />
                      <span className="font-semibold tabular-nums">{a.health}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className={td}>
                  {/* No score yet means the asset is registered but not inspected */}
                  <Badge variant={health ? healthStatus[health.tone].badge : "neutral"} className="h-auto rounded px-2 py-1 text-xs">
                    {health ? health.label : "Onboarded"}
                  </Badge>
                </TableCell>
                <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{a.onboarded}</TableCell>
                <TableCell className={cn(td, "text-right")}>
                  <ChevronRight className="inline size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/** Grid or list, as a pair of segmented buttons */
function ViewToggle({
  current,
  value,
  icon: Icon,
  label,
  onChange,
}: {
  current: "grid" | "list"
  value: "grid" | "list"
  icon: React.ComponentType<{ className?: string }>
  label: string
  onChange: (v: "grid" | "list") => void
}) {
  const on = current === value
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      onClick={() => onChange(value)}
      className={cn("flex size-9 items-center justify-center rounded-md", on ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
    >
      <Icon className="size-5" />
    </button>
  )
}

function Kpi({ label, value, note, tone }: { label: string; value: number; note: string; tone: string }) {
  return (
    <div className="rounded-2xl bg-card px-3 py-2.5 shadow-xs ring-1 ring-foreground/10">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2.5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-bold tabular-nums", tone)}>
          {value}
        </span>
        <span className="text-xs leading-tight text-muted-foreground">{note}</span>
      </div>
    </div>
  )
}

/** One dropdown filter, with an "All" option that clears it */
function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  /** Plain strings, or value/label pairs where the two differ */
  options: readonly string[] | readonly { value: string; label: string }[]
}) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className={cn(control, "w-auto min-w-36 bg-card")}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{label}: All</SelectItem>
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
