import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import { ArrowLeft, BookOpen, CircleCheck, ClipboardList, Clock, HardHat, MessageSquareWarning, Play, RotateCcw, TriangleAlert, Wrench } from "lucide-react"
import { toast } from "sonner"
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
import { findInspection, startInspection, useInspectionDetails } from "@/data/inspection-store"
import { maintenanceTimeline } from "@/data/maintenance-detail"
import { findMaintenance, reworkMaintenance, useMaintenanceDetails } from "@/data/maintenance-store"
import { priorityTone, slotLabel } from "@/data/occ-tables"
import { categoryLook } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isToday, parseDay, useMyJobs, type Job } from "@/lib/work"

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  )
}

/** A category with its glyph, as on the dashboard tiles */
function CategoryName({ category }: { category: string }) {
  const look = categoryLook(category)
  return (
    <span className="flex items-center gap-1.5">
      <look.icon className={cn("size-4 shrink-0", look.tone)} />
      {category}
    </span>
  )
}

const prepare = [
  "Permit to work issued and valid for this asset",
  "Area barricaded; isolation and LOTO applied where the activity needs it",
  "Absence of voltage proved with a tested detector",
  "PPE on: arc-rated clothing, insulated gloves, helmet, safety shoes",
  "Instruments calibrated and charged",
]

