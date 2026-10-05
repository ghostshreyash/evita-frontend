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
import { areas, assetCategories, commissionDate } from "@/data/mock"
import { assetCriticality, type AssetCriticality } from "@/data/master-data"
import type { TaskRow } from "@/data/occ-tables"

/** One reading from the test sheet */
export type Measurement = {
  parameter: string
  value: string
  unit: string
  /** The instrument that produced it, or "Manual entry" */
  source: string
  status: "Pass" | "Attention" | "Fail"
}

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
}

export type InspectionDetail = {
  /* --- what OCC assigned --- */
  description: string
  createdBy: string
  area: string
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

/** Readings that suit each activity, so a thermal scan does not report megger values */
const sheets: Record<string, Measurement[]> = {
  "Thermal Scan": [
    { parameter: "Hotspot temperature", value: "46.2", unit: "°C", source: "FLIR E8 TIC", status: "Pass" },
    { parameter: "Reference temperature", value: "33.8", unit: "°C", source: "FLIR E8 TIC", status: "Pass" },
    { parameter: "Temperature rise over ambient", value: "12.4", unit: "°C", source: "Derived", status: "Pass" },
    { parameter: "Load current at scan", value: "248", unit: "A", source: "Clamp meter Fluke 376", status: "Pass" },
    { parameter: "Ambient temperature", value: "33.8", unit: "°C", source: "Manual entry", status: "Pass" },
  ],
  "Insulation Resistance Testing": [
    { parameter: "Insulation resistance L-E", value: "512", unit: "MΩ", source: "Megger MIT525", status: "Pass" },
    { parameter: "Insulation resistance L-L", value: "486", unit: "MΩ", source: "Megger MIT525", status: "Pass" },
    { parameter: "Polarisation index", value: "2.4", unit: "ratio", source: "Megger MIT525", status: "Pass" },
    { parameter: "Earth continuity", value: "0.12", unit: "Ω", source: "DLRO10", status: "Pass" },
    { parameter: "Relative humidity", value: "58", unit: "%", source: "Manual entry", status: "Pass" },
  ],
  "Partial Discharge Testing": [
    { parameter: "PD level — incomer", value: "24", unit: "pC", source: "UltraTEV Plus²", status: "Pass" },
    { parameter: "PD level — busbar chamber", value: "118", unit: "pC", source: "UltraTEV Plus²", status: "Attention" },
    { parameter: "PD level — cable box", value: "31", unit: "pC", source: "UltraTEV Plus²", status: "Pass" },
    { parameter: "Operating voltage", value: "11", unit: "kV", source: "Panel meter", status: "Pass" },
  ],
  "Visual Inspection": [
    { parameter: "Enclosure integrity", value: "Satisfactory", unit: "—", source: "Manual entry", status: "Pass" },
    { parameter: "Termination tightness", value: "Within spec", unit: "Nm", source: "Torque wrench", status: "Pass" },
    { parameter: "Contamination level", value: "Moderate", unit: "—", source: "Manual entry", status: "Attention" },
    { parameter: "Cable gland sealing", value: "Intact", unit: "—", source: "Manual entry", status: "Pass" },
  ],
  "Fire Prevention System Check": [
    { parameter: "Detector response time", value: "3.8", unit: "s", source: "Test aerosol", status: "Pass" },
    { parameter: "Suppression cylinder pressure", value: "22.4", unit: "bar", source: "Gauge reading", status: "Pass" },
    { parameter: "Cable entry sealing", value: "Intact", unit: "—", source: "Manual entry", status: "Pass" },
  ],
}

const fallbackSheet: Measurement[] = [
  { parameter: "Hotspot temperature", value: "41.6", unit: "°C", source: "FLIR E8 TIC", status: "Pass" },
  { parameter: "Insulation resistance L-E", value: "398", unit: "MΩ", source: "Megger MIT525", status: "Pass" },
  { parameter: "Contact resistance", value: "18.4", unit: "µΩ", source: "DLRO10", status: "Pass" },
  { parameter: "Earth continuity", value: "0.15", unit: "Ω", source: "DLRO10", status: "Pass" },
  { parameter: "Ambient temperature", value: "31.2", unit: "°C", source: "Manual entry", status: "Pass" },
]

const findings: { type: string; value: string; severity: Severity; remarks: string }[] = [
  { type: "Visual / physical condition", value: "Minor paint blistering on the door", severity: "Low", remarks: "Cosmetic only; no effect on ingress protection." },
  { type: "Thermal abnormality", value: "Warm termination on the R-phase incomer", severity: "Medium", remarks: "12 °C above the adjacent phases. Re-torque at the next maintenance window." },
  { type: "Contamination", value: "Dust accumulation in the busbar chamber", severity: "Medium", remarks: "Reduces creepage distance. Panel cleaning recommended." },
  { type: "Corrosion", value: "Surface corrosion on the earth bar clamp", severity: "Low", remarks: "Clean and apply protective compound." },
  { type: "Moisture ingress", value: "Damp patch below the bottom cable gland", severity: "High", remarks: "Gland sealing has failed. Seal before the monsoon." },
  { type: "Wiring / terminations", value: "Two control wires without ferrules", severity: "Low", remarks: "Label and ferrule at the next opportunity." },
]

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
    assetTag: `TAG-${row.plant.slice(0, 3).toUpperCase()}-${row.id.slice(-4)}`,
    assetCategory: pick(assetCategories),
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

  const sheet = sheets[row.activity] ?? fallbackSheet
  // Work still in progress has only recorded part of the sheet so far
  detail.measurements = done ? sheet : sheet.slice(0, Math.max(1, Math.floor(sheet.length / 2)))

  // Findings only exist where there was something to report
  const count = done ? Math.floor(random() * 4) : Math.floor(random() * 2)
  const seen = new Set<string>()
  for (let i = 0; i < count; i++) {
    const f = pick(findings)
    if (seen.has(f.type)) continue
    seen.add(f.type)
    detail.observations.push(f)
  }

  detail.evidence = [
    { id: `${row.id}-p1`, kind: "photo", label: "Panel front", caption: `${row.asset} as found`, meta: at(row.due, row.slot, 5) },
    { id: `${row.id}-t1`, kind: "thermal", label: "TIC — incomer terminations", caption: "Hotspot 46.2 °C against a 33.8 °C reference", meta: at(row.due, row.slot, 25) },
  ]
  if (done) {
    detail.evidence.push(
      { id: `${row.id}-p2`, kind: "photo", label: "Busbar chamber", caption: "Contamination recorded before cleaning", meta: at(row.due, row.slot, 40) },
      { id: `${row.id}-d1`, kind: "document", label: "EVITA test sheet.pdf", caption: "Signed readings for every measurement point", meta: "308 KB" }
    )
  }

  if (done) {
    const worst = detail.observations.reduce<Severity | undefined>(
      (acc, o) => (!acc || ["Low", "Medium", "High", "Critical"].indexOf(o.severity) > ["Low", "Medium", "High", "Critical"].indexOf(acc) ? o.severity : acc),
      undefined
    )
    const flagged = detail.measurements.some((m) => m.status !== "Pass")
    const score = worst === "Critical" ? 48 : worst === "High" ? 63 : worst === "Medium" || flagged ? 78 : 93

    detail.result = {
      healthScore: score,
      classification: score >= 85 ? "Healthy" : score >= 60 ? "Attention" : "Critical",
      majorFindings: detail.observations.length
        ? detail.observations.map((o) => `${o.type}: ${o.value}`)
        : ["No abnormality found. All readings within acceptable limits."],
      recommendedActions:
        detail.observations.length || flagged
          ? [
              "Raise a condition-based maintenance activity for the flagged compartment.",
              "Re-scan under load after the intervention to confirm the reading has settled.",
            ]
          : ["No action required. Retain the present inspection interval."],
      maintenanceRequired: detail.observations.length > 0 || flagged,
    }
  }

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
