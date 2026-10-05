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

const saved = loadSnapshot<Snapshot>("maintenance")
let rows: MaintenanceRow[] = saved?.rows ?? maintenanceActivities
let details: Record<string, MaintenanceDetail> =
  saved?.details ?? Object.fromEntries(rows.map((r) => [r.id, maintenanceDetail(r)]))

const listeners = new Set<() => void>()
const emit = () => {
  saveSnapshot("maintenance", { rows, details } satisfies Snapshot)
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
      createdBy: "Admin (OCC)",
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

/** Save what has been captured so far without submitting */
export function saveMaintenanceDraft(id: string, patch: Partial<MaintenanceDetail>) {
  details = { ...details, [id]: { ...details[id], ...patch } }
  emit()
}

/** Work finished on site: stop the clock and hand it to OCC for approval */
export function submitMaintenance(id: string, patch: Partial<MaintenanceDetail>) {
  const detail = { ...details[id], ...patch }
  details = {
    ...details,
    [id]: {
      ...detail,
      execution: detail.execution && { ...detail.execution, endedAt: detail.execution.endedAt ?? stampNow() },
      // A resubmission replaces the earlier verdict
      review: undefined,
    },
  }
  rows = rows.map((r) => (r.id === id ? { ...r, status: "open" } : r))
  emit()
}

/** Pick up work OCC sent back: it returns to the field with the reviewer's remarks kept for reference */
export function reworkMaintenance(id: string) {
  const detail = details[id]
  details = { ...details, [id]: { ...detail, execution: detail.execution && { ...detail.execution, endedAt: undefined } } }
  rows = rows.map((r) => (r.id === id ? { ...r, status: "in_progress" } : r))
  emit()
}
