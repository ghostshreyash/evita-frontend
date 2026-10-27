import { useMemo } from "react"
import { endOfWeek, parse, startOfDay, startOfWeek } from "date-fns"
import { ClipboardCheck, Wrench, type LucideIcon } from "lucide-react"

import { useInspectionDetails, useInspectionRows } from "@/data/inspection-store"
import { useMaintenanceDetails, useMaintenanceRows, useStartedMaintenance } from "@/data/maintenance-store"
import type { Priority } from "@/data/occ-tables"
import { categoryFor } from "@/lib/asset-category"
import { useCurrentElpremar } from "@/lib/me"
import { useScope } from "@/lib/scope"
import type { WorkStatus } from "@/lib/status"

/**
 * One job on the ELPREMAR's book, from either the inspection queue or the
 * maintenance book — the two lists OCC assigns from. EVITA shows them together
 * because on site they are simply "my work".
 */
export type JobKind = "inspection" | "maintenance"

/**
 * What each kind of work is called on screen.
 *
 * "Inspection Task", not "Testing & Measurements": on site the ELPREMAR is sent
 * to inspect an asset or to maintain one, and that is the word used throughout
 * the task screens and the book of work.
 */
export const jobKindLook: Record<JobKind, { label: string; long: string; icon: LucideIcon; tint: string }> = {
  inspection: { label: "Inspection", long: "Inspection", icon: ClipboardCheck, tint: "bg-info-soft text-primary" },
  // Maintenance is cleaning, and that is the word the engineer uses for it
  maintenance: { label: "Cleaning", long: "Cleaning", icon: Wrench, tint: "bg-highlight-soft text-highlight" },
}

/**
 * The statuses an ELPREMAR sees, whichever book the job comes from: Open
 * (assigned, not started), Overdue (not started and past its day), In Progress,
 * Report Due (recorded, reports not produced) and Completed. OCC's sign-off is
 * not among them - from the field the work is finished either way.
 */
export type FieldStatus = "open" | "overdue" | "in_progress" | "report_due" | "completed"

export const fieldStatuses: FieldStatus[] = ["open", "overdue", "in_progress", "report_due", "completed"]

export const fieldStatusLook: Record<FieldStatus, { label: string; badge: "info" | "critical" | "warning" | "success" | "highlight" }> = {
  open: { label: "Open", badge: "info" },
  overdue: { label: "Overdue", badge: "critical" },
  in_progress: { label: "In Progress", badge: "warning" },
  report_due: { label: "Report Due", badge: "warning" },
  completed: { label: "Completed", badge: "success" },
}

export type Job = {
  id: string
  kind: JobKind
  asset: string
  plant: string
  enterprise: string
  country: string
  /** Inspection activity, or the maintenance programme */
  activity: string
  /** dd-MM-yyyy */
  date: string
  slot: number
  priority: Priority
  /** The status in OCC's book, kept for the record and the store calls */
  status: WorkStatus
  /** The status as EVITA shows it */
  field: FieldStatus
  area: string
  /** Inspection the maintenance traces back to */
  inspectionId?: string
}

/**
 * The inspection on the engineer's book for this asset, if there is one.
 *
 * Matched on the plant as well as the category, now that an ELPREMAR is posted
 * where they are sent to work and the register and the book name the same
 * plant.
 *
 * TODO: a task still carries no asset id. The book names its assets loosely
 * ("LT Panel - Block A") while the register names them by series ("LT Panel -
 * 01"), so the category is as close as this gets. Match on the asset id once
 * the API carries one.
 */
export function inspectionFor(jobs: Job[], asset: { id?: string; category: string; plant: string }, tags?: Record<string, string>) {
  const open = jobs.filter((j) => j.kind === "inspection" && actionFor(j) !== "view")
  /*
   * The asset's own record first. An inspection carries the asset it was taken
   * against, so an exact match is available where it used to be guessed - the
   * plant-and-category match below is the fallback for the seeded rows, which
   * name an asset but carry no id.
   */
  const exact = asset.id && tags ? open.find((j) => tags[j.id] === asset.id) : undefined
  return exact ?? open.find((j) => j.plant === asset.plant && categoryFor(j.asset) === asset.category)
}

/**
 * Where a job's record lives.
 *
 * An inspection is not on My Tasks, so it does not open there either: it opens
 * under Inspections, and the screen reads the same either way.
 */
export const jobPath = (job: Pick<Job, "id" | "kind">) =>
  job.kind === "inspection" ? `/inspections/${job.id}` : `/my-tasks/${job.id}`

/** What the ELPREMAR can do with a job right now */
export type JobAction = "start" | "continue" | "report" | "view"

/**
 * Open and Overdue → Start; In Progress → Continue; Report Due → Generate
 * Report; Completed and Approved → View.
 */
