import { useNavigate } from "react-router"
import { ClipboardCheck, MapPin, Play, SearchX, SquareArrowOutUpRight } from "lucide-react"
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
 * What a scanned label comes back as, inside the scanner itself: the asset in
 * brief, and the one thing the engineer walked up to it to do.
 *
 * It stays in the dialog rather than navigating, because a scan is a question
 * — is this the right asset? — and the answer has to be readable before
 * anything is opened or started.
 */
export function ScanResult({
  code,
  asset,
  onClose,
  onRetry,
}: {
  code: string
  asset?: AssetRecord
  /** Shut the scanner; the caller navigates afterwards */
  onClose: () => void
  /** Back to the camera, for a misread label */
  onRetry: () => void
}) {
  const navigate = useNavigate()

  if (!asset) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl bg-attention-soft p-3 ring-1 ring-attention/30">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-attention/15 text-attention">
            <SearchX className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">No asset at this plant matches that code</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Read as <span className="font-medium tabular-nums text-foreground">{code}</span>
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline" className="h-12" onClick={onRetry}>
            Scan again
          </Button>
          <Button
            variant="outline"
            className="h-12"
            onClick={() => {
              onClose()
              navigate(`/assets?asset=${encodeURIComponent(code)}`)
            }}
          >
            Search the register
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AssetBrief asset={asset} />
      <StartInspection asset={asset} onClose={onClose} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" className="h-12" onClick={onRetry}>
          Scan another
        </Button>
        <Button
          variant="outline"
          className="h-12"
          onClick={() => {
            onClose()
            navigate(`/assets/${asset.id}`)
          }}
        >
          <SquareArrowOutUpRight /> Open asset record
        </Button>
      </div>
    </div>
  )
}

/** The asset in brief — enough to know the right label was read */
function AssetBrief({ asset }: { asset: AssetRecord }) {
  const health = asset.health === null ? null : healthBandFor(asset.health)

  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 ring-1 ring-foreground/10">
      <span className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted/40">
        <AssetPhoto label={asset.category} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-brand-navy dark:text-foreground">{asset.name}</p>
        <p className="truncate text-sm font-medium tabular-nums text-primary">{asset.id}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CategoryIcon category={asset.category} className="size-3.5 shrink-0" />
            {asset.category}
          </span>
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{asset.area}</span>
          </span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
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
      </div>
    </div>
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
function StartInspection({ asset, onClose }: { asset: AssetRecord; onClose: () => void }) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()

  const job = jobs.find((j) => j.kind === "inspection" && actionFor(j) !== "view" && categoryFor(j.asset) === asset.category)

  if (!job) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
        <p className="text-sm text-muted-foreground">No inspection is assigned to you for this asset.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onClose()
            navigate("/inspections")
          }}
        >
          <ClipboardCheck /> Inspection tasks
        </Button>
      </div>
    )
  }

  const running = actionFor(job) === "continue"
  return (
    <div>
      <Button
        className="h-14 w-full text-base font-semibold shadow-md shadow-primary/25"
        onClick={() => {
          if (!running) startJob(job, me.name)
          onClose()
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
