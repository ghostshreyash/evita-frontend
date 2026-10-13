import { Link } from "react-router"
import { CalendarDays, ChevronRight, MapPin } from "lucide-react"
import { cn } from "cn"
import { format } from "date-fns"

import { AssetPhoto } from "@/components/common/asset-photo"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { slotLabel } from "@/data/occ-tables"
import { categoryFor, isOverdue, isToday, jobKindLook, jobPath, parseDay, type FieldStatus, type Job } from "@/lib/work"

/** The bar down the left of a row, and the tint behind an overdue one */
const statusEdge: Record<FieldStatus, string> = {
  open: "bg-info",
  overdue: "bg-critical",
  in_progress: "bg-attention",
  completed: "bg-healthy",
  approved: "bg-highlight",
}

/**
 * One piece of work, as a row in a list rather than a card of its own.
 *
 * Columns rather than a block: the engineer scans a column at a time down the
 * list — which task, which asset, when, how it stands — and cards made that a
 * zig-zag. Each column drops out as the screen narrows, leaving the three that
 * always matter: what it is, when it is due, and the one thing to do with it.
 * What drops out is folded back into the title block, so a narrow screen loses
 * the columns but not the facts.
 *
 * The row is opened by a link stretched over it, which has no outline of its
 * own; the ring is on the row instead, so keyboard focus is still visible.
 *
 * The home screen's list only. My Tasks and Inspections stay as cards: there
 * a row is read on its own, here it is read against the rows above and below.
 */
export function WorkRow({ job }: { job: Job }) {
  const category = categoryFor(job.asset)
  const kind = jobKindLook[job.kind]
  const overdue = isOverdue(job)

  return (
    <li
      className={cn(
        "relative flex min-h-16 cursor-pointer items-stretch transition-colors hover:bg-muted/40",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-inset",
        overdue && "bg-critical-soft/30"
      )}
    >
      <span aria-hidden className={cn("w-1 shrink-0", statusEdge[job.field])} />

      <div className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pr-2 pl-3">
        {/* What it is */}
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/50 ring-1 ring-foreground/10 shadow-2xs">
          <AssetPhoto label={`${job.asset} ${category} ${job.activity}`} />
        </span>

        <span className="w-24 shrink-0 text-sm font-bold tabular-nums max-lg:hidden">{job.id}</span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-brand-navy dark:text-foreground">{job.asset}</p>
          <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">
              {job.plant}, {job.enterprise}
            </span>
          </p>
          {/* The columns that drop out below lg still have to be readable */}
          <p className="mt-0.5 truncate text-xs lg:hidden">
            <span className="font-bold tabular-nums">{job.id}</span> · {job.activity}
          </p>
        </div>

        <span className={cn("flex w-32 shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold max-md:hidden", kind.tint)}>
          <kind.icon className="size-3.5 shrink-0" /> {kind.label}
        </span>

        {/* When */}
        <span className="flex w-32 shrink-0 items-start gap-1.5 max-sm:hidden">
          <CalendarDays className={cn("mt-0.5 size-4 shrink-0", overdue ? "text-critical" : "text-muted-foreground")} />
          <span className="min-w-0">
            <span className={cn("block truncate text-sm font-semibold", overdue && "text-critical")}>
              {isToday(job.date) ? "Today" : format(parseDay(job.date), "d MMM yyyy")}
            </span>
            <span className={cn("block truncate text-xs tabular-nums", overdue ? "text-critical" : "text-muted-foreground")}>
              {slotLabel(job.slot)}
            </span>
          </span>
        </span>

        {/* How it stands, and the one thing to do with it */}
        <JobStatusBadge job={job} className="w-28 shrink-0 justify-center max-md:hidden" />
        <JobActionButton job={job} className="relative z-10 ml-1 h-11 w-28 shrink-0 max-sm:w-24" />
        <ChevronRight className="size-5 shrink-0 text-muted-foreground max-sm:hidden" />
      </div>

      {/* Stretched over the row, so the row opens and the action still fires */}
      <Link
        to={jobPath(job)}
        aria-label={`Open ${job.id}, ${job.asset}`}
        className="absolute inset-0 outline-none"
      />
    </li>
  )
}
