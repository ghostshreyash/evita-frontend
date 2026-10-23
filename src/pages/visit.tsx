import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import { ArrowLeft, CalendarDays, CheckCircle2, Factory, MapPin, QrCode, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { CategoryIcon } from "@/components/common/category-icon"
import { StartInspection } from "@/components/assets/start-inspection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { slotLabel } from "@/data/occ-tables"
import { visitStatusLook } from "@/data/visits"
import { categoryLook } from "@/lib/category-icons"
import { healthBandFor } from "@/data/master-data"
import { healthStatus } from "@/lib/status"
import { openPanel } from "@/lib/ui-store"
import { useInspectedAssets, useVisit } from "@/lib/visits"
import { isToday, parseDay } from "@/lib/work"

/**
 * One scheduled visit: the area, and the assets standing in it.
 *
 * The visit names no asset - it names a place - so this screen is the list the
 * engineer works down. Each asset is inspected from here or by scanning its
 * label on the panel door, which comes to the same record either way.
 *
 * Nothing on this screen marks an asset done by hand. An asset is inspected
 * because an inspection exists against it, so walking away and coming back
 * leaves the list exactly where it was.
 */
export function VisitPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const found = useVisit(id)
  const inspected = useInspectedAssets()

  if (!found) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
        <TriangleAlert className="size-8 text-attention" />
        <p className="max-w-md text-sm text-muted-foreground">
          <span className="font-semibold">{id}</span> is not a visit on your book. It may have been reassigned, or it
          belongs to another enterprise - check the one you are working in.
        </p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  const { visit, assets, progress } = found
  const look = visitStatusLook[progress.status]
  const when = isToday(visit.date) ? "Today" : format(parseDay(visit.date), "EEE d MMM")

  return (
    <div>
      <PageHeader
        title={visit.area}
        badge={
          <Badge variant={look.badge} className="h-auto rounded-full px-2.5 py-1 text-sm">
            {look.label}
          </Badge>
        }
        description={`${visit.plant}, ${visit.enterprise}`}
        breadcrumbs={[{ label: "Home", to: "/" }, { label: visit.id }]}
        actions={
          <>
            <Button onClick={() => openPanel({ kind: "scan" })}>
              <QrCode /> Scan Asset
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft /> Back
            </Button>
          </>
        }
      />

      {/* What the visit is, and how far down it the engineer has got */}
      <section className="mb-3 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4 text-primary" /> {visit.area}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Factory className="size-4" /> {visit.plant}
          </span>
          <span className="flex items-center gap-1.5 tabular-nums text-muted-foreground">
            <CalendarDays className="size-4" /> {when}, {slotLabel(visit.slot)}
          </span>
          <span className="ml-auto text-sm font-semibold tabular-nums">
            {progress.done} of {progress.total} inspected
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      </section>

      {assets.length ? (
        <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => {
            const done = inspected.has(asset.id)
            const band = asset.health === null ? null : healthBandFor(asset.health)
            return (
              <li key={asset.id}>
                <article
                  className={cn(
                    "flex h-full flex-col rounded-2xl bg-card p-3 shadow-xs ring-1 transition-shadow hover:shadow-md",
                    done ? "ring-healthy/40" : "ring-foreground/10"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        categoryLook(asset.category).tint
                      )}
                    >
                      <CategoryIcon category={asset.category} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link to={`/assets/${asset.id}`} className="block truncate text-sm font-bold tabular-nums text-primary hover:underline">
                        {asset.id}
                      </Link>
                      <div className="truncate text-base leading-tight font-bold text-brand-navy dark:text-foreground">
                        {asset.name}
                      </div>
                    </div>
                    {done ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-healthy-soft px-2 py-1 text-xs font-semibold text-healthy">
                        <CheckCircle2 className="size-3.5" /> Done
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                    <span className="truncate">{asset.category}</span>
                    {band ? (
                      <span className={cn("rounded-full px-2 py-0.5 font-semibold", healthStatus[band.tone].tile)}>
                        {band.label} · <span className="tabular-nums">{asset.health}</span>
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium">Not inspected yet</span>
                    )}
                  </p>

                  <div className="mt-auto pt-3">
                    <StartInspection asset={asset} size="default" />
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="rounded-2xl bg-card py-12 text-center shadow-xs ring-1 ring-foreground/10">
          <TriangleAlert className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No asset is registered in this area yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Onboard what you find, then inspect it — the visit picks it up from the register.
          </p>
          <Button className="mt-3" asChild>
            <Link to="/assets/onboarding">Onboard Asset</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
