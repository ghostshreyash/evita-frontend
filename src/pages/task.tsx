import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  CircleCheck,
  ClipboardList,
  Gauge,
  HardHat,
  History,
  Home,
  Lock,
  Play,
  QrCode,
  Rocket,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { Timeline } from "@/components/common/detail-view"
import { CategoryIcon } from "@/components/common/category-icon"
import { HealthRing, TaskPanel } from "@/components/evita/field-kit"
import { InspectionForm, ScoreBreakdown } from "@/components/evita/inspection-form"
import { JobStatusBadge } from "@/components/evita/job-action"
import { MaintenanceForm } from "@/components/evita/maintenance-form"
import { InspectionRecord, MaintenanceRecord } from "@/components/evita/work-summary"
import { Button } from "@/components/ui/button"
import { inspectionTimeline } from "@/data/inspection-detail"
import { findInspection, useInspectionDetails } from "@/data/inspection-store"
import { maintenanceTimeline } from "@/data/maintenance-detail"
import { findMaintenance, useMaintenanceDetails } from "@/data/maintenance-store"
import { criticalityTone, priorityTone, slotLabel } from "@/data/occ-tables"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isOverdue, isToday, jobKindLook, parseDay, useMyJobs, type Job } from "@/lib/work"

const prepare: { icon: LucideIcon; tone: string; title: string; detail: string }[] = [
  { icon: ClipboardList, tone: "text-info", title: "Permit to work", detail: "issued and valid for this asset and activity" },
  { icon: Lock, tone: "text-attention", title: "Isolate & lock out", detail: "where applicable; boundaries marked" },
  { icon: Zap, tone: "text-critical", title: "Test before touch", detail: "absence of voltage proved with a tested detector" },
  { icon: ShieldCheck, tone: "text-primary", title: "PPE on", detail: "arc-rated clothing, insulated gloves, helmet, safety shoes" },
  { icon: Gauge, tone: "text-healthy", title: "Instruments ready", detail: "calibrated, charged and to hand" },
]

/** A label above its value, in the Task Details grid */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-base font-medium break-words">{children}</div>
    </div>
  )
}

/** One titled run of fields inside Task Details: the task, the place, the asset */
function Group({ title, last, children }: { title: string; last?: boolean; children: React.ReactNode }) {
  return (
    <section className={cn(!last && "mb-4 border-b pb-4")}>
      <h4 className="mb-2.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</h4>
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">{children}</div>
    </section>
  )
}

