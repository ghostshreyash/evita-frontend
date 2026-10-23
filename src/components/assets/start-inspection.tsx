import { useNavigate } from "react-router"
import { FileText, Play, RotateCcw } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import type { AssetRecord } from "@/data/asset-data"
import {
  addInspectionForAsset,
  latestInspectionFor,
  reinspect,
  useInspectionDetails,
} from "@/data/inspection-store"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { actionFor, inspectionFor, jobPath, useMyJobs } from "@/lib/work"

/**
 * Inspect the asset in front of you.
 *
 * An inspection is not an assigned task. The client was explicit on
 * 12-10-2026: the ELPREMAR walks up to a panel, onboards it or scans its
 * label, and inspects it - "yeh pura task usne apne marzi se kiya". So this
 * button always works. What changes is what it says, and that follows the
 * asset's own record:
 *
 *  - nothing taken yet, nothing booked → Start Inspection, raising one here;
 *  - one booked or under way → Start or Continue it;
 *  - submitted, reports not produced → Generate Report;
 *  - one already taken and finished → **Re-inspect**, which opens a fresh
 *    record carrying the last one's readings (see `reinspect`). Offering Start
 *    there was the bug: it raised a second empty inspection on an asset that
 *    already had one, and the engineer had to retype everything.
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
  const jobs = useMyJobs()
  const details = useInspectionDetails()

  /* Which record on the book is this asset's, by its own id where there is one */
  const tags = Object.fromEntries(Object.entries(details).map(([id, d]) => [id, d.assetTag]))
  const assigned = inspectionFor(jobs, asset, tags)
  const action = assigned ? actionFor(assigned) : undefined

  /* The last one taken on this asset, which is what a re-inspection carries over */
  const last = latestInspectionFor(details, asset.id)
  const taken = !assigned && !!last?.detail.execution?.completedAt

  const look = assigned
    ? action === "continue"
      ? { icon: Play, label: "Continue Inspection", fill: true }
      : action === "report"
        ? { icon: FileText, label: "Generate Report", fill: false }
        : { icon: Play, label: "Start Inspection", fill: true }
    : taken
      ? { icon: RotateCcw, label: "Re-inspect", fill: false }
      : { icon: Play, label: "Start Inspection", fill: true }

  const go = () => {
    onLeave?.()

    if (assigned) {
      if (action === "start") startJob(assigned, me.name)
      navigate(jobPath(assigned))
      return
    }

    if (taken && last) {
      /* A fresh record carrying what the last one found, so only what changed is retyped */
      const fresh = reinspect(last.id, me.name)
      if (fresh) {
        toast.success(`${fresh} opened`, { description: `Carried over from ${last.id}` })
        navigate(`/inspections/${fresh}`)
        return
      }
    }

    // Nothing on the book for it: raise the inspection here and open it
    navigate(`/inspections/${addInspectionForAsset(asset, me.name)}`)
  }

  return (
    <div className={className}>
      <Button
        size={size}
        variant={look.fill ? "default" : "outline"}
        className={cn("w-full font-semibold", look.fill && "shadow-md shadow-primary/25", size === "lg" && "h-14 text-base")}
        onClick={go}
      >
        <look.icon className={cn(look.fill && "fill-current")} /> {look.label}
      </Button>
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        {assigned ? (
          <>
            <span className="tabular-nums font-medium">{assigned.id}</span> · {assigned.activity}
          </>
        ) : taken && last ? (
          <>
            Last inspected <span className="tabular-nums font-medium">{last.detail.execution?.completedAt}</span>
          </>
        ) : (
          "Not on your book — this raises the inspection against this asset"
        )}
      </p>
    </div>
  )
}
