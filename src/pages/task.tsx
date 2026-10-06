import { Link, useNavigate, useParams } from "react-router"
import { format } from "date-fns"
import { Activity, ArrowLeft, BookOpen, CalendarClock, CircleCheck, ClipboardList, HardHat, History, MessageSquareWarning, Play, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { Timeline } from "@/components/common/detail-view"
import { CategoryIcon } from "@/components/common/category-icon"
import { CheckList, DetailList, DetailPanel } from "@/components/common/detail-list"
import { StepperBar, type WizardStep } from "@/components/common/wizard"
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
import { criticalityTone, priorityTone, slotLabel } from "@/data/occ-tables"
import { categoryLook } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isOverdue, isToday, parseDay, useMyJobs, type FieldStatus, type Job } from "@/lib/work"

/* ---------- Progress ---------- */

/** The same numbered step bar OCC's onboarding uses, showing where the task stands */
const steps: Record<Job["kind"], WizardStep[]> = {
  inspection: [{ title: "Assigned" }, { title: "Started" }, { title: "Recording" }, { title: "Completed" }],
  maintenance: [{ title: "Assigned" }, { title: "Started" }, { title: "Work Logged" }, { title: "Submitted" }, { title: "Approved" }],
}

/** Index of the step the task is on; past the last step means every step is done */
function stepOf(kind: Job["kind"], field: FieldStatus) {
  if (field === "open" || field === "overdue") return 1
  if (field === "in_progress") return 2
  if (kind === "inspection") return 4
  return field === "approved" ? 5 : 4
}

const prepare = [
  "Permit to work issued and valid for this asset and activity",
  "Area barricaded; isolation and LOTO applied where the activity needs it",
  "Absence of voltage proved with a tested detector",
  "PPE on: arc-rated clothing, insulated gloves, helmet, safety shoes",
  "Instruments calibrated, charged and to hand",
]