/**
 * One task, start to finish, as the ELPREMAR works it on site.
 *
 * Inspection: Approved → Start → record readings, observations and evidence →
 * Submit (completed, asset re-scored). Maintenance: record the work → Submit for
 * Approval → OCC approves or sends it back → Rework → resubmit.
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
  const sop = instructions[job.activity] ?? maintenance?.description ?? ""
  const timeline =
    job.kind === "inspection"
      ? inspection && findInspection(job.id) && inspectionTimeline(findInspection(job.id)!, inspection)
      : maintenance && findMaintenance(job.id) && maintenanceTimeline(findMaintenance(job.id)!, maintenance)

  const issue = () =>
    openPanel({ kind: "issue", jobId: job.id, jobKind: job.kind, asset: job.asset, plant: job.plant, enterprise: job.enterprise })

  return (
    <div>
      <PageHeader
        title={job.asset}
        description={`${job.activity} · ${job.plant}, ${job.enterprise}`}
        breadcrumbs={[{ label: "My Tasks", to: "/my-tasks" }, { label: job.id }]}
        actions={
          <>
            <Button variant="outline" className="bg-card" onClick={() => openPanel({ kind: "sop", activity: job.kind === "inspection" ? job.activity : `${job.activity}` })}>
              <BookOpen /> SOP
            </Button>
            <Button variant="outline" className="bg-card text-critical" onClick={issue}>
              <MessageSquareWarning /> Report Issue
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft /> Back
            </Button>
          </>
        }
      />

      {/* ---------- What OCC assigned ---------- */}
      <section className="mb-4 rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={cn("flex size-10 items-center justify-center rounded-lg", job.kind === "inspection" ? "bg-info-soft text-info" : "bg-highlight-soft text-highlight")}>
            {job.kind === "inspection" ? <ClipboardList className="size-5" /> : <Wrench className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-semibold">{job.activity}</div>
            <div className="text-sm text-muted-foreground tabular-nums">{job.id}{job.inspectionId ? ` · from inspection ${job.inspectionId}` : ""}</div>
          </div>
          <JobStatusBadge job={job} className="text-sm" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-4">
          <Fact label="Due">{isToday(job.date) ? "Today" : format(parseDay(job.date), "EEE d MMM yyyy")}<span className="block text-xs text-muted-foreground">{slotLabel(job.slot)}</span></Fact>
          <Fact label="Priority"><span className={cn("rounded px-2 py-0.5 text-xs font-semibold", priorityTone[job.priority])}>{job.priority}</span></Fact>
          <Fact label="Location / Area">{detail?.area || "—"}</Fact>
          <Fact label="Asset Category"><CategoryName category={categoryFor(job.asset)} /><span className="block text-xs text-muted-foreground">{detail ? `${detail.assetCriticality} criticality` : ""}</span></Fact>
          <Fact label="Assigned By">{detail?.createdBy ?? "OCC"}</Fact>
          <Fact label="Asset Tag">{detail?.assetTag ?? "—"}</Fact>
          <Fact label="Commissioned">{detail?.commissionedOn ?? "—"}</Fact>
          <Fact label="Plant">{job.plant}</Fact>
        </div>
        {detail?.description || sop ? (
          <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-sm"><span className="font-semibold">Task: </span>{inspection ? sop : maintenance?.description}</p>
        ) : null}
      </section>

      {/* ---------- OCC sent it back ---------- */}
      {maintenance?.review?.outcome === "rejected" ? (
        <section className="mb-4 flex flex-wrap items-start gap-3 rounded-lg bg-critical-soft p-4 ring-1 ring-critical/20">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-critical" />
          <div className="min-w-0 flex-1 text-sm">
            <div className="font-semibold text-critical-soft-foreground">Sent back for correction by {maintenance.review.by} · {maintenance.review.at}</div>
            <p className="mt-0.5">{maintenance.review.remarks}</p>
          </div>
          {action === "rework" ? (
            <Button
              onClick={() => {
                reworkMaintenance(job.id)
                toast.info(`${job.id} back in progress`)
              }}
            >
              <RotateCcw /> Start Rework
            </Button>
          ) : null}
        </section>
      ) : null}

      {/* ---------- The work itself ---------- */}
      {action === "start" ? (
        <StartPanel job={job} sop={sop} onStart={() => {
          startInspection(job.id, me.name)
          toast.success(`${job.id} started`, { description: "Record readings, observations and images as you go." })
        }} />
      ) : job.kind === "inspection" && inspection && job.status === "in_progress" ? (
        <InspectionForm key={job.id} job={job} detail={inspection} />
      ) : job.kind === "maintenance" && maintenance && job.status === "in_progress" ? (
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

function StartPanel({ job, sop, onStart }: { job: Job; sop: string; onStart: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="rounded-lg bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <h3 className="flex items-center gap-2 text-lg font-semibold"><HardHat className="size-5 text-attention" /> Plan & Prepare</h3>
        <p className="mt-1 text-sm text-muted-foreground">Check each point on site before you start the clock.</p>
        <ul className="mt-4 space-y-2.5">
          {prepare.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-sm"><CircleCheck className="mt-0.5 size-5 shrink-0 text-healthy" />{p}</li>
          ))}
        </ul>
        {sop ? <p className="mt-4 rounded-md bg-info-soft px-3 py-2.5 text-sm text-info-soft-foreground"><span className="font-semibold">Procedure: </span>{sop}</p> : null}
      </section>
      <section className="flex flex-col justify-between gap-4 rounded-lg bg-card p-5 shadow-xs ring-1 ring-foreground/10">
        <div>
          <h3 className="text-lg font-semibold">Ready to start?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Starting records the time and tells OCC the {job.kind === "inspection" ? "inspection" : "work"} is under way.
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm"><Clock className="size-4 text-primary" /> Booked {slotLabel(job.slot)}</p>
        </div>
        <Button size="lg" className="h-14 w-full text-lg" onClick={onStart}>
          <Play /> Start Task
        </Button>
      </section>
    </div>
  )
}

/** What state the finished work is in, in the words of the EVITA mockups */
function OutcomeBanner({ job }: { job: Job }) {
  const look =
    job.kind === "inspection"
      ? { tone: "bg-healthy-soft ring-healthy/20", title: "Inspection Completed Successfully", body: "The inspection data has been saved and synced with the asset record." }
      : job.status === "open"
        ? { tone: "bg-attention-soft ring-attention/25", title: "Submitted — awaiting OCC approval", body: "OCC will review the evidence and approve the work or send it back with remarks." }
        : job.status === "assigned"
          ? { tone: "bg-highlight-soft ring-highlight/20", title: "Approved by OCC", body: "The asset's health report is updated from this work." }
          : job.status === "rejected"
            ? { tone: "bg-critical-soft ring-critical/20", title: "Correction requested", body: "Start rework to update the record and resubmit." }
            : { tone: "bg-healthy-soft ring-healthy/20", title: "Maintenance completed", body: "Closed out and recorded against the asset." }
  return (
    <section className={cn("flex items-start gap-3 rounded-lg p-4 ring-1", look.tone)}>
      <CircleCheck className="mt-0.5 size-6 shrink-0 text-healthy" />
      <div>
        <div className="text-base font-semibold">{look.title}</div>
        <p className="text-sm text-muted-foreground">{look.body}</p>
      </div>
    </section>
  )
}
