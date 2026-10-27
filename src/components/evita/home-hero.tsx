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
  FileText,
  HardDrive,
  MapPin,
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { criticalityTone, slotLabel } from "@/data/occ-tables"
import { visitStatusLook } from "@/data/visits"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { useOpenVisits, type OpenVisit } from "@/lib/visits"
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
      title: "Inspections",
      detail: "Scan an asset, or onboard a new one",
      tint: "bg-healthy-soft text-healthy",
      run: () => openPanel({ kind: "begin-inspection" }),
    },
    {
      icon: ClipboardList,
      title: "Tasks",
      detail: "The cleaning assigned to you",
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
 * Work whose report has not come out leads, then whatever is already running,
 * and after them the soonest bookings that still need their hands. The pager
 * steps through them rather than listing them: on site there is only ever one
 * asset in front of you.
 *
 * Scheduled visits are in the same pager as the jobs, because to the engineer
 * they are the same question - what am I doing next. A visit names a place and
 * no asset, so its face is different; the card around it is not.
 */
export function NextTask() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()
  const visits = useOpenVisits()
  const [at, setAt] = useState(0)

  const open = useMemo(() => {
    const work: Next[] = [
      ...visits.map((v) => ({ kind: "visit" as const, at: v.visit.date, slot: v.visit.slot, rank: 1, visit: v })),
      ...jobs
        .filter((j) => actionFor(j) !== "view")
        .map((j) => ({ kind: "job" as const, at: j.date, slot: j.slot, rank: rank(j), job: j })),
    ]
    return work.sort((a, b) => a.rank - b.rank || parseDay(a.at).getTime() - parseDay(b.at).getTime() || a.slot - b.slot)
  }, [jobs, visits])

  if (!open.length) return <NothingOpen />

  const index = Math.min(at, open.length - 1)
  const next = open[index]
  const pager = (
    <span className="ml-auto flex items-center gap-1">
      <PagerButton label="Previous" disabled={index === 0} onClick={() => setAt(index - 1)} icon={ChevronLeft} />
      <span className="min-w-14 text-center text-xs font-semibold tabular-nums text-muted-foreground">
        {index + 1} of {open.length}
      </span>
      <PagerButton label="Next" disabled={index >= open.length - 1} onClick={() => setAt(index + 1)} icon={ChevronRight} />
    </span>
  )

  if (next.kind === "visit") return <VisitFace found={next.visit} pager={pager} />

  const job = next.job
  const kind = jobKindLook[job.kind]
  const action = actionFor(job)
  const running = action === "continue"
  const reportDue = action === "report"
  const inspection = job.kind === "inspection"

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
        <span className="text-base font-bold text-brand-navy dark:text-foreground">{inspection ? "Next Inspection" : "Next Task"}</span>
        <JobStatusBadge job={job} />
        {pager}
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
              {/* A cleaning job is a task on the book; an inspection is not */}
              <kind.icon className="size-3.5" /> {inspection ? kind.label : `${kind.label} Task`}
            </Chip>
            {/*
              * Only an inspection names its activity here. A clean's reads
              * "Preventive Cleaning", which is the chip beside it said twice.
              */}
            {inspection ? <Chip className="bg-info-soft text-info">{job.activity}</Chip> : null}
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
            <Line icon={UserRound}>Assigned by EMMS-E</Line>
          </dl>
        </div>
      </div>

      <div className="px-3 pb-3">
        <Button
          size="lg"
          className="h-14 w-full bg-gradient-to-r from-primary to-[#0f3fae] text-base font-bold shadow-lg shadow-primary/30 transition-transform motion-safe:hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => {
            // The visit is already done when only its report is owed
            if (!running && !reportDue) startJob(job, me.name)
            navigate(jobPath(job))
          }}
        >
          {reportDue ? (
            <>
              <FileText /> Generate Report
            </>
          ) : (
            <>
              <Play className="fill-current" /> {running ? `Continue ${kind.label}` : `Start ${kind.label}`}
            </>
          )}
        </Button>
      </div>
    </section>
  )
}

