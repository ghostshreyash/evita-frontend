import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import { ArrowLeft, CalendarDays, CheckCircle2, Factory, MapPin, Plus, QrCode, RotateCcw, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { CategoryIcon } from "@/components/common/category-icon"
import { StartInspection } from "@/components/assets/start-inspection"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { slotLabel } from "@/data/occ-tables"
import { visitStatusLook } from "@/data/visits"
import { completeVisit, reopenVisit } from "@/data/visit-store"
import { categoryLook } from "@/lib/category-icons"
import { healthBandFor } from "@/data/master-data"
import { healthStatus } from "@/lib/status"
import { openPanel } from "@/lib/ui-store"
import { useInspectedAssets, useVisit } from "@/lib/visits"
import { isToday, parseDay } from "@/lib/work"

/**
 * One scheduled visit: the area, and the assets standing in it.
 *
 * The visit names no asset - it names a place - and at an area EVITA has not
 * been to the register has nothing in it at all. That is the normal case, not
 * an error: the engineer onboards what they find and inspects what they
 * onboarded, so Onboard Asset is the first control on the screen and the empty
 * list reads as a list waiting to be built.
 *
 * Nothing here marks an asset done by hand. An asset is inspected because an
 * inspection exists against it, and it is on the visit because the register
 * puts it in that area - so walking away and coming back leaves the screen
 * exactly where it was.
 */
export function VisitPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const found = useVisit(id)
  const inspected = useInspectedAssets()
  const [closing, setClosing] = useState(false)

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
  /* The wizard opens on this visit's own plant and area, and comes back here */
  const onboardHere = `/assets/onboarding?area=${encodeURIComponent(visit.area)}&visit=${visit.id}`
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
            {/*
              * Finishing is a statement, not a count: the number on the booking
              * is the enterprise's estimate, and finding fewer is normal.
              */}
            {progress.closed ? (
              <Button variant="outline" onClick={() => reopenVisit(visit.id)}>
                <RotateCcw /> Reopen Visit
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-healthy/40 text-healthy"
                onClick={() => setClosing(true)}
                disabled={progress.onboarded === 0}
              >
                <CheckCircle2 /> Complete Visit
              </Button>
            )}

            {/* The asset may not be on the register yet: that is what a first visit is */}
            <Button asChild>
              <Link to={onboardHere}>
                <Plus /> Onboard Asset
              </Link>
            </Button>
            <Button variant="outline" onClick={() => openPanel({ kind: "scan" })}>
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
          <span className="ml-auto flex flex-wrap items-center gap-x-3 text-sm font-semibold tabular-nums">
            <span>
              {progress.onboarded} of {progress.expected} onboarded
            </span>
            <span className="text-muted-foreground">·</span>
            <span>
              {progress.done} of {progress.onboarded} inspected
            </span>
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress.onboarded ? (progress.done / progress.onboarded) * 100 : 0}%` }}
          />
        </div>

        {/* What the enterprise wrote on the booking, where there is anything */}
        {visit.note && !progress.closed ? (
          <p className="mt-2 text-sm text-muted-foreground">{visit.note}</p>
        ) : null}

        {progress.closed ? (
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-healthy-soft px-3 py-2 text-sm text-healthy-soft-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>
              You closed this area out with {progress.onboarded} asset{progress.onboarded === 1 ? "" : "s"} registered.
              Reopen it if you find more.
            </span>
          </p>
        ) : null}

        {/* The count is the enterprise's estimate, so neither direction is a fault */}
        {progress.onboarded > progress.expected ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {progress.onboarded - progress.expected} more than this area was booked for. The count on the booking is an
            estimate — register everything you find.
          </p>
        ) : null}
      </section>

      <AlertDialog open={closing} onOpenChange={setClosing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this visit?</AlertDialogTitle>
            <AlertDialogDescription>
              {progress.onboarded} of the {visit.expected} assets this area was booked for are registered, and{" "}
              {progress.done} of them inspected.
              {progress.onboarded < visit.expected
                ? " Fewer than booked is normal — the count on the booking is the enterprise's estimate. What you register is the correction to it."
                : ""}
              {!progress.allDone
                ? " Anything not inspected stays on the asset, and the area can be reopened if you come back to it."
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                completeVisit(visit.id, progress.onboarded)
                setClosing(false)
                toast.success(`${visit.id} completed`, {
                  description: `${visit.area} · ${progress.onboarded} asset${progress.onboarded === 1 ? "" : "s"} registered`,
                })
              }}
            >
              <CheckCircle2 /> Complete Visit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {/* Another one found while walking the area */}
          <li>
            <Link
              to={onboardHere}
              className="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 p-3 text-center text-primary transition-colors hover:bg-info-soft/50"
            >
              <Plus className="size-6" />
              <span className="text-sm font-semibold">Onboard another asset</span>
              <span className="text-xs text-muted-foreground">Found something not on the list</span>
            </Link>
          </li>
        </ul>
      ) : (
        <div className="rounded-2xl bg-card px-4 py-12 text-center shadow-xs ring-1 ring-foreground/10">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-info-soft text-primary">
            <Plus className="size-6" />
          </span>
          <p className="text-base font-semibold text-brand-navy dark:text-foreground">
            Nothing registered in {visit.area} yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {visit.expected} assets are expected here. Onboard each one as you come to it — it joins this list, and you
            can inspect it straight away.
          </p>
          <Button size="lg" className="mt-4 h-14 px-6 text-base font-semibold" asChild>
            <Link to={onboardHere}>
              <Plus /> Onboard the first asset
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