/**
 * One task, start to finish, as the ELPREMAR works it on site. Laid out like
 * the asset screens: page header, an identity strip, the progress bar, then
 * label/value panels.
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
          <TriangleAlert className="size-8 text-attention" />
          <p className="max-w-md text-sm text-muted-foreground">
            <span className="font-semibold">{id}</span> is not on your book of work. It may have been reassigned by OCC.
          </p>
          <Button asChild><Link to="/my-tasks">Back to My Tasks</Link></Button>
        </div>
      </div>
    )
  }

  const inspection = job.kind === "inspection" ? inspectionDetails[job.id] : undefined
  const maintenance = job.kind === "maintenance" ? maintenanceDetails[job.id] : undefined
  const detail = inspection ?? maintenance
  const action = actionFor(job)
  const category = categoryFor(job.asset)
  const overdue = isOverdue(job)
  const procedure = inspection ? (instructions[job.activity] ?? "") : (maintenance?.description ?? "")
  const timeline =
    job.kind === "inspection"
      ? inspection && findInspection(job.id) && inspectionTimeline(findInspection(job.id)!, inspection)
      : maintenance && findMaintenance(job.id) && maintenanceTimeline(findMaintenance(job.id)!, maintenance)
  const due = `${isToday(job.date) ? "Today" : format(parseDay(job.date), "EEE d MMM yyyy")}, ${slotLabel(job.slot)}`

  return (
    <div>
      <PageHeader
        title={job.asset}
        description={`${job.activity} · ${job.plant}`}
        breadcrumbs={[{ label: "My Tasks", to: "/my-tasks" }, { label: job.id }]}
        actions={
          <>
            <Button variant="outline" onClick={() => openPanel({ kind: "sop", activity: job.activity })}>
              <BookOpen /> SOP
            </Button>
            <Button
              variant="outline"
              onClick={() => openPanel({ kind: "issue", jobId: job.id, jobKind: job.kind, asset: job.asset, plant: job.plant, enterprise: job.enterprise })}
            >
              <MessageSquareWarning /> Report Issue
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft /> Back
            </Button>
          </>
        }
      />

      {/* ---------- Identity strip ---------- */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-card px-3 py-2.5 shadow-xs ring-1 ring-foreground/10">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", categoryLook(category).tint)}>
          <CategoryIcon category={category} className="size-5" />
        </span>
        <span className="rounded-md bg-info-soft px-2.5 py-1.5 font-semibold tracking-wide text-primary tabular-nums">{job.id}</span>
        <JobStatusBadge job={job} />
        <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityTone[job.priority])}>{job.priority} priority</span>
        <span className={cn("flex items-center gap-1.5 text-sm", overdue ? "font-semibold text-critical" : "text-muted-foreground")}>
          <CalendarClock className="size-4" /> {due}
          {overdue ? " · Overdue" : ""}
        </span>
        <span className="ml-auto text-sm text-muted-foreground">
          Assigned by <span className="font-medium text-foreground">{detail?.createdBy ?? "OCC"}</span>
        </span>
      </div>

      <StepperBar steps={steps[job.kind]} current={stepOf(job.kind, job.field)} />

      {/* ---------- What OCC assigned ---------- */}
      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <DetailPanel icon={ClipboardList} title="Task Details">
          <DetailList
            rows={[
              { label: "Activity", value: job.activity, always: true },
              { label: "Enterprise", value: job.enterprise, always: true },
              { label: "Plant", value: job.plant, always: true },
              { label: "Location / Area", value: detail?.area },
              { label: "Asset Category", value: category, always: true },
              { label: "Asset Tag", value: detail?.assetTag },
              {
                label: "Asset Criticality",
                value: detail ? <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", criticalityTone[detail.assetCriticality])}>{detail.assetCriticality}</span> : undefined,
              },
              { label: "Commissioned", value: detail?.commissionedOn },
              { label: "Raised From", value: job.inspectionId ? `Inspection ${job.inspectionId}` : undefined },
            ]}
          />
        </DetailPanel>

        <DetailPanel icon={BookOpen} title="Procedure">
          {procedure ? <p className="text-sm leading-relaxed">{procedure}</p> : <p className="text-sm text-muted-foreground">No instruction attached.</p>}
          {maintenance?.review?.outcome === "rejected" ? (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-critical-soft p-3 text-sm ring-1 ring-critical/20">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-critical" />
              <span>
                <span className="block font-semibold text-critical-soft-foreground">
                  Sent back by {maintenance.review.by} · {maintenance.review.at}
                </span>
                {maintenance.review.remarks}
                {action === "start" ? <span className="mt-1 block text-muted-foreground">Start the task to correct the record and resubmit.</span> : null}
              </span>
            </div>
          ) : null}
        </DetailPanel>
      </div>

      {/* ---------- The work itself ---------- */}
      {action === "start" ? (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <CheckList title="Plan & Prepare: check on site before starting" items={prepare.map((label) => ({ label, done: false }))} />
          <DetailPanel icon={HardHat} title="Ready to start?">
            <p className="text-sm text-muted-foreground">
              {job.kind === "maintenance"
                ? "Starting opens the time log with the exact start time and tells OCC the work is under way."
                : "Starting records the time and tells OCC the inspection is under way."}
            </p>
            <Button size="lg" className="mt-4 w-full" onClick={() => startJob(job, me.name)}>
              <Play /> Start Task
            </Button>
          </DetailPanel>
        </div>
      ) : job.kind === "inspection" && inspection && job.field === "in_progress" ? (
        <InspectionForm key={job.id} job={job} detail={inspection} />
      ) : job.kind === "maintenance" && maintenance && job.field === "in_progress" ? (
        <MaintenanceForm key={job.id} job={job} detail={maintenance} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0 space-y-3">
            <OutcomeNote job={job} />
            {inspection ? <InspectionRecord detail={inspection} /> : maintenance ? <MaintenanceRecord detail={maintenance} /> : null}
          </div>
          <aside className="space-y-3">
            {inspection?.result ? (
              <DetailPanel icon={Activity} title="Health & Condition">
                <HealthRing score={inspection.result.healthScore} />
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {inspection.result.recommendedActions.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </DetailPanel>
            ) : null}
            {timeline ? (
              <DetailPanel icon={History} title="Activity Timeline">
                <Timeline steps={timeline} />
              </DetailPanel>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  )
}

/** Where finished work stands, in one line */
function OutcomeNote({ job }: { job: Job }) {
  const note =
    job.kind === "inspection"
      ? { title: "Inspection completed", body: "The readings and evidence are saved against the asset." }
      : job.field === "approved"
        ? { title: "Approved by OCC", body: "The asset's health report is updated from this work." }
        : job.status === "open"
          ? { title: "Submitted for approval", body: "OCC will review the evidence and approve the work or send it back with remarks." }
          : { title: "Maintenance completed", body: "Closed out and recorded against the asset." }
  return (
    <p className="flex items-start gap-2 rounded-lg bg-healthy-soft px-3 py-2.5 text-sm ring-1 ring-healthy/20">
      <CircleCheck className="mt-0.5 size-4 shrink-0 text-healthy" />
      <span>
        <span className="font-semibold">{note.title}.</span> {note.body}
      </span>
    </p>
  )
}