/** What the card is holding: a scheduled visit, or a job off the book */
type Next =
  | { kind: "visit"; at: string; slot: number; rank: number; visit: OpenVisit }
  | { kind: "job"; at: string; slot: number; rank: number; job: Job }

/**
 * A scheduled visit in the card.
 *
 * No asset photograph and no asset name, because a visit has neither: it is a
 * place and a day, and nothing is on the register for it until the engineer
 * gets there. What it can say is where, when, how many the enterprise expects,
 * and that the first thing to do is register them.
 */
function VisitFace({ found, pager }: { found: OpenVisit; pager: React.ReactNode }) {
  const navigate = useNavigate()
  const { visit, progress } = found
  const look = visitStatusLook[progress.status]

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20">
      <header className="flex flex-wrap items-center gap-2 border-b border-primary/10 bg-gradient-to-r from-info-soft via-info-soft/60 to-transparent px-3 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-info-soft text-primary">
          <MapPin className="size-4.5" />
        </span>
        <span className="text-base font-bold text-brand-navy dark:text-foreground">Scheduled Visit</span>
        <Badge variant={look.badge} className="h-auto rounded-full px-2 py-0.5 text-xs">
          {look.label}
        </Badge>
        {pager}
      </header>

      <div className="flex flex-1 flex-col p-3">
        <h4 className="truncate text-xl leading-tight font-bold text-brand-navy dark:text-foreground">{visit.area}</h4>
        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-primary">{visit.id}</p>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip className="bg-info-soft text-primary">
            <MapPin className="size-3.5" /> Visit
          </Chip>
          <Chip className="bg-muted text-muted-foreground">
            <HardDrive className="size-3.5" /> {visit.expected} assets expected
          </Chip>
        </div>

        <dl className="mt-3 space-y-2 text-sm">
          <Line icon={Factory}>
            {visit.plant}, {visit.enterprise}
          </Line>
          <Line icon={CalendarDays}>
            {isToday(visit.date) ? "Today" : format(parseDay(visit.date), "d MMM yyyy")}, {slotLabel(visit.slot)}
          </Line>
          <Line icon={UserRound}>Assigned by EMMS-E</Line>
        </dl>

        <p className="mt-3 rounded-xl bg-info-soft/60 px-3 py-2 text-sm text-info-soft-foreground">
          {progress.onboarded
            ? `${progress.onboarded} registered so far, ${progress.done} inspected. Carry on down the area.`
            : "No asset is registered here yet — onboard each one as you come to it, then inspect it."}
        </p>

        <div className="mt-auto pt-3">
          <Button
            size="lg"
            className="h-14 w-full bg-gradient-to-r from-primary to-[#0f3fae] text-base font-bold shadow-lg shadow-primary/30 transition-transform motion-safe:hover:-translate-y-0.5 active:translate-y-0"
            onClick={() => navigate(`/visits/${visit.id}`)}
          >
            <Plus /> {progress.onboarded ? "Continue Visit" : "Start Onboarding"}
          </Button>
        </div>
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

/**
 * Where a job sits in the queue: the report that has not been produced first -
 * the visit is done and only the paperwork is missing - then the one under way,
 * then everything still to start.
 */
const rank = (job: Job) => (actionFor(job) === "report" ? 0 : actionFor(job) === "continue" ? 1 : 2)

/** The work after the one in hand, as rows */
export function UpcomingTasks() {
  const navigate = useNavigate()
  const jobs = useMyJobs()

  const upcoming = useMemo(
    () => [...jobs.filter((j) => actionFor(j) !== "view")].sort((a, b) => rank(a) - rank(b) || when(a) - when(b)).slice(1, 4),
    [jobs]
  )

  return (
    <section className="rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3">
        <h3 className="flex items-center gap-1.5 text-base font-semibold text-brand-navy dark:text-foreground">
          <CalendarDays className="size-5 text-primary" /> Upcoming ({upcoming.length})
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
