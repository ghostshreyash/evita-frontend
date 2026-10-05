import { useMemo } from "react"
import { parse, startOfDay } from "date-fns"

import { useInspectionDetails, useInspectionRows } from "@/data/inspection-store"
import { assetCategories } from "@/data/master-data"
import { useMaintenanceDetails, useMaintenanceRows } from "@/data/maintenance-store"
import type { Priority } from "@/data/occ-tables"
import { useCurrentElpremar } from "@/lib/me"
import { inspectionStatus, maintenanceStatus, workStatus, type WorkStatus } from "@/lib/status"

/**
 * One job on the ELPREMAR's book, from either the inspection queue or the
 * maintenance book — the two lists OCC assigns from. EVITA shows them together
 * because on site they are simply "my work".
 */
export type JobKind = "inspection" | "maintenance"

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
  status: WorkStatus
  area: string
  /** Inspection the maintenance traces back to */
  inspectionId?: string
}

/** What the ELPREMAR can do with a job right now */
export type JobAction = "start" | "continue" | "rework" | "view"

/**
 * Inspections: Approved (pending) → Start → In Progress → Completed.
 * Maintenance: In Progress → Submit for Approval → Pending For Approval →
 * Approved / Rejected. A rejected job comes back to the field for rework.
 */
export function actionFor(job: Pick<Job, "kind" | "status">): JobAction {
  if (job.kind === "inspection") {
    if (job.status === "pending") return "start"
    if (job.status === "in_progress") return "continue"
    return "view"
  }
  if (job.status === "in_progress") return "continue"
  if (job.status === "rejected") return "rework"
  return "view"
}

/** Still needs the ELPREMAR's hands, as opposed to waiting on OCC or finished */
export const isOpenWork = (job: Pick<Job, "kind" | "status">) => actionFor(job) !== "view"

/** Status wording for a job, in the vocabulary OCC uses for that book */
export function statusLook(job: Pick<Job, "kind" | "status">) {
  const override = job.kind === "inspection" ? inspectionStatus[job.status] : maintenanceStatus[job.status]
  return override ?? workStatus[job.status]
}

export const parseDay = (d: string) => startOfDay(parse(d, "dd-MM-yyyy", new Date()))
export const isToday = (d: string) => parseDay(d).getTime() === startOfDay(new Date()).getTime()
/** Past its day and still needing work */
export const isOverdue = (job: Job) => isOpenWork(job) && parseDay(job.date) < startOfDay(new Date())

/** Sort key: the moment the job is booked for */
export const when = (job: Pick<Job, "date" | "slot">) => parseDay(job.date).getTime() + job.slot * 3_600_000

/** Every job booked to the signed-in ELPREMAR, from both books, soonest first */
export function useMyJobs(): Job[] {
  const me = useCurrentElpremar()
  const inspections = useInspectionRows()
  const inspectionDetails = useInspectionDetails()
  const maintenance = useMaintenanceRows()
  const maintenanceDetails = useMaintenanceDetails()

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
          area: maintenanceDetails[m.id]?.area ?? "",
          inspectionId: m.inspectionId,
        })),
    ]
    return jobs.sort((a, b) => when(a) - when(b))
  }, [me, inspections, inspectionDetails, maintenance, maintenanceDetails])
}

/** The day at a glance, as counted on the dashboard tiles */
export function summarise(jobs: Job[]) {
  const today = jobs.filter((j) => isToday(j.date))
  return {
    today: today.length,
    toStart: today.filter((j) => actionFor(j) === "start" || actionFor(j) === "rework").length,
    running: today.filter((j) => j.status === "in_progress").length,
    // Approved maintenance is signed off but not closed out, so it does not count as finished
    completed: jobs.filter((j) => j.status === "completed").length,
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
