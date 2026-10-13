import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Factory,
  ListChecks,
  Play,
  Plus,
  QrCode,
  UserRound,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { format } from "date-fns"

import { AssetPhoto } from "@/components/common/asset-photo"
import { JobStatusBadge } from "@/components/evita/job-action"
import { Button } from "@/components/ui/button"
import { criticalityTone, slotLabel } from "@/data/occ-tables"
import { useInspectionDetails } from "@/data/inspection-store"
import { hygieneChecks } from "@/data/test-template"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isToday, jobKindLook, jobPath, parseDay, useMyJobs, when, type Job } from "@/lib/work"

/**
 * The ways into the app, across the top of the home screen.
 *
 * Four, not six. Report an Issue belongs on the task screen where a problem is
 * actually found, and on Contact & Help; and there is nothing to press for
 * syncing - records go up on their own and the top bar already says whether
 * they have.
 *
 * One card shape: a tinted glyph, what it does, and what that means. No arrow
 * in the corner - the whole card is the button, and a chevron only repeated
 * what the cursor already says.
 */
export function QuickActions() {
  const navigate = useNavigate()

  const actions: Action[] = [
    {
      icon: QrCode,
      title: "Scan Asset QR",
      detail: "Open an asset by its label",
      tint: "bg-info-soft text-info",
      run: () => openPanel({ kind: "scan" }),
    },
    {
      icon: Plus,
      title: "Onboard Asset",
      detail: "Register one that is not on the book",
      tint: "bg-highlight-soft text-highlight",
      run: () => navigate("/assets/onboarding"),
    },
    {
      icon: ClipboardCheck,
      title: "Start Inspection",
      detail: "Scan an asset, or onboard a new one",
      tint: "bg-healthy-soft text-healthy",
      run: () => openPanel({ kind: "begin-inspection" }),
    },
    {
      icon: ClipboardList,
      title: "My Tasks",
      detail: "The maintenance assigned to you",
      tint: "bg-attention-soft text-attention",
      run: () => navigate("/my-tasks"),
    },
  ]

  return (
    <section>
      <h3 className="mb-2 text-lg font-semibold text-brand-navy dark:text-foreground">Quick Actions</h3>

      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <li key={action.title}>
            <button
              type="button"
              onClick={action.run}
              className="group/qa flex min-h-24 w-full items-center gap-3 rounded-2xl bg-card p-3 text-left ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary motion-safe:hover:-translate-y-0.5 active:translate-y-0"
            >
              <span
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-2xl transition-transform motion-safe:group-hover/qa:scale-105",
                  action.tint
                )}
              >
                <action.icon className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base leading-tight font-bold text-brand-navy dark:text-foreground">
                  {action.title}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{action.detail}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Action = { icon: LucideIcon; title: string; detail: string; tint: string; run: () => void }

/**
 * The work in front of the engineer, one at a time.
 *
 * Whatever is already running leads, and after it the soonest bookings that
 * still need their hands. The pager steps through them rather than listing
 * them: on site there is only ever one asset in front of you.
 */
export function NextTask() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()
  const details = useInspectionDetails()
  const [at, setAt] = useState(0)

  const open = useMemo(() => {
    const waiting = jobs.filter((j) => actionFor(j) !== "view")
    const running = (j: Job) => (actionFor(j) === "continue" ? 0 : 1)
    return [...waiting].sort((a, b) => running(a) - running(b) || when(a) - when(b))
  }, [jobs])

  if (!open.length) return <NothingOpen />

  const index = Math.min(at, open.length - 1)
  const job = open[index]
  const kind = jobKindLook[job.kind]
  const running = actionFor(job) === "continue"
  const inspection = job.kind === "inspection"
  const tag = details[job.id]?.assetTag

  return (
    /*
     * The card the whole screen is for, and it is built to read that way: a
     * tinted head, a ring in the brand colour, a lifted shadow and the one
     * button at full width. Everything else on the page is quieter than this.
     */
    <section className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20">
      <header className="flex flex-wrap items-center gap-2 border-b border-primary/10 bg-gradient-to-r from-info-soft via-info-soft/60 to-transparent px-3 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-attention-soft text-attention">
          <Zap className="size-4.5" />
        </span>
        <span className="text-base font-bold text-brand-navy dark:text-foreground">Next Task</span>
        <JobStatusBadge job={job} />
        <span className="ml-auto flex items-center gap-1">
          <PagerButton label="Previous task" disabled={index === 0} onClick={() => setAt(index - 1)} icon={ChevronLeft} />
          <span className="min-w-14 text-center text-xs font-semibold tabular-nums text-muted-foreground">
            {index + 1} of {open.length}
          </span>
          <PagerButton
            label="Next task"
            disabled={index >= open.length - 1}
            onClick={() => setAt(index + 1)}
            icon={ChevronRight}
          />
        </span>
      </header>

      <div className="flex flex-wrap gap-3.5 p-3">
        <div className="h-44 w-48 shrink-0 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-foreground/10 max-sm:h-40 max-sm:w-full">
          <AssetPhoto label={`${job.asset} ${categoryFor(job.asset)} ${job.activity}`} caption={job.asset} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xl leading-tight font-bold text-brand-navy dark:text-foreground">
            {inspection ? job.area || job.plant : job.asset}
          </h4>
          <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-primary">{job.id}</p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Chip className={kind.tint}>
              <kind.icon className="size-3.5" /> {kind.label}
            </Chip>
            <Chip className="bg-info-soft text-info">{job.activity}</Chip>
            <Chip className={criticalityTone[job.priority === "Low" ? "Low" : job.priority === "Medium" ? "Medium" : "High"]}>
              {job.priority}
            </Chip>
          </div>

          <dl className="mt-3 space-y-2 text-sm">
            <Line icon={Factory}>
              {job.plant}, {job.enterprise}
            </Line>
            <Line icon={CalendarDays}>
              {isToday(job.date) ? "Today" : format(parseDay(job.date), "d MMM yyyy")}, {slotLabel(job.slot)}
            </Line>
            {inspection ? <Line icon={ListChecks}>{hygieneChecks.length} hygiene points</Line> : null}
            {tag ? <Line icon={QrCode}>{tag}</Line> : null}
            <Line icon={UserRound}>Assigned by EMMS-E</Line>
          </dl>
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button
          size="lg"
          className="h-14 w-full bg-gradient-to-r from-primary to-[#0f3fae] text-base font-bold shadow-lg shadow-primary/30 transition-transform motion-safe:hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => {
            if (!running) startJob(job, me.name)
            navigate(jobPath(job))
          }}
        >
          <Play className="fill-current" /> {running ? `Continue ${kind.label}` : `Start ${kind.label}`}
        </Button>
      </div>
    </section>
  )
}

