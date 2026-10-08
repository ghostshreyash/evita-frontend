/**
 * Everything the Inspection Activity Details screen shows beyond the list row:
 * what OCC assigned, and the testing, measurements and findings the ELPREMAR
 * actually recorded through the EVITA inspection workflow.
 *
 * Derived from the row with a seeded RNG so a given activity always reads the
 * same. Replace with GET /inspection-activities/:id later.
 *
 * Deliberately carries no INSTA CLEAN usage, mode of operation, fire-prevention
 * or PD-mitigation treatment — those belong to the maintenance workflow, and
 * only appear here as a recommended follow-up action.
 */
import type { EvidenceItem, TimelineStep } from "@/data/evidence"
import { areas, commissionDate } from "@/data/mock"
import { assetCriticality, type AssetCriticality } from "@/data/master-data"
import type { TaskRow } from "@/data/occ-tables"
import {
  angleSlotsFor,
  dustThickness,
  dustTypes,
  hygieneChecks,
  inspectionReadingsFor,
  readingKeys,
  thermalPointsFor,
  type DustThickness,
  type FpsStatus,
} from "@/data/test-template"
import { placeInPlant } from "@/data/plant-tree"
import { categoryFor } from "@/lib/asset-category"
import { emptyCapture, observationsFrom, resultsFrom, scoreCapture } from "@/lib/testing"

/** One reading from the test sheet */
export type Measurement = {
  parameter: string
  value: string
  unit: string
  /** How it was captured, and the instrument where there was one: "Thermal camera · FLIR E8" */
  source: string
  status: "Pass" | "Attention" | "Fail"
  /** EVITA: the standard limit it was judged against, from the test template */
  limit?: string
}

/** One thermography point: where the camera was pointed and the hottest reading there */
export type ThermalPoint = {
  id: string
  point: string
  /** Max temperature read off the TIC image, °C, as typed */
  maxTemp: string
}

/**
 * EVITA: the structured inspection capture (Phase 1), kept beside
 * the flat `measurements` OCC reads. `measurements` and `observations` are
 * derived from it on every save, so both apps see the same record.
 */
export type InspectionCapture = {
  /** Angle slot key → id of the evidence item captured for it */
  angles: Record<string, string>
  thermal: ThermalPoint[]
  /** Ambient temperature, °C, as typed */
  ambient: string
  /** Reading key → value as typed; which keys apply depends on the asset type */
  readings: Record<string, string>
  thickness?: DustThickness
  dustTypes: string[]
  /** Hygiene check key → OK or an issue, with a note when it is an issue */
  hygiene: Record<string, { ok: boolean; note: string }>
  fps: { installed?: "Yes" | "No"; status?: FpsStatus; remarks: string }
}

/**
 * Where this record stands against the server. Draft = saved on the tablet
 * only; Pending = submitted while offline, queued for POST /sync/batch;
 * Synced = the server has it.
 */
export type SyncState = { state: "draft" | "pending" | "synced"; at?: string }

export type Severity = "Low" | "Medium" | "High" | "Critical"

/** Something the ELPREMAR saw, as distinct from something they measured */
export type Observation = {
  type: string
  value: string
  severity: Severity
  remarks: string
}

export type InspectionExecution = {
  /** May differ from the assigned ELPREMAR: whoever actually attended */
  performedBy: string
  startedAt: string
  completedAt?: string
  remarks: string
}

export type InspectionResult = {
  healthScore: number
  classification: "Healthy" | "Attention" | "Critical"
  majorFindings: string[]
  recommendedActions: string[]
  /** Drives the Schedule Maintenance action on the results card */
  maintenanceRequired: boolean
  /** EVITA: each weighted input, normalised 0–100; absent for records scored before it existed */
  breakdown?: { visual?: number; thermal?: number; fps?: number }
}

