import { useMemo } from "react"
import { useNavigate } from "react-router"
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  MapPin,
  Play,
  Plus,
  QrCode,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"
import { format } from "date-fns"

import { CategoryIcon } from "@/components/common/category-icon"
import { JobStatusBadge } from "@/components/evita/job-action"
import { Button } from "@/components/ui/button"
import { slotLabel } from "@/data/occ-tables"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isToday, jobKindLook, jobPath, parseDay, useMyJobs, when, type Job } from "@/lib/work"

/**
 * The head of the home screen: the piece of work the engineer should be on,
 * and the four ways into the app either side of it.
 *
 * Laid out as the client asked at the review — two cards left, the task in the
 * middle, two cards right — and the three columns share one height so the row
 * reads as a row. On a tablet in portrait the task goes first and the four fall
 * under it in pairs.
 */
export function HomeHero() {
  const navigate = useNavigate()
  const jobs = useMyJobs()

  /**
   * The job to put in front of the engineer: anything already running, and
   * failing that the soonest booking that still needs their hands.
   */
  const latest = useMemo(() => {
    const open = jobs.filter((j) => actionFor(j) !== "view")
    return open.find((j) => actionFor(j) === "continue") ?? [...open].sort((a, b) => when(a) - when(b))[0]
  }, [jobs])

  const actions: Action[] = [
    {
      icon: QrCode,
      title: "Scan Asset QR",
      detail: "Open an asset by its label",
      tone: "bg-info-soft text-info",
      run: () => openPanel({ kind: "scan" }),
    },
    {
      icon: Plus,
      title: "Asset Onboarding",
      detail: "Register an asset that is not on the book",
      tone: "bg-highlight-soft text-highlight",
      run: () => navigate("/assets/onboarding"),
    },
    {
      icon: ClipboardCheck,
      title: "Start Inspection",
      detail: "Scan an asset, or onboard a new one",
      tone: "bg-healthy-soft text-healthy",
      run: () => openPanel({ kind: "begin-inspection" }),
    },
    {
      icon: ClipboardList,
      title: "My Tasks",
      detail: "The maintenance assigned to you",
      tone: "bg-attention-soft text-attention",
      run: () => navigate("/my-tasks"),
    },
  ]

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Everything you need for field work</p>
      </div>

      {/*
        * Three columns of one height. The stacked pairs set it and the asset
        * card fills it, so nothing in the row is left hanging - which is what
        * a tall photograph in the middle did.
        */}
      <div className="grid items-stretch gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)_minmax(0,1fr)]">
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {actions.slice(0, 2).map((action) => (
            <ActionCard key={action.title} action={action} />
          ))}
        </ul>

        {latest ? <TaskSpotlight job={latest} className="max-lg:order-first" /> : <NothingOpen className="max-lg:order-first" />}

        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2">
          {actions.slice(2).map((action) => (
            <ActionCard key={action.title} action={action} />
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * The work in the middle: the one piece the engineer should be on.
 *
 * "Latest" on a book of work is whatever is open: anything already started
 * comes first, and failing that the soonest booking that still needs their
 * hands. A task further down the week is not the one to put in front of them.
 *
 * The button follows the job rather than being chosen here, so an inspection
 * reads Start Inspection and a maintenance Start Maintenance, and either reads
 * Continue once it is running.
 *
 * No photograph. A seeded asset has none, so it drew a placeholder glyph the
 * height of the whole card and left the row lopsided for no information; the
 * category tile says the same thing in a corner.
 */
function TaskSpotlight({ job, className }: { job: Job; className?: string }) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const kind = jobKindLook[job.kind]
  const running = actionFor(job) === "continue"
  const inspection = job.kind === "inspection"

  return (
    <article className={cn("flex h-full flex-col gap-2 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-primary/25", className)}>
      <div className="flex items-start gap-2.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-info-soft text-primary">
          {inspection ? (
            <kind.icon className="size-6" />
          ) : (
            <CategoryIcon category={categoryFor(job.asset)} className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {running ? "Under way" : "Next up"}
          </p>
          <h4 className="truncate text-base leading-tight font-bold text-brand-navy dark:text-foreground">
            {inspection ? job.area || job.plant : job.asset}
          </h4>
          <p className="truncate text-sm font-medium tabular-nums text-primary">{job.id}</p>
        </div>
        <JobStatusBadge job={job} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className={cn("flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold", kind.tint)}>
          <kind.icon className="size-3.5 shrink-0" /> {kind.label}
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{job.plant}</span>
        </span>
      </div>

      <p className="truncate text-sm">{job.activity}</p>

      <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          {isToday(job.date) ? "Today" : format(parseDay(job.date), "d MMM yyyy")}
        </span>
        <span className="tabular-nums">{slotLabel(job.slot)}</span>
      </p>

      <div className="mt-auto pt-1">
        <Button
          size="lg"
          className="h-14 w-full text-base font-semibold shadow-md shadow-primary/25"
          onClick={() => {
            if (!running) startJob(job, me.name)
            navigate(jobPath(job))
          }}
        >
          <Play className="fill-current" />
          {running ? `Continue ${kind.label}` : `Start ${kind.label}`}
        </Button>
      </div>
    </article>
  )
}

/** Nothing on the book: the engineer can still start an inspection at any asset */
function NothingOpen({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "flex h-full flex-col items-start gap-2 rounded-2xl bg-card p-3 shadow-xs ring-1 ring-foreground/10",
        className
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-healthy-soft text-healthy">
        <ClipboardCheck className="size-6" />
      </span>
      <h4 className="text-base leading-tight font-bold text-brand-navy dark:text-foreground">Nothing open</h4>
      <p className="text-xs leading-snug text-muted-foreground">
        No task is waiting on you. An inspection can still be started at any asset — scan its label, or onboard
        it first.
      </p>
      <div className="mt-auto w-full pt-1">
        <Button
          size="lg"
          className="h-14 w-full text-base font-semibold shadow-md shadow-primary/25"
          onClick={() => openPanel({ kind: "begin-inspection" })}
        >
          <Play className="fill-current" /> Start Inspection
        </Button>
      </div>
    </article>
  )
}

function ActionCard({ action }: { action: Action }) {
  return (
    <li>
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
        <span className="text-xs leading-snug text-muted-foreground">{action.detail}</span>
      </button>
    </li>
  )
}

type Action = {
  icon: LucideIcon
  title: string
  detail: string
  tone: string
  run: () => void
}