export function actionFor(job: Pick<Job, "field">): JobAction {
  if (job.field === "open" || job.field === "overdue") return "start"
  if (job.field === "in_progress") return "continue"
  if (job.field === "report_due") return "report"
  return "view"
}

export const parseDay = (d: string) => startOfDay(parse(d, "dd-MM-yyyy", new Date()))
export const isToday = (d: string) => parseDay(d).getTime() === startOfDay(new Date()).getTime()
/** The working week runs Monday to Sunday */
export const thisWeek = () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: startOfDay(endOfWeek(new Date(), { weekStartsOn: 1 })) })
export const isThisWeek = (d: string) => {
  const { from, to } = thisWeek()
  const day = parseDay(d)
  return day >= from && day <= to
}
const isPast = (d: string) => parseDay(d) < startOfDay(new Date())
export const isOverdue = (job: Pick<Job, "field">) => job.field === "overdue"

/**
 * OCC's book status → what the ELPREMAR sees.
 *
 * Inspection: Approved (pending) → Open, Start → In Progress → Completed.
 * Maintenance: OCC books it straight into In Progress, so it reads Open until
 * the engineer presses Start in EVITA. Submitted (Pending For Approval) and
 * closed work read Completed; OCC's Approved reads Approved; work OCC sent back
 * reads Open again, to be started and resubmitted.
 */
function fieldStatusOf(kind: JobKind, status: WorkStatus, date: string, startedHere: boolean, reported = true): FieldStatus {
  const notStarted = (): FieldStatus => (isPast(date) ? "overdue" : "open")
  if (kind === "inspection") {
    if (status === "pending") return notStarted()
    if (status === "in_progress") return "in_progress"
    // Submitted is not finished: the reports still have to come out of it
    return reported ? "completed" : "report_due"
  }
  if (status === "in_progress") return startedHere ? "in_progress" : notStarted()
  if (status === "rejected") return notStarted()
  // OCC's sign-off is not a state of its own in the field: the work is done
  if (status === "assigned") return "completed"
  return "completed"
}

/** Sort key: the moment the job is booked for */
export const when = (job: Pick<Job, "date" | "slot">) => parseDay(job.date).getTime() + job.slot * 3_600_000

/** Every job booked to the signed-in ELPREMAR, from both books, soonest first */
export function useMyJobs(): Job[] {
  const me = useCurrentElpremar()
  /* One enterprise at a time: whichever the engineer has chosen - see lib/scope */
  const { enterprise } = useScope()
  const inspections = useInspectionRows()
  const inspectionDetails = useInspectionDetails()
  const maintenance = useMaintenanceRows()
  const maintenanceDetails = useMaintenanceDetails()
  const started = useStartedMaintenance()

  return useMemo(() => {
    const jobs: Job[] = [
      ...inspections
        .filter((t) => t.elpremar === me.name && t.enterprise === enterprise)
        .map((t) => ({
          id: t.id,
          kind: "inspection" as const,
          asset: t.asset,
          plant: t.plant,
          enterprise: t.enterprise,
          country: t.country,
          activity: t.activity,
          date: t.due,
          slot: t.slot,
          priority: t.priority,
          status: t.status,
          field: fieldStatusOf("inspection", t.status, t.due, false, !!inspectionDetails[t.id]?.reportedAt),
          area: inspectionDetails[t.id]?.area ?? "",
        })),
      ...maintenance
        .filter((m) => m.elpremar === me.name && m.enterprise === enterprise)
        .map((m) => ({
          id: m.id,
          kind: "maintenance" as const,
          asset: m.asset,
          plant: m.plant,
          enterprise: m.enterprise,
          country: m.country,
          activity: `${m.type} Cleaning`,
          date: m.scheduled,
          slot: m.slot,
          priority: maintenanceDetails[m.id]?.priority ?? "Medium",
          status: m.status,
          field: fieldStatusOf("maintenance", m.status, m.scheduled, started.has(m.id)),
          area: maintenanceDetails[m.id]?.area ?? "",
          inspectionId: m.inspectionId,
        })),
    ]
    return jobs.sort((a, b) => when(a) - when(b))
  }, [me, enterprise, inspections, inspectionDetails, maintenance, maintenanceDetails, started])
}

/** The day at a glance, as counted on the dashboard tiles */
export function summarise(jobs: Job[]) {
  const today = jobs.filter((j) => isToday(j.date))
  return {
    today: today.length,
    pending: today.filter((j) => j.field === "open").length,
    running: today.filter((j) => j.field === "in_progress").length,
    completed: jobs.filter((j) => j.field === "completed").length,
    overdue: jobs.filter(isOverdue).length,
    total: jobs.length,
  }
}

export { categoryFor }