export type InspectionDetail = {
  /* --- what OCC assigned --- */
  description: string
  createdBy: string
  area: string
  /** Owning department and sub-department, from the plant's own tree */
  department: string
  subDepartment: string
  assetTag: string
  assetCategory: string
  /** How badly a failure here would hurt: High / Medium / Low */
  assetCriticality: AssetCriticality
  /** When the asset was put into service, dd-MM-yyyy */
  commissionedOn: string
  /* --- what was executed --- */
  execution?: InspectionExecution
  measurements: Measurement[]
  observations: Observation[]
  evidence: EvidenceItem[]
  result?: InspectionResult
  capture?: InspectionCapture
  sync?: SyncState
}

const supervisors = ["Priya Nair", "Rakesh Menon", "Divya Iyer", "Arun Prakash"]

/** What each activity asks of the ELPREMAR — also the SOP text shown on site */
export const instructions: Record<string, string> = {
  "Thermal Scan":
    "Scan every accessible joint and termination under load. Record hotspot and reference temperatures and flag any rise above 15 °C over ambient.",
  "Visual Inspection":
    "Inspect the enclosure, busbar chamber and terminations for contamination, corrosion, moisture ingress and physical damage. Photograph anything abnormal.",
  "Insulation Resistance Testing":
    "Isolate the feeder and record insulation resistance line-to-earth and line-to-line at 1 kV. Log ambient conditions alongside the readings.",
  "Partial Discharge Testing":
    "Sweep the panel with the PD detector at rated voltage. Record levels at each measurement point and note the location of any activity.",
  "Preventive Assessment":
    "Carry out the standard condition assessment: visual check, thermal scan and electrical readings, and score the asset against the EVITA criteria.",
  "Fire Prevention System Check":
    "Verify suppression readiness, detector function and cable-entry sealing. Record the state of every device checked.",
}

const remarks = [
  "All scheduled tests completed. Readings logged in EVITA and the asset re-scored against the current baseline.",
  "Inspection completed with the panel on load. One measurement point flagged for follow-up; everything else within limits.",
  "Testing completed after isolation. Readings stable across repeats; evidence uploaded on site.",
]

