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

// v5: inspection ids read INS-, not TSK- — an old snapshot would bring the task ids back
const saved = loadSnapshot<Snapshot>("inspections.v5")
let rows: TaskRow[] = saved?.rows ?? inspectionActivities
let details: Record<string, InspectionDetail> = saved?.details ?? Object.fromEntries(rows.map((r) => [r.id, inspectionDetail(r)]))

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
const emit = () => {
  saveSnapshot("inspections.v5", { rows, details } satisfies Snapshot)
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
/**
 * Raise an inspection on the spot, against an asset the engineer is standing
 * at, and start it.
 *
 * An inspection is not an assigned task. The client was explicit on
 * 12-10-2026: an ELPREMAR walks up to a panel, onboards it or scans its label,
 * and inspects it - "yeh pura task usne apne marzi se kiya". An assignment
 * puts a visit on the book; it is not what permits the work.
 *
 * Returns the new id so the caller can open it.
 */
export function addInspectionForAsset(
  asset: { id: string; name: string; category: string; plant: string; enterprise: string; area: string },
  by: string
) {
  // INS-, not TSK-: an inspection is not a task, and the id is read on site
  const id = `INS-${9000 + rows.filter((r) => r.id.startsWith("INS-9")).length}`
  const today = stampNow().split(" ")[0]
  const row: TaskRow = {
    id,
    elpremar: by,
    enterprise: asset.enterprise,
    plant: asset.plant,
    asset: asset.name,
    country: "India",
    activity: "Visual Inspection",
    due: today,
    slot: new Date().getHours(),
    priority: "Medium",
    status: "in_progress",
  }
  rows = [row, ...rows]
  details = {
    ...details,
    [id]: {
      ...inspectionDetail(row),
      // Raised at the asset, so what it is and where it stands are known
      area: asset.area,
      assetTag: asset.id,
      assetCategory: asset.category,
      createdBy: `${by} (ELPREMAR)`,
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
  return id
}

/**
 * Take the inspection again, to correct one that went in wrongly.
 *
 * A new record rather than an edit of the old one: the submitted inspection is
 * what OCC and the customer have already been shown, and a record that can be
 * rewritten after the fact is not a record. The new one opens with everything
 * the last one captured - readings, contamination, hygiene, fire prevention and
 * the images - so the engineer changes what was wrong and leaves the rest, and
 * the two are linked so the old one reads as replaced rather than as current.
 *
 * Returns the new inspection's id.
 */
export function reinspect(id: string, by: string) {
  const previous = details[id]
  const row = rows.find((r) => r.id === id)
  if (!previous || !row) return undefined

  const fresh = `INS-${9000 + rows.filter((r) => r.id.startsWith("INS-9")).length}`
  const today = stampNow().split(" ")[0]

  rows = [
    { ...row, id: fresh, elpremar: by, due: today, slot: new Date().getHours(), status: "in_progress" },
    ...rows,
  ]
  details = {
    ...details,
    [id]: { ...previous, supersededBy: fresh },
    [fresh]: {
      ...previous,
      supersedes: id,
      supersededBy: undefined,
      createdBy: `${by} (ELPREMAR)`,
      execution: { performedBy: by, startedAt: stampNow(), remarks: previous.execution?.remarks ?? "" },
      // What was captured carries over; what was concluded from it does not
      measurements: [],
      observations: [],
      result: undefined,
      reportedAt: undefined,
      sync: { state: "draft", at: stampNow() },
    },
  }
  emit()
  return fresh
}

/** The reports have been produced; the inspection is finished */
export function markReportGenerated(id: string) {
  details = { ...details, [id]: { ...details[id], reportedAt: stampNow() } }
  emit()
}

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
