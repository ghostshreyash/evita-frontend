import { useSyncExternalStore } from "react"

import { inspectionDetail, type InspectionDetail } from "@/data/inspection-detail"
import { inspectionActivities, type TaskRow } from "@/data/occ-tables"
import { loadSnapshot, saveSnapshot, stampNow } from "@/data/persist"

/**
 * One copy of the inspection queue plus the test record behind each row, shared
 * by the list and the details screen. Stands in for the query cache until these
 * rows come from the API.
 *
 * Same store as occ-frontend's, plus the field-side mutations EVITA makes: the
 * ELPREMAR starts the task, records readings and evidence, and submits it.
 */
type Snapshot = { rows: TaskRow[]; details: Record<string, InspectionDetail> }

const saved = loadSnapshot<Snapshot>("inspections")
let rows: TaskRow[] = saved?.rows ?? inspectionActivities
let details: Record<string, InspectionDetail> = saved?.details ?? Object.fromEntries(rows.map((r) => [r.id, inspectionDetail(r)]))

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
const emit = () => {
  saveSnapshot("inspections", { rows, details } satisfies Snapshot)
  listeners.forEach((listener) => listener())
}

export const useInspectionRows = () => useSyncExternalStore(subscribe, () => rows)

export const useInspectionDetails = () => useSyncExternalStore(subscribe, () => details)

export const findInspection = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

export function updateInspection(id: string, patch: Partial<TaskRow>) {
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
  // A reassignment changes who the record says performed the work, until it is re-executed
  if (patch.elpremar && details[id]?.execution)
    details = { ...details, [id]: { ...details[id], execution: { ...details[id].execution!, performedBy: patch.elpremar } } }
  emit()
}

/* ---------- Field-side (EVITA) ---------- */

/** The ELPREMAR arrives and starts the task: the clock starts and the sheet opens empty */
export function startInspection(id: string, by: string) {
  rows = rows.map((r) => (r.id === id ? { ...r, status: "in_progress" } : r))
  details = {
    ...details,
    [id]: {
      ...details[id],
      execution: { performedBy: by, startedAt: stampNow(), remarks: "" },
      measurements: [],
      observations: [],
      evidence: [],
      result: undefined,
    },
  }
  emit()
}

/** Save what has been captured so far without finishing — the draft survives a refresh */
export function saveInspectionDraft(id: string, patch: Partial<InspectionDetail>) {
  details = { ...details, [id]: { ...details[id], ...patch } }
  emit()
}

/** Submit the inspection: readings are locked in and the asset is re-scored */
export function completeInspection(id: string, patch: Partial<InspectionDetail>) {
  const detail = { ...details[id], ...patch }
  details = {
    ...details,
    [id]: { ...detail, execution: detail.execution && { ...detail.execution, completedAt: stampNow() } },
  }
  rows = rows.map((r) => (r.id === id ? { ...r, status: "completed" } : r))
  emit()
}
