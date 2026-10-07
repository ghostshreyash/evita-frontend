import { useSyncExternalStore } from "react"

import { inspectionDetail, type InspectionDetail } from "@/data/inspection-detail"
import { inspectionActivities, type TaskRow } from "@/data/occ-tables"
import { loadSnapshot, saveSnapshot, stampNow } from "@/data/persist"
import { emptyCapture } from "@/lib/testing"

/**
 * One copy of the inspection queue plus the test record behind each row, shared
 * by the list and the details screen. Stands in for the query cache until these
 * rows come from the API.
 *
 * Same store as occ-frontend's, plus the field-side mutations EVITA makes: the
 * ELPREMAR starts the task, records readings and evidence, and submits it.
 */
type Snapshot = { rows: TaskRow[]; details: Record<string, InspectionDetail> }

// v2: records now carry the structured Testing & Measurements capture
const saved = loadSnapshot<Snapshot>("inspections.v2")
let rows: TaskRow[] = saved?.rows ?? inspectionActivities
let details: Record<string, InspectionDetail> = saved?.details ?? Object.fromEntries(rows.map((r) => [r.id, inspectionDetail(r)]))

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
const emit = () => {
  saveSnapshot("inspections.v2", { rows, details } satisfies Snapshot)
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
      capture: emptyCapture(),
      result: undefined,
      sync: { state: "draft", at: stampNow() },
    },
  }
  emit()
}

/** Save what has been captured so far without finishing — the draft survives a refresh */
export function saveInspectionDraft(id: string, patch: Partial<InspectionDetail>) {
  details = { ...details, [id]: { ...details[id], ...patch, sync: { state: "draft", at: stampNow() } } }
  emit()
}

/**
 * Submit the inspection: readings are locked in and the asset is re-scored.
 * Offline, the record is queued (Pending sync) and goes up when the tablet
 * reconnects — the stand-in for POST /sync/batch.
 */
export function completeInspection(id: string, patch: Partial<InspectionDetail>) {
  const detail = { ...details[id], ...patch }
  const now = stampNow()
  details = {
    ...details,
    [id]: {
      ...detail,
      execution: detail.execution && { ...detail.execution, completedAt: now },
      sync: navigator.onLine ? { state: "synced", at: now } : { state: "pending", at: now },
    },
  }
  rows = rows.map((r) => (r.id === id ? { ...r, status: "completed" } : r))
  emit()
}

/** Back online: everything queued while offline is sent */
function flushPending() {
  const queued = Object.entries(details).filter(([, d]) => d.sync?.state === "pending")
  if (!queued.length) return
  const now = stampNow()
  details = { ...details, ...Object.fromEntries(queued.map(([id, d]) => [id, { ...d, sync: { state: "synced" as const, at: now } }])) }
  emit()
}
if (typeof window !== "undefined") window.addEventListener("online", flushPending)
