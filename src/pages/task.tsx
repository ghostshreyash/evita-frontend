import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CalendarDays,
  Check,
  CircleCheck,
  ClipboardList,
  Clock,
  Factory,
  Flag,
  Gauge,
  HardHat,
  MapPin,
  MessageSquareWarning,
  Play,
  Send,
  ShieldCheck,
  Tag,
  Timer,
  TriangleAlert,
  UserRound,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { Timeline } from "@/components/common/detail-view"
import { HealthRing } from "@/components/evita/field-kit"
import { InspectionForm } from "@/components/evita/inspection-form"
import { JobStatusBadge } from "@/components/evita/job-action"
import { MaintenanceForm } from "@/components/evita/maintenance-form"
import { InspectionRecord, MaintenanceRecord } from "@/components/evita/work-summary"
import { Button } from "@/components/ui/button"
import { instructions, inspectionTimeline } from "@/data/inspection-detail"
import { findInspection, useInspectionDetails } from "@/data/inspection-store"
import { maintenanceTimeline } from "@/data/maintenance-detail"
import { findMaintenance, useMaintenanceDetails } from "@/data/maintenance-store"
import { priorityTone, slotLabel } from "@/data/occ-tables"
import { categoryLook } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isOverdue, isToday, parseDay, useMyJobs, type FieldStatus, type Job } from "@/lib/work"

/* ---------- Progress tracker ---------- */

const trackers: Record<Job["kind"], { label: string; icon: LucideIcon }[]> = {
  inspection: [
    { label: "Assigned", icon: ClipboardList },
    { label: "Started", icon: Play },
    { label: "Recording", icon: Gauge },
    { label: "Completed", icon: BadgeCheck },
  ],
  maintenance: [
    { label: "Assigned", icon: ClipboardList },
    { label: "Started", icon: Play },
    { label: "Work Logged", icon: Timer },
    { label: "Submitted", icon: Send },
    { label: "Approved", icon: BadgeCheck },
  ],
}

/** How far along the job is: index of the step it is on */
function stepOf(kind: Job["kind"], field: FieldStatus) {
  if (field === "open" || field === "overdue") return 1
  if (field === "in_progress") return 2
  if (kind === "inspection") return 4
  return field === "approved" ? 5 : 4
}

function Tracker({ job }: { job: Job }) {
  const steps = trackers[job.kind]
  const current = stepOf(job.kind, job.field)
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.label} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done || active ? "bg-white/80" : "bg-white/25")} />
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full ring-2 transition-colors",
                  done ? "bg-healthy text-healthy-foreground ring-healthy" : active ? "bg-white text-primary ring-white" : "bg-white/10 text-white/60 ring-white/30"
                )}
              >
                {done ? <Check className="size-5" strokeWidth={3} /> : <s.icon className="size-5" />}
              </span>
              <span className={cn("h-0.5 flex-1", i === steps.length - 1 ? "opacity-0" : done ? "bg-white/80" : "bg-white/25")} />
            </div>
            <span className={cn("mt-1.5 px-1 text-xs leading-tight", done || active ? "font-semibold text-white" : "text-white/60")}>{s.label}</span>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Facts ---------- */

function Fact({ icon: Icon, tone, label, children }: { icon: LucideIcon; tone: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
        <div className="mt-0.5 text-sm font-medium">{children}</div>
      </div>
    </div>
  )
}

const prepare: { icon: LucideIcon; tone: string; title: string; body: string }[] = [
  { icon: ClipboardList, tone: "bg-info-soft text-info", title: "Permit to work", body: "Issued and valid for this asset and activity" },
  { icon: ShieldCheck, tone: "bg-healthy-soft text-healthy", title: "Isolate & lock out", body: "Area barricaded; LOTO applied where the activity needs it" },
  { icon: Zap, tone: "bg-attention-soft text-attention", title: "Test before touch", body: "Absence of voltage proved with a tested detector" },
  { icon: HardHat, tone: "bg-brand-gold-soft text-brand-gold-soft-foreground", title: "PPE on", body: "Arc-rated clothing, insulated gloves, helmet, safety shoes" },
  { icon: Gauge, tone: "bg-highlight-soft text-highlight", title: "Instruments ready", body: "Calibrated, charged and to hand" },
]

/**
 * One task, start to finish, as the ELPREMAR works it on site.
 *
 * Inspection: Open → Start → record readings, observations and evidence →
 * Submit (Completed). Maintenance: Open → Start → log the work against the
 * clock → Submit for Approval (Completed) → OCC approves (Approved) or sends it
 * back (Open again, to be restarted and resubmitted).
 */
