import { useNavigate } from "react-router"
import { ArrowRight, Eye, Play, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { startInspection } from "@/data/inspection-store"
import { reworkMaintenance } from "@/data/maintenance-store"
import { useCurrentElpremar } from "@/lib/me"
import { actionFor, statusLook, type Job } from "@/lib/work"

/**
 * The one button a job needs right now: Start an approved inspection, Continue
 * work in progress, Rework a job OCC sent back, or View anything else. Starting
 * and reworking change the job's status in the shared book before opening it.
 */
export function JobActionButton({ job, className }: { job: Job; className?: string }) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const action = actionFor(job)
  const open = () => navigate(`/my-tasks/${job.id}`)

  // Rows are tappable too, so the button must not also trigger the row
  const run = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (action === "start") {
      startInspection(job.id, me.name)
      toast.success(`${job.id} started`, { description: `${job.activity} · ${job.asset}` })
    }
    if (action === "rework") {
      reworkMaintenance(job.id)
      toast.info(`${job.id} back in progress`, { description: "Correct what the reviewer asked for, then resubmit." })
    }
    open()
  }

  if (action === "start")
    return (
      <Button variant="outline" className={cn("w-32 bg-card", className)} onClick={run}>
        <Play /> Start
      </Button>
    )
  if (action === "continue")
    return (
      <Button className={cn("w-32", className)} onClick={run}>
        Continue <ArrowRight />
      </Button>
    )
  if (action === "rework")
    return (
      <Button variant="outline" className={cn("w-32 border-critical/40 bg-card text-critical", className)} onClick={run}>
        <RotateCcw /> Rework
      </Button>
    )
  return (
    <Button variant="ghost" className={cn("w-32 text-primary", className)} onClick={run}>
      <Eye /> View
    </Button>
  )
}

export function JobStatusBadge({ job, className }: { job: Pick<Job, "kind" | "status">; className?: string }) {
  const look = statusLook(job)
  return (
    <Badge variant={look.badge} className={cn("h-auto rounded px-2 py-1 text-xs whitespace-nowrap", className)}>
      {look.label}
    </Badge>
  )
}
