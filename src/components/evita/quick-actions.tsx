import { useNavigate } from "react-router"
import {
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CloudCheck,
  CloudUpload,
  FileText,
  QrCode,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { useInspectionDetails } from "@/data/inspection-store"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { actionFor, useMyJobs, type Job } from "@/lib/work"

/**
 * Everything the field needs, one tap from the home screen.
 *
 * At the top rather than down a column: on a tablet held at the panel door
 * these are what the engineer reaches for first, and the client asked for the
 * inspection to be startable from the front screen — "front screen pe ho
 * Start Inspection… usko layman form mein sabse easy rahega" (12-10-2026).
 *
 * Every card does something real. Where there is nothing to act on — no
 * inspection assigned, nothing waiting to sync — the card says so rather than
 * leading somewhere empty.
 */
export function QuickActions() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()
  const details = useInspectionDetails()

  /** The next inspection to start, and the one already under way */
  const next = jobs.find((j) => j.kind === "inspection" && actionFor(j) === "start")
  const running = jobs.find((j) => j.kind === "inspection" && actionFor(j) === "continue")

  /** Records held on the tablet that the server has not got yet */
  const waiting = Object.values(details).filter((d) => d.sync && d.sync.state !== "synced").length

  const open = (job: Job, start: boolean) => {
    if (start) startJob(job, me.name)
    navigate(`/my-tasks/${job.id}`)
  }

  const actions: Action[] = [
    {
      icon: QrCode,
      title: "Scan Asset QR",
      detail: "Quick access to asset details",
      tone: "bg-info-soft text-info",
      run: () => openPanel({ kind: "scan" }),
    },
    {
      icon: ClipboardCheck,
      title: "Start Inspection",
      detail: next ? `${next.id} · ${next.asset}` : "Nothing waiting to be started",
      tone: "bg-healthy-soft text-healthy",
      run: next ? () => open(next, true) : () => navigate("/inspections"),
      quiet: !next,
    },
    {
      icon: FileText,
      title: "Log Test Results",
      detail: running ? `${running.id} · under way` : "No inspection is open",
      tone: "bg-attention-soft text-attention",
      run: running ? () => open(running, false) : () => navigate("/inspections"),
      quiet: !running,
    },
    {
      icon: TriangleAlert,
      title: "Report Issue",
      detail: "Report any equipment problem",
      tone: "bg-critical-soft text-critical",
      run: () => openPanel({ kind: "issue" }),
    },
    {
      icon: ClipboardList,
      title: "View Tasks",
      detail: "See all your assigned tasks",
      tone: "bg-highlight-soft text-highlight",
      run: () => navigate("/my-tasks"),
    },
    {
      icon: waiting ? CloudUpload : CloudCheck,
      title: "Offline & Sync",
      detail: waiting ? `${waiting} record${waiting === 1 ? "" : "s"} held on this tablet` : "Everything has reached the server",
      tone: waiting ? "bg-attention-soft text-attention" : "bg-healthy-soft text-healthy",
      // No sync button to press: records go up on their own. The answers explain it.
      run: () => navigate("/contact"),
      quiet: !waiting,
    },
  ]

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Everything you need for field work</p>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {actions.map((action) => (
          <li key={action.title}>
            <button
              type="button"
              onClick={action.run}
              className="flex h-full min-h-28 w-full flex-col gap-2 rounded-2xl bg-card p-3 text-left shadow-xs ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="flex items-start gap-2.5">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", action.tone)}>
                  <action.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-base leading-tight font-bold text-brand-navy dark:text-foreground">
                  {action.title}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </span>
              <span className={cn("text-xs leading-snug", action.quiet ? "text-muted-foreground/70" : "text-muted-foreground")}>
                {action.detail}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Action = {
  icon: LucideIcon
  title: string
  detail: string
  tone: string
  run: () => void
  /** Nothing to act on; the card still leads somewhere sensible */
  quiet?: boolean
}
