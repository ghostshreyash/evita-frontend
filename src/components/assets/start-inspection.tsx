import { useNavigate } from "react-router"
import { ClipboardCheck, Play } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import type { AssetRecord } from "@/data/asset-data"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { actionFor, inspectionFor, useMyJobs } from "@/lib/work"

/**
 * The button that opens the inspection on this asset.
 *
 * An inspection is assigned by EMMS-E, never raised from the tablet, so there
 * is nothing to create here: it starts the one already on the engineer's book
 * for this asset, continues it if it is running, and says plainly when there is
 * none - see `inspectionFor`.
 */
export function StartInspection({
  asset,
  /** Run before navigating, for a caller that has a dialog to shut */
  onLeave,
  className,
  size = "lg",
}: {
  asset: AssetRecord
  onLeave?: () => void
  className?: string
  size?: "lg" | "default"
}) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const job = inspectionFor(useMyJobs(), asset)

  const go = (to: string) => {
    onLeave?.()
    navigate(to)
  }

  if (!job) {
    return (
      <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5", className)}>
        <p className="text-sm text-muted-foreground">No inspection is assigned to you for this asset.</p>
        <Button variant="outline" size="sm" onClick={() => go("/inspections")}>
          <ClipboardCheck /> Inspection tasks
        </Button>
      </div>
    )
  }

  const running = actionFor(job) === "continue"
  return (
    <div className={className}>
      <Button
        size={size}
        className={cn("w-full font-semibold shadow-md shadow-primary/25", size === "lg" && "h-14 text-base")}
        onClick={() => {
          if (!running) startJob(job, me.name)
          go(`/my-tasks/${job.id}`)
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