export function TaskPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()
  const inspectionDetails = useInspectionDetails()
  const maintenanceDetails = useMaintenanceDetails()
  const job = jobs.find((j) => j.id === id)

  if (!job) {
    return (
      <div>
        <PageHeader title="Task not found" breadcrumbs={[{ label: "My Tasks", to: "/my-tasks" }, { label: id ?? "" }]} />
        <section className="rounded-lg bg-card p-10 text-center shadow-xs ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">{id} is not on your book of work. It may have been reassigned by OCC.</p>
          <Button className="mt-4" asChild><Link to="/my-tasks"><ArrowLeft /> Back to My Tasks</Link></Button>
        </section>
      </div>
    )
  }

  const inspection = job.kind === "inspection" ? inspectionDetails[job.id] : undefined
  const maintenance = job.kind === "maintenance" ? maintenanceDetails[job.id] : undefined
  const detail = inspection ?? maintenance
  const action = actionFor(job)
  const category = categoryFor(job.asset)
  const look = categoryLook(category)
  const sop = instructions[job.activity] ?? maintenance?.description ?? ""
  const overdue = isOverdue(job)
  const timeline =
    job.kind === "inspection"
      ? inspection && findInspection(job.id) && inspectionTimeline(findInspection(job.id)!, inspection)
      : maintenance && findMaintenance(job.id) && maintenanceTimeline(findMaintenance(job.id)!, maintenance)

  return (
    <div className="space-y-4">
      {/* ---------- Hero ---------- */}
      <section
        className={cn(
          "relative overflow-hidden rounded-xl text-white shadow-sm",
          job.kind === "inspection" ? "bg-gradient-to-br from-brand-navy via-[#123a7a] to-primary" : "bg-gradient-to-br from-brand-navy via-[#2a2470] to-highlight"
        )}
      >
        {/* Oversized category glyph as a watermark */}
        <look.icon aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 size-56 text-white/8" strokeWidth={1.2} />
        <div className="relative space-y-5 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md">
              <look.icon className={cn("size-9", look.tone)} strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <nav className="flex flex-wrap items-center gap-1 text-sm text-white/70">
                <Link to="/" className="hover:text-white">Home</Link>›
                <Link to="/my-tasks" className="hover:text-white">My Tasks</Link>›
                <span className="text-white">{job.id}</span>
              </nav>
              <h2 className="text-2xl leading-tight font-bold">{job.asset}</h2>
              <p className="text-white/80">{job.activity} · {job.plant}, {job.enterprise}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <JobStatusBadge job={job} className="text-sm ring-1 ring-white/30" />
                <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityTone[job.priority])}>{job.priority} priority</span>
                <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1", overdue ? "bg-critical text-critical-foreground ring-critical" : "bg-white/12 ring-white/25")}>
                  <CalendarClock className="size-3.5" />
                  {isToday(job.date) ? "Today" : format(parseDay(job.date), "EEE d MMM")}, {slotLabel(job.slot)}
                  {overdue ? " · Overdue" : ""}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={() => openPanel({ kind: "sop", activity: job.activity })}>
                <BookOpen /> SOP
              </Button>
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                onClick={() => openPanel({ kind: "issue", jobId: job.id, jobKind: job.kind, asset: job.asset, plant: job.plant, enterprise: job.enterprise })}
              >
                <MessageSquareWarning /> Report Issue
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/15 hover:text-white" onClick={() => navigate(-1)}>
                <ArrowLeft /> Back
              </Button>
            </div>
          </div>
          <div className="rounded-xl bg-white/8 px-2 py-3 ring-1 ring-white/15">
            <Tracker job={job} />
          </div>
        </div>
      </section>

      {/* ---------- What OCC assigned ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Fact icon={look.icon} tone="bg-muted text-foreground" label="Asset Category">
          <span className={look.tone}>{category}</span>
          {detail ? <span className="block text-xs font-normal text-muted-foreground">{detail.assetCriticality} criticality</span> : null}
        </Fact>
        <Fact icon={MapPin} tone="bg-info-soft text-info" label="Location / Area">{detail?.area || "—"}</Fact>
        <Fact icon={Factory} tone="bg-healthy-soft text-healthy" label="Plant">{job.plant}</Fact>
        <Fact icon={Flag} tone="bg-attention-soft text-attention" label="Priority">{job.priority}</Fact>
        <Fact icon={UserRound} tone="bg-highlight-soft text-highlight" label="Assigned By">{detail?.createdBy ?? "OCC"}</Fact>
        <Fact icon={Tag} tone="bg-info-soft text-info" label="Asset Tag"><span className="tabular-nums">{detail?.assetTag ?? "—"}</span></Fact>
        <Fact icon={CalendarDays} tone="bg-neutral-soft text-neutral-soft-foreground" label="Commissioned"><span className="tabular-nums">{detail?.commissionedOn ?? "—"}</span></Fact>
        <Fact icon={job.kind === "inspection" ? ClipboardList : Wrench} tone={job.kind === "inspection" ? "bg-info-soft text-info" : "bg-highlight-soft text-highlight"} label="Task">
          <span className="tabular-nums">{job.id}</span>
          {job.inspectionId ? <span className="block text-xs font-normal text-muted-foreground">from {job.inspectionId}</span> : null}
        </Fact>
      </div>

      {sop ? (
        <section className="flex items-start gap-3 rounded-lg bg-info-soft/60 p-4 ring-1 ring-info/15">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info text-info-foreground">
            <BookOpen className="size-5" />
          </span>
          <div className="text-sm">
            <div className="font-semibold">What to do</div>
            <p className="mt-0.5 text-foreground/80">{inspection ? sop : maintenance?.description}</p>
          </div>
        </section>
      ) : null}

      {/* ---------- OCC sent it back ---------- */}
      {maintenance?.review?.outcome === "rejected" ? (
        <section className="flex items-start gap-3 rounded-lg bg-critical-soft p-4 ring-1 ring-critical/20">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-critical text-critical-foreground">
            <TriangleAlert className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-critical-soft-foreground">Sent back for correction by {maintenance.review.by} · {maintenance.review.at}</div>
            <p className="mt-0.5">{maintenance.review.remarks}</p>
            {action === "start" ? <p className="mt-1 text-muted-foreground">Start the task to correct the record and resubmit.</p> : null}
          </div>
        </section>
      ) : null}

      {/* ---------- The work itself ---------- */}
      {action === "start" ? (
        <StartPanel job={job} onStart={() => startJob(job, me.name)} />
      ) : job.kind === "inspection" && inspection && job.field === "in_progress" ? (
        <InspectionForm key={job.id} job={job} detail={inspection} />
      ) : job.kind === "maintenance" && maintenance && job.field === "in_progress" ? (
        <MaintenanceForm key={job.id} job={job} detail={maintenance} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-4">
            <OutcomeBanner job={job} />
            {inspection ? <InspectionRecord detail={inspection} /> : maintenance ? <MaintenanceRecord detail={maintenance} /> : null}
          </div>
          <aside className="space-y-4">
            {inspection?.result ? (
              <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
                <h3 className="mb-3 text-base font-semibold">Health & Condition</h3>
                <HealthRing score={inspection.result.healthScore} />
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                  {inspection.result.recommendedActions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </section>
            ) : null}
            {timeline ? (
              <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
                <h3 className="mb-3 text-base font-semibold">Activity Timeline</h3>
                <Timeline steps={timeline} />
              </section>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  )
}

function StartPanel({ job, onStart }: { job: Job; onStart: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="rounded-lg bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex size-9 items-center justify-center rounded-lg bg-attention text-attention-foreground"><HardHat className="size-5" /></span>
          Plan & Prepare
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Check each point on site before you start the clock.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {prepare.map((p) => (
            <li key={p.title} className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5">
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", p.tone)}>
                <p.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{p.title}</span>
                <span className="block text-sm text-muted-foreground">{p.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col items-center justify-between gap-4 rounded-lg bg-gradient-to-b from-healthy-soft to-card p-5 text-center shadow-xs ring-1 ring-healthy/20">
        <div className="flex flex-col items-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-healthy text-healthy-foreground shadow-lg ring-8 ring-healthy/15">
            <Play className="size-9 fill-current" />
          </span>
          <h3 className="mt-4 text-lg font-semibold">Ready to start?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.kind === "maintenance"
              ? "Starting opens the time log with the exact start time and tells OCC the work is under way."
              : "Starting records the time and tells OCC the inspection is under way."}
          </p>
          <p className={cn("mt-3 flex items-center gap-2 text-sm", isOverdue(job) ? "font-semibold text-critical" : "text-muted-foreground")}>
            <Clock className="size-4" /> {isOverdue(job) ? "Overdue · was booked" : "Booked"} {format(parseDay(job.date), "d MMM")}, {slotLabel(job.slot)}
          </p>
        </div>
        <Button size="lg" className="h-14 w-full bg-healthy text-lg text-healthy-foreground hover:bg-healthy/90" onClick={onStart}>
          <Play className="fill-current" /> Start Task
        </Button>
      </section>
    </div>
  )
}

/** What state the finished work is in, in the words of the EVITA mockups */
function OutcomeBanner({ job }: { job: Job }) {
  const look =
    job.kind === "inspection"
      ? { tone: "bg-healthy-soft ring-healthy/20", disc: "bg-healthy", title: "Inspection Completed Successfully", body: "The inspection data has been saved and synced with the asset record." }
      : job.field === "approved"
        ? { tone: "bg-highlight-soft ring-highlight/20", disc: "bg-highlight", title: "Approved by OCC", body: "The asset's health report is updated from this work." }
        : job.status === "open"
          ? { tone: "bg-healthy-soft ring-healthy/20", disc: "bg-healthy", title: "Completed — submitted for approval", body: "OCC will review the evidence and approve the work or send it back with remarks." }
          : { tone: "bg-healthy-soft ring-healthy/20", disc: "bg-healthy", title: "Maintenance completed", body: "Closed out and recorded against the asset." }
  return (
    <section className={cn("flex items-center gap-4 rounded-lg p-4 ring-1", look.tone)}>
      <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm", look.disc)}>
        <CircleCheck className="size-7" />
      </span>
      <div>
        <div className="text-base font-semibold">{look.title}</div>
        <p className="text-sm text-muted-foreground">{look.body}</p>
      </div>
    </section>
  )
}
