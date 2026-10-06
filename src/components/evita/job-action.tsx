import { useNavigate } from "react-router"
import { ArrowRight, Eye, Play } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { startJob } from "@/lib/start-job"
import { useCurrentElpremar } from "@/lib/me"
import { actionFor, fieldStatusLook, type Job } from "@/lib/work"

/**
 * The one button a job needs right now: Start (Open or Overdue), Continue
 * (In Progress) or View (Completed or Approved). Starting changes the job's
 * status in the shared book before opening it.
 */
export function JobActionButton({ job, className }: { job: Job; className?: string }) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const action = actionFor(job)

  // Rows are tappable too, so the button must not also trigger the row
  const run = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (action === "start") startJob(job, me.name)
    navigate(`/my-tasks/${job.id}`)
  }

  if (action === "start")
    return (
      <Button variant="outline" className={cn("w-32 bg-card", job.field === "overdue" && "border-critical/40 text-critical", className)} onClick={run}>
        <Play /> Start
      </Button>
    )
  if (action === "continue")
    return (
      <Button className={cn("w-32", className)} onClick={run}>
        Continue <ArrowRight />
      </Button>
    )
  return (
    <Button variant="ghost" className={cn("w-32 text-primary", className)} onClick={run}>
      <Eye /> View
    </Button>
  )
}

export function JobStatusBadge({ job, className }: { job: Pick<Job, "field">; className?: string }) {
  const look = fieldStatusLook[job.field]
  return (
    <Badge variant={look.badge} className={cn("h-auto rounded px-2 py-1 text-xs whitespace-nowrap", className)}>
      {look.label}
    </Badge>
  )
}
