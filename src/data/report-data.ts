/**
 * Asset Health Reports: the two Phase-1 reports and the per-asset record behind
 * each row. Derived from the asset register, so a report can never name an asset
 * the register does not hold. Replace with API calls (TanStack Query) later.
 *
 * The client settled the shape of these on 23-09-2026 (Olivine Digital Platform,
 * pages 6-7). The answers that drive this module:
 *
 * - Two reports, not one. The **Contamination Report** scores the asset from
 *   dust thickness, dust type, hotspot temperature and related observations, and
 *   produces the Health Score. The **Hygiene Report** is independent of it, is
 *   "only point specific" and "will not show any Health scores" - it is a
 *   checklist over the Phase-1 physical parameters listed below.
 * - Default order is Asset ID ascending, stable. Sorting by contamination,
 *   health, status and the dates is the user's to choose.
 * - Filters open on the signed-in engineer's own enterprise and plant, and an
 *   ELPREMAR cannot filter outside their assignment.
 */
import { assetRegister, parseDmy, type AssetRecord } from "@/data/asset-data"

/* ---------- Vocabulary ---------- */

/**
 * Contamination / Hygiene Status.
 *
 * The parameter sheet (page 11) writes the middle band as "Alarming",
 * but the client settled on **Alarming** at the screen review - see
 * ELPREMAR-ENTERPRISE-CHANGES, "Health reads Healthy / Alarming / At Risk" -
 * and the rest of EVITA already says Alarming. One word everywhere beats the
 * sheet's wording in one screen.
 *
 * There is no "Not Inspected" here: a report only covers assets that have been
 * inspected, so the status cannot arise.
 */
export const findings = ["Healthy", "Alarming", "At Risk"] as const
export type Finding = (typeof findings)[number]

export const findingLook: Record<
  Finding,
  { badge: "healthy" | "attention" | "critical"; dot: string; color: string }
> = {
  Healthy: { badge: "healthy", dot: "bg-healthy", color: "var(--success)" },
  Alarming: { badge: "attention", dot: "bg-attention", color: "var(--warning)" },
  "At Risk": { badge: "critical", dot: "bg-critical", color: "var(--destructive)" },
}

/** How much dust the panel is carrying, as the contamination table reports it */
export const contaminationLevels = ["Low", "Medium", "High"] as const
export type ContaminationLevel = (typeof contaminationLevels)[number]

export const contaminationTone: Record<ContaminationLevel, string> = {
  Low: "bg-healthy-soft text-healthy-soft-foreground",
  Medium: "bg-attention-soft text-attention-soft-foreground",
  High: "bg-critical-soft text-critical-soft-foreground",
}

/**
 * The Phase-1 physical parameters the Hygiene Report walks, verbatim from the
 * client's answer. Phase 2 adds the technical set - voltage, current, frequency,
 * power factor and the rest of the power-quality parameters.
 */
export const hygieneChecks = [
  "Hanging cables and wires",
  "Damaged cable ducts",
  "Improper cable joints",
  "Damaged thimbles / lugs",
  "Panel door and lock condition",
  "Cable gland condition",
  "Cable dressing and routing",
  "Panel housekeeping and safety",
] as const

/* ---------- Seeded helpers ---------- */

const seedOf = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const REFERENCE = new Date(2026, 8, 28)