/** dd-MM-yyyy + hour → "dd-MM-yyyy HH:mm" */
const at = (date: string, hour: number, minute = 0) =>
  `${date} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

export function inspectionDetail(row: TaskRow): InspectionDetail {
  let seed = [...row.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]

  const detail: InspectionDetail = {
    description: instructions[row.activity] ?? instructions["Preventive Assessment"],
    createdBy: `${pick(supervisors)} (OCC)`,
    area: pick(areas),
    ...placeInPlant(row),
    assetTag: `TAG-${row.plant.slice(0, 3).toUpperCase()}-${row.id.slice(-4)}`,
    assetCategory: categoryFor(row.asset),
    assetCriticality: pick(assetCriticality),
    commissionedOn: commissionDate(random),
    measurements: [],
    observations: [],
    evidence: [],
  }

  // An activity that has not started has an assignment and nothing else
  if (row.status === "pending") return detail

  const standIn = random() < 0.25
  const done = row.status === "completed"
  detail.execution = {
    performedBy: standIn ? `${pick(supervisors)} (stand-in)` : row.elpremar,
    startedAt: at(row.due, row.slot, Math.floor(random() * 4) * 5),
    completedAt: done ? at(row.due, row.slot + 1, Math.floor(random() * 6) * 5) : undefined,
    remarks: done ? pick(remarks) : "Testing under way; readings being captured on site.",
  }

  // The Phase-1 capture, part-filled while the work is under way
  const category = categoryFor(row.asset)
  const capture = emptyCapture()
  const stamp = (m: number) => at(row.due, row.slot, m)
  const slots = angleSlotsFor(category).filter((x, i) => (done ? x.required || random() < 0.6 : i < 2))
  for (const [i, slot] of slots.entries()) {
    const id = `${row.id}-${slot.key}`
    capture.angles[slot.key] = id
    detail.evidence.push({ id, kind: "photo", label: slot.label, caption: `${row.asset}, ${slot.label.toLowerCase()}`, meta: stamp(5 + i * 2), slot: slot.key })
  }
  capture.ambient = String(31 + Math.floor(random() * 6))
  const points = thermalPointsFor(category).slice(0, done ? 3 + Math.floor(random() * 2) : 1)
  for (const [i, point] of points.entries()) {
    // Mostly a few degrees over ambient, with the odd warm joint
    const rise = random() < 0.2 ? 11 + Math.floor(random() * 14) : 2 + Math.floor(random() * 7)
    const id = `${row.id}-tp${i + 1}`
    capture.thermal.push({ id, point, maxTemp: String(Number(capture.ambient) + rise) })
    detail.evidence.push({ id: `${id}-img`, kind: "thermal", label: `${point} (thermal)`, caption: `Max ${Number(capture.ambient) + rise} °C`, meta: stamp(20 + i * 3), slot: id })
  }
  /*
   * The electrical readings the asset type is inspected for. Values are
   * plausible rather than meaningful: a voltage reads near 415 or 11000
   * depending on the unit, a current in the low hundreds. The mandatory ones
   * are always filled, so a completed record never looks half-taken.
   */
  for (const spec of inspectionReadingsFor(category)) {
    if (!done && !spec.required) continue
    for (const key of readingKeys(spec)) {
      const base =
        spec.unit === "Hz" ? 50 : spec.unit === "A" ? 120 + Math.floor(random() * 180) : spec.key.includes("Earth") ? Math.floor(random() * 4) : 415
      capture.readings[key] = spec.unit === "Hz" ? (49.8 + random() * 0.4).toFixed(1) : String(base + Math.floor(random() * 6))
    }
  }

  if (done) {
    capture.thickness = pick(dustThickness)
    capture.dustTypes = random() < 0.7 ? [pick(dustTypes)] : []
    for (const c of hygieneChecks) {
      const ok = random() > 0.15
      capture.hygiene[c.key] = { ok, note: ok ? "" : "Corrected on site where possible; rest listed for maintenance." }
    }
    const installed = random() < 0.7
    capture.fps = installed
      ? { installed: "Yes", status: random() < 0.8 ? "Healthy / Normal" : "Alarming", remarks: "Aerosol suppression module, panel-mounted" }
      : { installed: "No", remarks: "" }
  }
  const ids = new Set(detail.evidence.map((e) => e.id))
  detail.capture = capture
  detail.measurements = resultsFrom(capture, category, ids)
  detail.observations = observationsFrom(capture)
  detail.sync = done ? { state: "synced", at: detail.execution.completedAt } : { state: "draft", at: stamp(30) }
  if (done) detail.result = scoreCapture(capture)

  return detail
}

/**
 * The inspection lifecycle as it stands. Steps with no timestamp have not
 * happened yet, which is how the screen greys them out.
 */
export function inspectionTimeline(row: TaskRow, detail: InspectionDetail): TimelineStep[] {
  const { execution, measurements, evidence, result } = detail
  return [
    { step: "Task assigned", at: at(row.due, Math.max(9, row.slot - 1)), note: `${detail.createdBy} → ${row.elpremar}` },
    { step: "Inspection started", at: execution?.startedAt, note: execution && `Performed by ${execution.performedBy}` },
    {
      step: "Testing / measurements captured",
      at: measurements.length ? at(row.due, row.slot, 30) : undefined,
      note: measurements.length ? `${measurements.length} readings` : undefined,
    },
    {
      step: "Evidence uploaded",
      at: evidence.length ? at(row.due, row.slot, 45) : undefined,
      note: evidence.length ? `${evidence.length} items` : undefined,
    },
    { step: "Inspection completed", at: execution?.completedAt, note: execution?.completedAt ? `Performed by ${execution.performedBy}` : undefined },
    {
      step: "Health assessment updated",
      at: result ? at(row.due, row.slot + 2) : undefined,
      note: result && `Score ${result.healthScore} · ${result.classification}`,
    },
  ]
}
