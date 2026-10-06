import { useMemo } from "react"
import { endOfWeek, parse, startOfDay, startOfWeek } from "date-fns"

import { useInspectionDetails, useInspectionRows } from "@/data/inspection-store"
import { assetCategories } from "@/data/master-data"
import { useMaintenanceDetails, useMaintenanceRows, useStartedMaintenance } from "@/data/maintenance-store"
import type { Priority } from "@/data/occ-tables"
import { useCurrentElpremar } from "@/lib/me"
import type { WorkStatus } from "@/lib/status"

/**
 * One job on the ELPREMAR's book, from either the inspection queue or the
 * maintenance book — the two lists OCC assigns from. EVITA shows them together
 * because on site they are simply "my work".
 */
export type JobKind = "inspection" | "maintenance"

/**
 * The five statuses an ELPREMAR sees, whichever book the job comes from:
 * Open (assigned, not started), Overdue (not started and past its day),
 * In Progress, Completed (their part is done) and Approved (signed off by OCC).
 */
export type FieldStatus = "open" | "overdue" | "in_progress" | "completed" | "approved"

export const fieldStatuses: FieldStatus[] = ["open", "overdue", "in_progress", "completed", "approved"]

export const fieldStatusLook: Record<FieldStatus, { label: string; badge: "info" | "critical" | "warning" | "success" | "highlight" }> = {
  open: { label: "Open", badge: "info" },
  overdue: { label: "Overdue", badge: "critical" },
  in_progress: { label: "In Progress", badge: "warning" },
  completed: { label: "Completed", badge: "success" },
  approved: { label: "Approved", badge: "highlight" },
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

/** What the ELPREMAR can do with a job right now */
export type JobAction = "start" | "continue" | "view"

/** Open and Overdue → Start; In Progress → Continue; Completed and Approved → View */
export function actionFor(job: Pick<Job, "field">): JobAction {
  if (job.field === "open" || job.field === "overdue") return "start"
  if (job.field === "in_progress") return "continue"
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
function fieldStatusOf(kind: JobKind, status: WorkStatus, date: string, startedHere: boolean): FieldStatus {
  const notStarted = (): FieldStatus => (isPast(date) ? "overdue" : "open")
  if (kind === "inspection") {
    if (status === "pending") return notStarted()
    if (status === "in_progress") return "in_progress"
    return "completed"
  }
  if (status === "in_progress") return startedHere ? "in_progress" : notStarted()
  if (status === "rejected") return notStarted()
  if (status === "assigned") return "approved"
  return "completed"
}

/** Sort key: the moment the job is booked for */
export const when = (job: Pick<Job, "date" | "slot">) => parseDay(job.date).getTime() + job.slot * 3_600_000

/** Every job booked to the signed-in ELPREMAR, from both books, soonest first */
export function useMyJobs(): Job[] {
  const me = useCurrentElpremar()
  const inspections = useInspectionRows()
  const inspectionDetails = useInspectionDetails()
  const maintenance = useMaintenanceRows()
  const maintenanceDetails = useMaintenanceDetails()
  const started = useStartedMaintenance()

  return useMemo(() => {
    const jobs: Job[] = [
      ...inspections
        .filter((t) => t.elpremar === me.name)
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
          field: fieldStatusOf("inspection", t.status, t.due, false),
          area: inspectionDetails[t.id]?.area ?? "",
        })),
      ...maintenance
        .filter((m) => m.elpremar === me.name)
        .map((m) => ({
          id: m.id,
          kind: "maintenance" as const,
          asset: m.asset,
          plant: m.plant,
          enterprise: m.enterprise,
          country: m.country,
          activity: `${m.type} Maintenance`,
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
  }, [me, inspections, inspectionDetails, maintenance, maintenanceDetails, started])
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

/**
 * The master category a job's asset name belongs to: "MCC - Unit 2" → MCC
 * (Motor Control Center). Job names use the short form the mockups show.
 */
export function categoryFor(assetName: string) {
  const prefix = assetName.split(" - ")[0].trim().toLowerCase()
  return (
    assetCategories.find((c) => c.toLowerCase() === prefix) ??
    assetCategories.find((c) => c.toLowerCase().startsWith(prefix)) ??
    assetCategories.find((c) => c.toLowerCase().includes(prefix)) ??
    "Other"
  )
}
