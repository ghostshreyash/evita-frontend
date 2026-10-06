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
 * (In Progress) or View (Completed or Approved). All three look the same, so a
 * table of tasks reads evenly. Starting changes the job's status in the shared
 * book before opening it.
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

  // One look for every action — the label and icon say what it does; the status badge carries the urgency
  const { icon: Icon, label } = actions[action]
  return (
    <Button variant="outline" className={cn("w-32 bg-card text-primary", className)} onClick={run}>
      <Icon /> {label}
    </Button>
  )
}

const actions = {
  start: { icon: Play, label: "Start" },
  continue: { icon: ArrowRight, label: "Continue" },
  view: { icon: Eye, label: "View" },
} as const

export function JobStatusBadge({ job, className }: { job: Pick<Job, "field">; className?: string }) {
  const look = fieldStatusLook[job.field]
  return (
    <Badge variant={look.badge} className={cn("h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {look.label}
    </Badge>
  )
}