/**
 * One task, start to finish, as the ELPREMAR works it on site — laid out after
 * the EVITA tablet design: a header card, an identity strip, the progress
 * tracker, then the task's panels. Data and navigation are unchanged.
 *
 * Inspection: Open → Start → record images and evidence → Submit (Completed).
 * Maintenance: Open → Start → log the work against the clock → Submit for
 * Approval (Completed) → OCC approves (Approved) or sends it back (Open again).
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
        <TriangleAlert className="size-8 text-attention" />
        <p className="max-w-md text-sm text-muted-foreground">
          <span className="font-semibold">{id}</span> is not on your book of work. It may have been reassigned by EMMS-E.
        </p>
        <Button asChild><Link to="/my-tasks">Back to My Tasks</Link></Button>
      </div>
    )
  }

  const inspection = job.kind === "inspection" ? inspectionDetails[job.id] : undefined
  const maintenance = job.kind === "maintenance" ? maintenanceDetails[job.id] : undefined
  const detail = inspection ?? maintenance
  const action = actionFor(job)
  const category = categoryFor(job.asset)
  const look = categoryLook(category)
  const kind = jobKindLook[job.kind]
  const overdue = isOverdue(job)
  const timeline =
    job.kind === "inspection"
      ? inspection && findInspection(job.id) && inspectionTimeline(findInspection(job.id)!, inspection)
      : maintenance && findMaintenance(job.id) && maintenanceTimeline(findMaintenance(job.id)!, maintenance)
  const due = `${isToday(job.date) ? "Today" : format(parseDay(job.date), "EEE d MMM")}, ${slotLabel(job.slot)}`

  return (
    <div className="space-y-5">
      {/* ---------- Header card ---------- */}
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-card px-5 py-4 shadow-xs ring-1 ring-foreground/10">
        <div className="min-w-0">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="flex items-center gap-1 hover:text-foreground"><Home className="size-3.5" /> Home</Link>›
            <Link to="/my-tasks" className="hover:text-foreground">My Tasks</Link>›
            <span className="font-semibold text-primary">{job.id}</span>
          </nav>
          <h2 className="mt-1 text-2xl font-bold text-brand-navy dark:text-foreground">{job.asset}</h2>
          <p className="mt-0.5 text-base text-muted-foreground">{job.activity} · {job.plant}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="h-12 px-4" onClick={() => navigate(-1)}>
            <ArrowLeft /> Back
          </Button>
          <Button variant="outline" className="h-12 px-4 text-primary" onClick={() => openPanel({ kind: "sop", activity: job.activity })}>
            <BookOpen /> SOP Guide
          </Button>
          <Button
            variant="outline"
            className="h-12 border-critical/40 px-4 text-critical"
            onClick={() => openPanel({ kind: "issue", jobId: job.id, jobKind: job.kind, asset: job.asset, plant: job.plant, enterprise: job.enterprise })}
          >
            <TriangleAlert /> Report Issue
          </Button>
        </div>
      </section>

      {/* ---------- Identity strip ---------- */}
      <section className="flex flex-wrap items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-xs ring-1 ring-foreground/10">
        <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-xl", look.tint)}>
          <CategoryIcon category={category} className="size-7" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-1 tabular-nums text-xs font-semibold">{shortCategory(category)}</span>
            <span className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold", kind.tint)}>
              <kind.icon className="size-3.5" /> {kind.label}
            </span>
            {detail?.assetTag ? (
              <span className="flex items-center gap-1.5 text-lg font-bold tabular-nums text-brand-navy dark:text-foreground">
                {detail.assetTag} <QrCode className="size-4 text-primary" />
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold uppercase", priorityTone[job.priority])}>{job.priority}</span>
            {detail ? (
              <span className="text-muted-foreground">
                Criticality: <span className="font-semibold text-foreground">{detail.assetCriticality}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ring-1", overdue ? "bg-critical-soft text-critical ring-critical/30" : "bg-muted/60 ring-foreground/10")}>
            <CalendarClock className="size-4" /> {due}
            {overdue ? " · Overdue" : ""}
          </span>
          <JobStatusBadge job={job} className="px-3 py-1.5 text-sm" />
        </div>
      </section>

      {/* ---------- What EMMS-E assigned, and where the asset is ---------- */}
      <TaskPanel icon={SlidersHorizontal} title="Task Details">
        <Group title="Task">
          <Field label="Task ID"><span className="tabular-nums font-semibold text-primary">{job.id}</span></Field>
          <Field label="Task Type">
            <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-sm font-semibold", kind.tint)}>
              <kind.icon className="size-4" /> {kind.label}
            </span>
          </Field>
          <Field label="Activity">{job.activity}</Field>
          <Field label="Assigned By">{detail?.createdBy ?? "EMMS-E"}</Field>
          {/* Only maintenance traces back to something: the inspection that raised it */}
          {job.kind === "maintenance" ? (
            <Field label="Raised From">{job.inspectionId ? `Inspection ${job.inspectionId}` : "—"}</Field>
          ) : null}
        </Group>

        <Group title="Where">
          <Field label="Enterprise">{job.enterprise}</Field>
          <Field label="Plant">{job.plant}</Field>
          <Field label="Department">{detail?.department || "—"}</Field>
          <Field label="Sub-Department">{detail?.subDepartment || "—"}</Field>
          <Field label="Location / Area">{detail?.area || "—"}</Field>
        </Group>

        <Group title="Asset" last>
          <Field label="Asset Name">{job.asset}</Field>
          <Field label="Asset Tag"><span className="tabular-nums font-semibold text-primary">{detail?.assetTag ?? "—"}</span></Field>
          <Field label="Asset Category">{category}</Field>
          <Field label="Asset Criticality">
            {detail ? <span className={cn("rounded-md px-2 py-0.5 text-sm font-semibold", criticalityTone[detail.assetCriticality])}>{detail.assetCriticality}</span> : "—"}
          </Field>
          <Field label="Commissioned">{detail?.commissionedOn ?? "—"}</Field>
        </Group>
      </TaskPanel>

      {/* Work OCC sent back: the one thing the engineer must read before starting again */}
      {maintenance?.review?.outcome === "rejected" ? (
        <section className="flex items-start gap-3 rounded-2xl bg-critical-soft p-5 text-sm shadow-xs ring-1 ring-critical/25">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-critical" />
          <span>
            <span className="block font-semibold text-critical-soft-foreground">
              Sent back by {maintenance.review.by} · {maintenance.review.at}
            </span>
            {maintenance.review.remarks}
            {action === "start" ? <span className="mt-1 block text-muted-foreground">Start the task to correct the record and resubmit.</span> : null}
          </span>
        </section>
      ) : null}

      {/* ---------- The work itself ---------- */}
      {action === "start" ? (
        <StartSection job={job} onStart={() => startJob(job, me.name)} />
      ) : job.kind === "inspection" && inspection && job.field === "in_progress" ? (
        <InspectionForm key={job.id} job={job} detail={inspection} />
      ) : job.kind === "maintenance" && maintenance && job.field === "in_progress" ? (
        <MaintenanceForm key={job.id} job={job} detail={maintenance} />
      ) : (
        <div className="space-y-5">
          <OutcomeBanner job={job} assetTag={detail?.assetTag} />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="min-w-0 space-y-5">
              {inspection ? <InspectionRecord detail={inspection} activity={job.activity} /> : maintenance ? <MaintenanceRecord detail={maintenance} /> : null}
            </div>
            <aside className="space-y-5">
              {inspection?.result ? (
                <TaskPanel icon={Activity} title="Health & Condition">
                  <HealthRing score={inspection.result.healthScore} />
                  {inspection.result.breakdown ? <div className="mt-4"><ScoreBreakdown breakdown={inspection.result.breakdown} /></div> : null}
                  <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                    {inspection.result.recommendedActions.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                </TaskPanel>
              ) : null}
              {timeline ? (
                <TaskPanel icon={History} title="Activity Timeline">
                  <Timeline steps={timeline} />
                </TaskPanel>
              ) : null}
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}

/** Before starting: the on-site checks with their own tick boxes, and the Start card */
function StartSection({ job, onStart }: { job: Job; onStart: () => void }) {
  // The ticks are the engineer's own reminder on site; they are not stored
  const [checked, setChecked] = useState<string[]>([])
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10">
        <header className="flex min-h-16 items-center gap-3 border-b px-5 py-3">
          <HardHat className="size-5 text-attention" />
          <h3 className="flex-1 text-lg font-semibold text-brand-navy dark:text-foreground">Plan & Prepare: check on site before starting</h3>
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground">
            {checked.length} / {prepare.length} checked
          </span>
        </header>
        <ul className="space-y-2.5 p-5">
          {prepare.map((p) => {
            const on = checked.includes(p.title)
            return (
              <li key={p.title}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChecked((c) => (on ? c.filter((x) => x !== p.title) : [...c, p.title]))}
                  className={cn("flex min-h-14 w-full items-center gap-3 rounded-xl px-4 text-left ring-1 transition-colors", on ? "bg-healthy-soft/40 ring-healthy/30" : "bg-card ring-foreground/10 hover:bg-muted/40")}
                >
                  <p.icon className={cn("size-5 shrink-0", p.tone)} />
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="font-semibold">{p.title}</span> <span className="text-muted-foreground">({p.detail})</span>
                  </span>
                  <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md ring-2", on ? "bg-primary text-primary-foreground ring-primary" : "ring-foreground/20")}>
                    {on ? <Check className="size-4" strokeWidth={3} /> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col rounded-2xl bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-brand-navy dark:text-foreground">
          <Rocket className="size-6 text-primary" /> Ready to start?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {job.kind === "maintenance"
            ? "Starting opens the time log with the exact start time and tells OCC the work is under way."
            : "Starting records the time and tells OCC the inspection is under way."}
        </p>
        <div className={cn("mt-4 rounded-xl px-4 py-3 text-sm ring-1", isOverdue(job) ? "bg-critical-soft text-critical ring-critical/25" : "bg-muted/50 ring-foreground/10")}>
          {isOverdue(job) ? "Overdue · was booked " : "Booked "}
          <span className="tabular-nums font-semibold">{format(parseDay(job.date), "d MMM")}, {slotLabel(job.slot)}</span>
        </div>
        <Button size="lg" className="mt-auto h-14 w-full text-lg shadow-lg shadow-primary/30 max-lg:mt-5" onClick={onStart}>
          <Play className="fill-current" /> Start Task
        </Button>
      </section>
    </div>
  )
}

/** Where finished work stands, as the design's green completion banner */
function OutcomeBanner({ job, assetTag }: { job: Job; assetTag?: string }) {
  const note =
    job.kind === "inspection"
      ? { title: "Inspection Completed", body: "The readings and evidence are saved against the asset." }
      : job.field === "approved"
        ? { title: "Approved by OCC", body: "The asset's health report is updated from this work." }
        : job.status === "open"
          ? { title: "Submitted for Approval", body: "OCC will review the evidence and approve the work or send it back with remarks." }
          : { title: "Maintenance Completed", body: "Closed out and recorded against the asset." }
  return (
    <section
      className={cn(
        "flex items-center gap-4 rounded-2xl p-5 text-white shadow-sm",
        job.field === "approved" ? "bg-gradient-to-r from-highlight to-primary" : "bg-gradient-to-r from-healthy to-[#0f7a5c]"
      )}
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/40">
        <CircleCheck className="size-8" />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-bold">{note.title}</div>
        <p className="text-sm text-white/90">
          {note.body}
          {assetTag ? <span className="tabular-nums font-semibold"> · {assetTag}</span> : null}
        </p>
      </div>
    </section>
  )
}
