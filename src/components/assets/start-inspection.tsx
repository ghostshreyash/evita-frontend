import { useNavigate } from "react-router"
import { Play } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import type { AssetRecord } from "@/data/asset-data"
import { addInspectionForAsset } from "@/data/inspection-store"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { actionFor, inspectionFor, jobPath, useMyJobs } from "@/lib/work"

/**
 * Inspect the asset in front of you.
 *
 * An inspection is not an assigned task. The client was explicit on
 * 12-10-2026: the ELPREMAR walks up to a panel, onboards it or scans its
 * label, and inspects it - "yeh pura task usne apne marzi se kiya". So this
 * button always works. An assignment only decides whether the inspection is
 * already on the book or is raised here and then.
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
  const assigned = inspectionFor(useMyJobs(), asset)
  const running = assigned ? actionFor(assigned) === "continue" : false

  const go = () => {
    onLeave?.()
    if (assigned) {
      if (!running) startJob(assigned, me.name)
      navigate(jobPath(assigned))
      return
    }
    // Nothing on the book for it: raise the inspection here and open it
    navigate(`/inspections/${addInspectionForAsset(asset, me.name)}`)
  }

  return (
    <div className={className}>
      <Button
        size={size}
        className={cn("w-full font-semibold shadow-md shadow-primary/25", size === "lg" && "h-14 text-base")}
        onClick={go}
      >
        <Play className="fill-current" /> {running ? "Continue Inspection" : "Start Inspection"}
      </Button>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        {assigned ? (
          <>
            <span className="tabular-nums font-medium">{assigned.id}</span> · {assigned.activity}
          </>
        ) : (
          "Not on your book — this raises the inspection against this asset"
        )}
      </p>
    </div>
  )
}
