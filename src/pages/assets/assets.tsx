import { useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { ChevronRight, HardDrive, Plus, RotateCcw, Search, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { SortHead, TablePager } from "@/components/common/data-table"
import { CategoryIcon } from "@/components/assets/category-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { assetSyncMeta, parseDmy, type AssetRecord } from "@/data/asset-data"
import { kpisFor, useAssetRows } from "@/data/asset-store"
import { assetCategories, assetCriticality, healthBandFor } from "@/data/master-data"
import { control, nextSort, PAGE_SIZES, sortRows, td, th, type Accessors, type Sort } from "@/lib/data-table"
import { criticalityTone } from "@/data/occ-tables"
import { healthStatus } from "@/lib/status"

/** The columns a tap on the header can order the register by */
type Column = "id" | "name" | "category" | "area" | "criticality" | "health" | "onboarded"

const accessors: Accessors<AssetRecord, Column> = {
  id: (a) => a.id,
  name: (a) => a.name,
  category: (a) => a.category,
  area: (a) => a.area,
  // Ordered by how badly a failure would hurt, not alphabetically
  criticality: (a) => ["Low", "Medium", "High"].indexOf(a.criticality),
  health: (a) => a.health,
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
 * EVITA never shows another plant's equipment, so there is no enterprise or
 * plant filter — the strip under the header says which site this is, and
 * everything in the table belongs to it.
 */
export function AssetsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const register = useAssetRows()

  // The dashboard's category tiles deep-link here, so that filter starts from the URL
  const [category, setCategory] = useState(params.get("category") ?? ANY)
  const [query, setQuery] = useState("")
  const [area, setArea] = useState(ANY)
  const [criticality, setCriticality] = useState(ANY)
  const [band, setBand] = useState(ANY)
  const [status, setStatus] = useState(ANY)
  const [sort, setSort] = useState<Sort<Column>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  const filtersOn = [query, category, area, criticality, band, status].some((v) => v && v !== ANY)

  const kpis = useMemo(() => kpisFor(register), [register])

  /* Only the categories and areas actually on site, so a filter can never come up empty */
  const categories = useMemo(() => assetCategories.filter((c) => register.some((a) => a.category === c)), [register])
  const areas = useMemo(() => [...new Set(register.map((a) => a.area))].sort(), [register])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = register.filter(
      (a) =>
        (!q ||
          a.id.toLowerCase().includes(q) ||
          a.tag.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          a.serial.toLowerCase().includes(q) ||
          a.manufacturer.toLowerCase().includes(q)) &&
        (category === ANY || a.category === category) &&
        (area === ANY || a.area === area) &&
        (criticality === ANY || a.criticality === criticality) &&
        (band === ANY || healthBandFor(a.health).tone === band) &&
        (status === ANY || a.status === status)
    )
    return sortRows(matched, sort, accessors)
  }, [register, query, category, area, criticality, band, status, sort])

  const pages = Math.max(1, Math.ceil(rows.length / pageSize))

  /*
   * A filter change can leave the table on a page that no longer exists, so the
   * pager goes back to the first page whenever the filters move. Adjusted during
   * render rather than in an effect: an effect would paint the empty page first.
   */
  const filterKey = JSON.stringify([query, category, area, criticality, band, status, pageSize])
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
    setStatus(ANY)
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
      <p className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-info-soft px-3 py-2 text-sm">
        <HardDrive className="size-4 text-primary" />
        <span className="font-semibold">{site.plant}</span>
        <span className="text-muted-foreground">·</span>
        <span>{site.enterprise}</span>
      </p>

      {/* ---------- What the register adds up to ---------- */}
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Total Assets" value={kpis.total} note={`${kpis.categories} categories`} tone="bg-info-soft text-info" />
        <Kpi label={healthStatus.healthy.label} value={kpis.healthy} note="Score 70 and above" tone="bg-healthy-soft text-healthy" />
        <Kpi label={healthStatus.attention.label} value={kpis.attention} note="Score 50 – 69" tone="bg-attention-soft text-attention" />
        <Kpi label={healthStatus.critical.label} value={kpis.critical} note="Score below 50" tone="bg-critical-soft text-critical" />
        <Kpi label="Pending Sync" value={kpis.pendingSync} note="Not yet on the server" tone="bg-neutral-soft text-neutral-soft-foreground" />
      </div>

      {/* ---------- Narrowing the register ---------- */}
      <div className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search asset ID, tag, name, serial or make"
              aria-label="Search assets"
              className={cn(control, "pl-9")}
            />
          </div>

          <Filter label="Category" value={category} onChange={setCategory} options={categories} />
          <Filter label="Location" value={area} onChange={setArea} options={areas} />
          <Filter label="Criticality" value={criticality} onChange={setCriticality} options={assetCriticality} />
          <Filter label="Health" value={band} onChange={setBand} options={bands} />
          <Filter
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "onboarded", label: assetSyncMeta.onboarded.label },
              { value: "pending_sync", label: assetSyncMeta.pending_sync.label },
            ]}
          />

          <Button variant="ghost" className={control} onClick={reset} disabled={!filtersOn && !sort}>
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>

        {/* ---------- The register ---------- */}
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <SortHead label="Asset ID" column="id" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Asset" column="name" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Category" column="category" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Location" column="area" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Criticality" column="criticality" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Health" column="health" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <TableHead className={th}>Status</TableHead>
                <SortHead label="Onboarded" column="onboarded" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <TableHead className={cn(th, "text-right")}>
                  <span className="sr-only">Open</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((a) => {
                const health = healthBandFor(a.health)
                return (
                  <TableRow
                    key={a.id}
                    onClick={() => navigate(`/assets/${a.id}`)}
                    className="cursor-pointer"
                  >
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
                      <span className={cn("rounded px-2 py-1 text-xs font-semibold", criticalityTone[a.criticality])}>
                        {a.criticality}
                      </span>
                    </TableCell>
                    <TableCell className={td}>
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 shrink-0 rounded-full", healthStatus[health.tone].dot)} />
                        <span className="font-semibold tabular-nums">{a.health}</span>
                        <span className="text-xs text-muted-foreground">{health.label}</span>
                      </span>
                    </TableCell>
                    <TableCell className={td}>
                      <Badge variant={assetSyncMeta[a.status].badge} className="h-auto rounded px-2 py-1 text-xs">
                        {assetSyncMeta[a.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{a.onboarded}</TableCell>
                    <TableCell className={cn(td, "text-right")}>
                      <ChevronRight className="inline size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                )
              })}

              {shown.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="py-12 text-center">
                    <TriangleAlert className="mx-auto mb-2 size-6 text-muted-foreground" />
                    <p className="text-sm font-medium">No asset matches these filters.</p>
                    <Button variant="link" onClick={reset}>
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
          total={rows.length}
          start={start}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>
    </div>
  )
}

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