/** Nothing on the book: an inspection can still be started at any asset */
function NothingOpen() {
  return (
    <section className="flex flex-col items-start gap-2 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
      <span className="flex size-11 items-center justify-center rounded-xl bg-healthy-soft text-healthy">
        <ClipboardCheck className="size-6" />
      </span>
      <h4 className="text-base font-bold text-brand-navy dark:text-foreground">Nothing open</h4>
      <p className="text-sm text-muted-foreground">
        No task is waiting on you. An inspection can still be started at any asset — scan its label, or onboard it first.
      </p>
      <Button
        size="lg"
        className="mt-3 h-14 w-full text-base font-semibold"
        onClick={() => openPanel({ kind: "begin-inspection" })}
      >
        <Play className="fill-current" /> Start Inspection
      </Button>
    </section>
  )
}

/** The work after the one in hand, as rows */
export function UpcomingTasks() {
  const navigate = useNavigate()
  const jobs = useMyJobs()

  const upcoming = useMemo(
    () => [...jobs.filter((j) => actionFor(j) !== "view")].sort((a, b) => when(a) - when(b)).slice(1, 4),
    [jobs]
  )

  return (
    <section className="rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-brand-navy dark:text-foreground">
          <CalendarDays className="size-5 text-primary" /> Upcoming Tasks ({upcoming.length})
        </h3>
        <button
          type="button"
          onClick={() => navigate("/my-tasks")}
          className="flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          View All <ArrowRight className="size-4" />
        </button>
      </div>

      {upcoming.length ? (
        <ul className="divide-y">
          {upcoming.map((job) => {
            const kind = jobKindLook[job.kind]
            return (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => navigate(jobPath(job))}
                  className="flex min-h-16 w-full items-center gap-3 py-2 text-left hover:bg-muted/40"
                >
                  <span className="size-12 shrink-0 overflow-hidden rounded-xl bg-muted/40 ring-1 ring-foreground/10 shadow-2xs">
                    <AssetPhoto label={`${job.asset} ${categoryFor(job.asset)} ${job.activity}`} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-brand-navy dark:text-foreground">
                      {job.kind === "inspection" ? job.area || job.plant : job.asset}
                    </span>
                    <span className="block truncate text-xs tabular-nums text-muted-foreground">{job.id}</span>
                    <span
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold",
                        kind.tint
                      )}
                    >
                      <kind.icon className="size-3" /> {kind.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-right max-sm:hidden">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {isToday(job.date) ? "Today" : format(parseDay(job.date), "d MMM yyyy")}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                      <Clock className="size-3.5" /> {slotLabel(job.slot)}
                    </span>
                  </span>
                  <JobStatusBadge job={job} className="shrink-0 max-md:hidden" />
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">Nothing else booked.</p>
      )}
    </section>
  )
}

/* ---------- Pieces ---------- */

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  )
}

function Line({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-primary/70" />
      <span className="truncate font-medium text-foreground/90">{children}</span>
    </div>
  )
}

function PagerButton({
  label,
  disabled,
  onClick,
  icon: Icon,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  icon: LucideIcon
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-lg ring-1 ring-foreground/10 transition-colors hover:bg-muted disabled:opacity-35"
    >
      <Icon className="size-4" />
    </button>
  )
}
