import { useSyncExternalStore } from "react"

import { maintenanceDetail, type MaintenanceDetail } from "@/data/maintenance-detail"
import { maintenanceActivities, type MaintenanceRow } from "@/data/occ-tables"
import { loadSnapshot, saveSnapshot, stampNow } from "@/data/persist"
import type { WorkStatus } from "@/lib/status"

/**
 * One copy of the maintenance book plus the execution record behind each row,
 * shared by the list and the details screen so approving, rejecting or
 * reassigning in either place shows up in the other. Stands in for the query
 * cache until these rows come from the API.
 *
 * Same store as occ-frontend's, plus the field-side mutations EVITA makes. The
 * lifecycle both apps follow: the ELPREMAR works the job (In Progress) and
 * submits it for approval (Pending For Approval); OCC approves it (Approved) or
 * sends it back (Rejected), and the ELPREMAR reworks and resubmits.
 */
type Snapshot = { rows: MaintenanceRow[]; details: Record<string, MaintenanceDetail> }

const saved = loadSnapshot<Snapshot>("maintenance.v2")
let rows: MaintenanceRow[] = saved?.rows ?? maintenanceActivities
let details: Record<string, MaintenanceDetail> =
  saved?.details ?? Object.fromEntries(rows.map((r) => [r.id, maintenanceDetail(r)]))

const listeners = new Set<() => void>()
const emit = () => {
  saveSnapshot("maintenance.v2", { rows, details } satisfies Snapshot)
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useMaintenanceRows = () => useSyncExternalStore(subscribe, () => rows)

export const useMaintenanceDetails = () => useSyncExternalStore(subscribe, () => details)

export const findMaintenance = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

export function updateMaintenance(id: string, patch: Partial<MaintenanceRow>) {
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
  emit()
}

/**
 * Raise a maintenance activity off the back of an inspection, carrying the
 * enterprise, plant and asset across so OCC never re-keys them. Returns the new
 * task id so the caller can navigate straight to it.
 */
export function addMaintenanceFromInspection(source: {
  inspectionId: string
  activity: string
  enterprise: string
  plant: string
  country: string
  asset: string
  elpremar: string
  scheduled: string
  slot: number
  recommendation: string
}) {
  const id = `MT-${2300 + rows.filter((r) => r.id.startsWith("MT-23")).length}`
  const row: MaintenanceRow = {
    id,
    asset: source.asset,
    plant: source.plant,
    enterprise: source.enterprise,
    country: source.country,
    type: "Condition-Based",
    elpremar: source.elpremar,
    scheduled: source.scheduled,
    slot: source.slot,
    status: "open",
    inspectionId: source.inspectionId,
  }
  rows = [row, ...rows]
  details = {
    ...details,
    [id]: {
      ...maintenanceDetail(row),
      description: `Raised from inspection ${source.inspectionId} (${source.activity}). ${source.recommendation}`,
      createdBy: "Admin (EMMS-E)",
      execution: undefined,
      products: [],
      evidence: [],
      review: undefined,
    },
  }
  emit()
  return id
}

/** Sign an activity off, or send it back to the field for correction */
export function reviewMaintenance(id: string, outcome: "approved" | "rejected", by: string, remarks: string) {
  const status: WorkStatus = outcome === "approved" ? "assigned" : "rejected"
  rows = rows.map((r) => (r.id === id ? { ...r, status } : r))
  details = { ...details, [id]: { ...details[id], review: { outcome, by, at: stampNow(), remarks } } }
  emit()
}

/* ---------- Field-side (EVITA) ---------- */

/**
 * What the maintenance form saves. The clock (`timeLog`, start / end times) is
 * written only by Start / Stop / Resume, so a draft can never roll it back.
 */
export type MaintenanceDraft = Pick<MaintenanceDetail, "products" | "evidence" | "firePrevention" | "pdMitigation"> & { notes: string }

const withDraft = (detail: MaintenanceDetail, { notes, ...rest }: MaintenanceDraft): MaintenanceDetail => ({
  ...detail,
  ...rest,
  execution: detail.execution && { ...detail.execution, notes },
})

/** Save what has been captured so far without submitting */
export function saveMaintenanceDraft(id: string, draft: MaintenanceDraft) {
  details = { ...details, [id]: withDraft(details[id], draft) }
  emit()
}

/** Work finished on site: stop the clock and hand it to OCC for approval */
export function submitMaintenance(id: string, draft: MaintenanceDraft) {
  const now = new Date().toISOString()
  const detail = withDraft(details[id], draft)
  const timeLog = (detail.timeLog ?? []).map((e, i, all) => (i === all.length - 1 && !e.end ? { ...e, end: now } : e))
  const lastEnd = timeLog.at(-1)?.end
  details = {
    ...details,
    [id]: {
      ...detail,
      timeLog,
      execution: detail.execution && { ...detail.execution, endedAt: lastEnd ? stampOf(lastEnd) : (detail.execution.endedAt ?? stampNow()) },
      // A resubmission replaces the earlier verdict
      review: undefined,
    },
  }
  rows = rows.map((r) => (r.id === id ? { ...r, status: "open" } : r))
  emit()
}

/** `dd-MM-yyyy HH:mm` for an ISO time, the format OCC's records carry */
const stampOf = (iso: string) => {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * Jobs the ELPREMAR has started from this tablet. OCC books maintenance
 * straight into In Progress, so until the engineer presses Start on site the
 * job reads as Open in EVITA.
 */
let started = new Set(loadSnapshot<string[]>("maintenance-started") ?? [])
export const useStartedMaintenance = () => useSyncExternalStore(subscribe, () => started)

/**
 * Start (or restart) work on site. A fresh job opens an empty record with the
 * first time-log entry; a job OCC sent back keeps what was recorded, returns
 * to In Progress and gets a new entry.
 */
export function startMaintenance(id: string, by: string) {
  const detail = details[id]
  const now = new Date().toISOString()
  const rework = rows.find((r) => r.id === id)?.status === "rejected"
  const timeLog = rework ? [...(detail.timeLog ?? []), { start: now }] : [{ start: now }]

  details = {
    ...details,
    [id]: rework
      ? { ...detail, timeLog, execution: detail.execution && { ...detail.execution, endedAt: undefined } }
      : {
          ...detail,
          timeLog,
          execution: { performedBy: by, mode: detail.execution?.mode ?? "Online / In-Service", startedAt: stampOf(now), notes: "" },
          products: [],
          evidence: [],
          firePrevention: undefined,
          pdMitigation: undefined,
          review: undefined,
        },
  }
  rows = rows.map((r) => (r.id === id ? { ...r, status: "in_progress" } : r))
  started = new Set(started).add(id)
  saveSnapshot("maintenance-started", [...started])
  emit()
}

/** Pause or finish a stretch of work: close the open time-log entry */
export function stopMaintenanceClock(id: string) {
  const detail = details[id]
  const now = new Date().toISOString()
  const timeLog = (detail.timeLog ?? []).map((e, i, all) => (i === all.length - 1 && !e.end ? { ...e, end: now } : e))
  details = { ...details, [id]: { ...detail, timeLog, execution: detail.execution && { ...detail.execution, endedAt: stampOf(now) } } }
  emit()
}

/** Back to work after a pause: a new time-log entry starts */
export function resumeMaintenanceClock(id: string) {
  const detail = details[id]
  details = {
    ...details,
    [id]: { ...detail, timeLog: [...(detail.timeLog ?? []), { start: new Date().toISOString() }], execution: detail.execution && { ...detail.execution, endedAt: undefined } },
  }
  emit()
}