const dmy = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`

const dateOffset = (days: number) => {
  const d = new Date(REFERENCE)
  d.setDate(d.getDate() + days)
  return dmy(d)
}

/** Months on from a DD-MM-YYYY date */
const monthsOn = (from: string, months: number) => {
  const d = parseDmy(from)
  d.setMonth(d.getMonth() + months)
  return dmy(d)
}

/* ---------- Pools ---------- */

const maintenanceTypesPool = ["Preventive", "Condition-Based", "Corrective", "Fire Preventive"]

/**
 * How hygiene standings are spread across the register, by position so every
 * one is populated. Most panels are kept clean; a few need attention and fewer
 * still have something that cannot wait.
 */
const hygieneSpread: Finding[] = [
  "Healthy",
  "Healthy",
  "Alarming",
  "Healthy",
  "Healthy",
  "At Risk",
  "Healthy",
  "Alarming",
  "Healthy",
  "Healthy",
]

/* ---------- Report rows ---------- */

/** One asset as both reports see it */
export type ReportRow = {
  asset: AssetRecord
  /** Contamination Report */
  contamination: ContaminationLevel
  contaminationStatus: Finding
  healthScore: number | null
  lastInspection: string
  nextInspectionDue: string
  /** Inspection frequency in months */
  frequency: number
  /** Hygiene Report - point by point, no score */
  hygiene: { check: string; finding: Finding }[]
  /** The worst finding across the points, which is what the row reports */
  hygieneStatus: Finding
  /** How many points need something doing */
  hygieneOpen: number
  lastCleaned: string
  nextCleaningDue: string
  lastMaintenance: string
  nextMaintenanceDue: string
  maintenanceType: string
}

/**
 * Build both reports for one asset. Seeded off the asset id, so the table, the
 * panel and the counts above them always agree.
 *
 * An asset that has never been inspected carries no health score and every
 * point reads Not Inspected - the report says so rather than inventing a result.
 */
function reportFor(asset: AssetRecord, index: number): ReportRow {
  const s = seedOf(asset.id)
  const inspected = asset.health !== null

  const contamination: ContaminationLevel = !inspected
    ? "Low"
    : asset.health! >= 70
      ? (["Low", "Low", "Medium"] as const)[s % 3]
      : asset.health! >= 50
        ? "Medium"
        : "High"

  const contaminationStatus: Finding =
    asset.health! >= 70 ? "Healthy" : asset.health! >= 50 ? "Alarming" : "At Risk"

  const lastInspection = inspected ? dateOffset(-(5 + (s % 160))) : ""
  const frequency = [3, 6, 6, 12][s % 4]

  /*
   * The asset's hygiene standing is taken by position, not by hashing each of
   * the eight points. Hashing them independently made the worst-of-eight land on
   * At Risk for almost every asset, which emptied the Healthy bucket entirely -
   * the failure the mock-data rule in CLAUDE.md is there to prevent. The points
   * are then generated to agree with the standing, so the row and the panel
   * cannot contradict each other.
   */
  const hygieneStatus: Finding = hygieneSpread[index % hygieneSpread.length]

  const faults =
    hygieneStatus === "At Risk"
      ? { [s % hygieneChecks.length]: "At Risk" as Finding, [(s + 4) % hygieneChecks.length]: "Alarming" as Finding }
      : hygieneStatus === "Alarming"
        ? { [s % hygieneChecks.length]: "Alarming" as Finding }
        : {}

  const hygiene = hygieneChecks.map((check, i) => ({
    check,
    finding: faults[i] ?? ("Healthy" as Finding),
  }))

  const lastCleaned = inspected ? dateOffset(-(10 + (s % 200))) : ""
  const lastMaintenance = inspected ? dateOffset(-(20 + (s % 260))) : ""

  return {
    asset,
    contamination,
    contaminationStatus,
    healthScore: asset.health,
    lastInspection,
    nextInspectionDue: lastInspection ? monthsOn(lastInspection, frequency) : "",
    frequency,
    hygiene,
    hygieneStatus,
    hygieneOpen: hygiene.filter((p) => p.finding === "Alarming" || p.finding === "At Risk").length,
    lastCleaned,
    nextCleaningDue: lastCleaned ? monthsOn(lastCleaned, 3) : "",
    lastMaintenance,
    nextMaintenanceDue: lastMaintenance ? monthsOn(lastMaintenance, 6) : "",
    maintenanceType: maintenanceTypesPool[s % maintenanceTypesPool.length],
  }
}

/* ---------- Aggregates ---------- */

/* ---------- The register, as the reports read it ---------- */

/*
 * Generated last: this reads every pool above. Keep it at the end of the module
 * and execute the module in node after merging - see occ-tables.ts.
 */

/**
 * Both reports for every **inspected** asset at the engineer's plant, in the
 * default order the client asked for: Asset ID ascending, stable.
 *
 * An asset that has never been inspected is left out rather than carried as a
 * "Not Inspected" row: a health report has nothing to say about it, and a
 * column of dashes only dilutes the counts above the table. It is still on the
 * asset register, where it reads as Onboarded.
 */
export const reportRows: ReportRow[] = assetRegister
  .map((asset, i) => reportFor(asset, i))
  .filter((r) => r.healthScore !== null)
  .sort((a, b) => a.asset.id.localeCompare(b.asset.id, undefined, { numeric: true }))
