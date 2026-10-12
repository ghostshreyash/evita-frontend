import { Link, useNavigate } from "react-router"
import { ClipboardCheck, MapPin, Play, ScanLine, SearchX, X } from "lucide-react"
import { cn } from "cn"

import { AssetPhoto } from "@/components/common/asset-photo"
import { CategoryIcon } from "@/components/common/category-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { healthBandFor } from "@/data/master-data"
import { criticalityTone } from "@/data/occ-tables"
import type { AssetRecord } from "@/data/asset-data"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { healthStatus } from "@/lib/status"
import { actionFor, categoryFor, useMyJobs } from "@/lib/work"

/**
 * What a scanned label comes back as: the asset in brief, and the one thing
 * the engineer walked up to it to do.
 *
 * The scanner hands the code to the register as `?asset=<code>` rather than
 * opening the asset outright, so a misread is visible and correctable. When
 * the code resolves this card names the asset and opens it on a tap; when it
 * does not, it says so and leaves the code in the search box.
 */
export function ScanResult({ code, asset, onDismiss }: { code: string; asset?: AssetRecord; onDismiss: () => void }) {
  if (!asset) {
    return (
      <Shell onDismiss={onDismiss} tone="bg-attention-soft ring-attention/30">
        <div className="flex items-center gap-3 p-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-attention/15 text-attention">
            <SearchX className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">No asset here matches that code</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Scanned <span className="font-medium tabular-nums text-foreground">{code}</span> · it is in the search box
              below, so you can correct it
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell onDismiss={onDismiss} tone="bg-info-soft ring-primary/30">
      <AssetBrief asset={asset} />
      <StartInspection asset={asset} />
    </Shell>
  )
}

/** The scanned-label frame: a header strip, then whatever the code resolved to */
function Shell({ tone, onDismiss, children }: { tone: string; onDismiss: () => void; children: React.ReactNode }) {
  return (
    <section className={cn("mb-3 overflow-hidden rounded-2xl shadow-xs ring-1", tone)}>
      <header className="flex items-center gap-2 px-3 py-2 text-sm font-semibold">
        <ScanLine className="size-4" /> Scanned
        <button
          type="button"
          aria-label="Dismiss the scan"
          onClick={onDismiss}
          className="ml-auto flex size-8 items-center justify-center rounded-full hover:bg-black/5"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="bg-card">{children}</div>
    </section>
  )
}

/** The asset in brief; the whole block opens its record */
function AssetBrief({ asset }: { asset: AssetRecord }) {
  const health = asset.health === null ? null : healthBandFor(asset.health)

  return (
    <Link to={`/assets/${asset.id}`} className="flex items-center gap-3 p-3 outline-none hover:bg-muted/40">
      <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/40">
        <AssetPhoto label={asset.category} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-brand-navy dark:text-foreground">{asset.name}</span>
        <span className="block truncate text-sm font-medium tabular-nums text-primary">{asset.id}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CategoryIcon category={asset.category} className="size-3.5 shrink-0" />
            {asset.category}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{asset.area}</span>
          </span>
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1.5">
        <Badge
          variant={health ? healthStatus[health.tone].badge : "neutral"}
          className="h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {health ? health.label : "Onboarded"}
        </Badge>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", criticalityTone[asset.criticality])}>
          {asset.criticality}
        </span>
        {health ? <span className="text-sm font-bold tabular-nums">{asset.health}/100</span> : null}
      </span>
    </Link>
  )
}

/**
 * The reason the label was scanned.
 *
 * An inspection is assigned by EMMS-E, never raised from the tablet, so the
 * button starts the one that is already on the engineer's book for this kind
 * of asset. With nothing assigned it says so rather than pretending.
 *
 * TODO: there is no asset id on a task yet. The mock book names its assets
 * loosely ("LT Panel - Block A") while the register names them by series ("LT
 * Panel - 01"), and the two sit at different plants, so the only link that
 * holds is the asset category. Match on the asset id once the API carries one.
 */
function StartInspection({ asset }: { asset: AssetRecord }) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()

  const job = jobs.find((j) => j.kind === "inspection" && actionFor(j) !== "view" && categoryFor(j.asset) === asset.category)

  if (!job) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2.5">
        <p className="text-sm text-muted-foreground">No inspection is assigned to you for this asset.</p>
        <Button variant="outline" size="sm" onClick={() => navigate("/inspections")}>
          <ClipboardCheck /> Inspection tasks
        </Button>
      </div>
    )
  }

  const running = actionFor(job) === "continue"
  return (
    <div className="border-t p-3">
      <Button
        className="h-14 w-full text-base font-semibold shadow-md shadow-primary/25"
        onClick={() => {
          if (!running) startJob(job, me.name)
          navigate(`/my-tasks/${job.id}`)
        }}
      >
        <Play className="fill-current" /> {running ? "Continue Inspection" : "Start Inspection"}
      </Button>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        <span className="tabular-nums font-medium">{job.id}</span> · {job.activity}
      </p>
    </div>
  )
}
