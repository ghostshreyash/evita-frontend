/**
 * Everything the Maintenance Activity Details screen shows beyond the list row:
 * what OCC originally assigned, and what the ELPREMAR actually executed.
 *
 * Derived from the row with a seeded RNG so a given activity always reads the
 * same. Replace with GET /maintenance-activities/:id later — the shapes below
 * are what that endpoint should return.
 */
import type { EvidenceItem, TimelineStep } from "@/data/evidence"
import { areas, assetCategories, commissionDate, priorities } from "@/data/mock"
import { assetCriticality, type AssetCriticality } from "@/data/master-data"
import type { MaintenanceRow } from "@/data/occ-tables"
import { slotLabel } from "@/data/occ-tables"

type Priority = (typeof priorities)[number]

/** An INSTA CLEAN consumable booked against the job */
export type InstaProduct = { name: string; quantity: number; unit: string }


export type MaintenanceReview = {
  outcome: "approved" | "rejected"
  by: string
  at: string
  remarks: string
}

/** What the ELPREMAR did on site — absent until the work actually starts */
export type Execution = {
  /** May differ from the assigned ELPREMAR: whoever actually attended */
  performedBy: string
  mode: "Online / In-Service" | "Offline / Out-of-Service"
  startedAt: string
  endedAt?: string
  notes: string
}

export type MaintenanceDetail = {
  /* --- what OCC assigned --- */
  priority: Priority
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
  execution?: Execution
  products: InstaProduct[]
  firePrevention?: { system: string; remarks: string }
  pdMitigation?: { method: string; remarks: string }
  evidence: EvidenceItem[]
  review?: MaintenanceReview
  /**
   * EVITA: every Start / Stop on site, with exact times (ISO strings), so the
   * log shows each stretch of work rather than one start and one end. OCC
   * reads `execution.startedAt` / `endedAt`, which EVITA keeps in step.
   */
  timeLog?: TimeEntry[]
}

/** One stretch of work on site: started, and stopped once the engineer pauses or finishes */
export type TimeEntry = { start: string; end?: string }

/** INSTA consumables an ELPREMAR can book against a job */
export const products = [
  { name: "INSTA CLEAN Contact Cleaner", unit: "ml" },
  { name: "INSTA CLEAN Foam Spray", unit: "can" },
  { name: "INSTA CLEAN Degreaser", unit: "L" },
  { name: "INSTA SHIELD Insulation Coating", unit: "ml" },
  { name: "INSTA DRY Moisture Absorber", unit: "kg" },
]

export const fireSystems = [
  "Aerosol fire suppression module (panel-mounted)",
  "Thermal fuse link with auto cut-off",
  "Fire retardant cable coating",
]

export const pdMethods = [
  "Corona shield application on busbar joints",
  "Insulation re-taping at termination points",
  "Busbar re-torquing to specified values",
  "Nano-coating on HT insulators",
]

const supervisors = ["Priya Nair", "Rakesh Menon", "Divya Iyer", "Arun Prakash"]

const notes = [
  "Panel cleaned and dried; all terminations re-torqued to spec. No abnormality observed after energising.",
  "Dust accumulation cleared from busbar chamber. Two loose terminations corrected and re-checked under load.",
  "Contact surfaces cleaned; insulation resistance within acceptable limits after treatment.",
  "Moisture ingress noted at cable gland; sealed and treated. Recommend follow-up inspection next cycle.",
]

const descriptions = [
  "Carry out scheduled preventive maintenance: de-dust the panel, clean contact surfaces, verify terminations and record post-work readings.",
  "Condition-based intervention following elevated thermal readings. Clean, re-torque and re-scan the affected compartment.",
  "Fire preventive maintenance round: inspect suppression readiness, apply retardant treatment and log the outcome.",
]

/** dd-MM-yyyy + hour → "dd-MM-yyyy HH:mm" */
const at = (date: string, hour: number, minute = 0) =>
  `${date} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

export function maintenanceDetail(row: MaintenanceRow): MaintenanceDetail {
  let seed = [...row.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 11)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]

  const started = row.status !== "open" || true // every row in the mock has at least started
  const finished = row.status === "open" || row.status === "assigned" || row.status === "completed" || row.status === "rejected"

  const detail: MaintenanceDetail = {
    priority: pick(priorities),
    description: pick(descriptions),
    createdBy: `${pick(supervisors)} (OCC)`,
    area: pick(areas),
    assetTag: `TAG-${row.plant.slice(0, 3).toUpperCase()}-${row.id.slice(-4)}`,
    assetCategory: pick(assetCategories),
    assetCriticality: pick(assetCriticality),
    commissionedOn: commissionDate(random),
    products: [],
    evidence: [],
  }

  if (started) {
    // Whoever actually attended: usually the assigned ELPREMAR, sometimes a stand-in
    const standIn = random() < 0.25
    detail.execution = {
      performedBy: standIn ? `${pick(supervisors)} (stand-in)` : row.elpremar,
      mode: random() < 0.55 ? "Offline / Out-of-Service" : "Online / In-Service",
      startedAt: at(row.scheduled, row.slot, Math.floor(random() * 4) * 5),
      endedAt: finished ? at(row.scheduled, row.slot + 1, Math.floor(random() * 6) * 5) : undefined,
      notes: pick(notes),
    }

    const count = 1 + Math.floor(random() * 3)
    const used = new Set<string>()
    for (let i = 0; i < count; i++) {
      const p = pick(products)
      if (used.has(p.name)) continue
      used.add(p.name)
      detail.products.push({
        name: p.name,
        quantity: p.unit === "kg" ? Number((0.2 + random()).toFixed(1)) : Math.ceil(random() * 6) * (p.unit === "ml" ? 50 : 1),
        unit: p.unit,
      })
    }
  }

  // The two add-on activities only apply to some jobs, which is what "Not performed" is for
  if (row.type === "Fire Preventive" || random() < 0.2)
    detail.firePrevention = {
      system: pick(fireSystems),
      remarks: "Installed and function-tested; tamper seal intact.",
    }
  if (random() < 0.45)
    detail.pdMitigation = {
      method: pick(pdMethods),
      remarks: "PD level re-measured after treatment and found within limits.",
    }

  if (finished) {
    detail.evidence = [
      { id: `${row.id}-p1`, kind: "photo", label: "Panel front — before", caption: `${row.asset} prior to work`, meta: at(row.scheduled, row.slot, 5) },
      { id: `${row.id}-p2`, kind: "photo", label: "Busbar chamber — after", caption: "Contact surfaces cleaned and re-torqued", meta: at(row.scheduled, row.slot + 1, 0) },
      { id: `${row.id}-t1`, kind: "thermal", label: "Thermal scan — incomer", caption: "Hotspot 46.2 °C, within limits after work", meta: at(row.scheduled, row.slot + 1, 10) },
      { id: `${row.id}-d1`, kind: "document", label: "Job completion certificate.pdf", caption: "Signed by plant electrical in-charge", meta: "412 KB" },
    ]
    if (random() < 0.5)
      detail.evidence.push({ id: `${row.id}-d2`, kind: "document", label: "Thermography report.pdf", caption: "Full scan, 14 measurement points", meta: "1.8 MB" })
  }

  if (row.status === "assigned" || row.status === "completed")
    detail.review = {
      outcome: "approved",
      by: pick(supervisors),
      at: at(row.scheduled, row.slot + 2),
      remarks:
        row.status === "completed"
          ? "Evidence verified and the activity closed out. Health report updated."
          : "Evidence complete and consistent with the scope. Approved for health report update.",
    }
  if (row.status === "rejected")
    detail.review = {
      outcome: "rejected",
      by: pick(supervisors),
      at: at(row.scheduled, row.slot + 2),
      remarks: "Thermal image is out of focus and the completion certificate is unsigned. Please re-upload both.",
    }

  return detail
}

/**
 * The maintenance lifecycle as it stands for this activity. Steps with no
 * timestamp have not happened yet, which is how the screen greys them out.
 * Every completed activity is submitted for approval, so that step is only
 * open while the ELPREMAR is still on site.
 */
export function maintenanceTimeline(row: MaintenanceRow, detail: MaintenanceDetail): TimelineStep[] {
  const { execution, evidence, review } = detail
  // Everything that has finished goes to OCC; only work still in the field has not
  const submitted = row.status !== "in_progress"

  return [
    { step: "Task assigned", at: at(row.scheduled, Math.max(9, row.slot - 1)), note: `${detail.createdBy} → ${row.elpremar}` },
    { step: "Maintenance started", at: execution?.startedAt, note: execution && `Booked ${slotLabel(row.slot)} · ${execution.performedBy}` },
    { step: "Maintenance completed", at: execution?.endedAt, note: execution?.endedAt ? `Performed by ${execution.performedBy}` : undefined },
    { step: "Evidence uploaded", at: evidence.length ? evidence.at(-1)!.meta.includes(":") ? evidence.at(-1)!.meta : execution?.endedAt : undefined, note: evidence.length ? `${evidence.length} items` : undefined },
    { step: "Submitted for approval", at: submitted ? execution?.endedAt : undefined },
    {
      step: review?.outcome === "rejected" ? "Correction requested" : "Approved",
      at: review?.at,
      note: review && `${review.by} · ${review.outcome === "rejected" ? "sent back" : "approved"}`,
    },
    { step: "Health report updated", at: review?.outcome === "approved" ? at(row.scheduled, row.slot + 3) : undefined },
  ]
}
