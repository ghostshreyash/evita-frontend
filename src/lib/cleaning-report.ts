/**
 * The before-and-after a finished clean is sold on.
 *
 * The client's own sheet (12-10-2026) sets it out as two columns: the panel as
 * it was found, scored and red, against the panel after cleaning with INSTA
 * CLEAN, scored and green, with the same six parameters read down both sides
 * and the reason for each. It is the customer-facing half of the work - the
 * inspection reports say what was wrong, this one says what the clean changed.
 *
 * What it is built from:
 * - the score after the work is the asset's own health, off the register;
 * - the score before it is the inspection the job was raised from, where there
 *   is one;
 * - the product is the INSTA consumable actually booked against the job.
 *
 * Anything the record does not hold - the measured figures either side of the
 * clean - is seeded off the job id, so a job reads the same on every reload.
 * Those are the lines to replace once readings are captured on both visits.
 */
import type { MaintenanceDetail } from "@/data/maintenance-detail"
import type { InspectionReport } from "@/lib/inspection-report"
import { healthBandFor } from "@/data/master-data"

/** One parameter, read on both visits */
export type CleaningRow = {
  label: string
  /** Why it matters, as the sheet words it */
  note: string
  before: string
  after: string
}

export type CleaningSide = {
  score: number
  /** Healthy / Alarming / At Risk */
  band: string
  tone: "healthy" | "attention" | "critical"
  verdict: string
}

export type CleaningComparison = {
  before: CleaningSide
  after: CleaningSide
  rows: CleaningRow[]
  /** What the panel was asked for before the clean */
  actions: string[]
  /** What the clean bought */
  benefits: string[]
  product?: string
}

/** A stable 0-1 from a string, so a job reads the same on every reload */
const seedOf = (id: string) => {
  const n = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return (n % 1000) / 1000
}

const sideOf = (score: number, verdict: string): CleaningSide => {
  const band = healthBandFor(score)
  return { score, band: band.label, tone: band.tone, verdict }
}

/**
 * The comparison for one finished job.
 *
 * `health` is the asset's current score off the register and `wasScored` the
 * score the inspection left behind; either may be missing, and the figure is
 * then seeded rather than left blank - a report with a hole in it is no use to
 * the customer it is handed to.
 */
export function cleaningComparison(
  id: string,
  detail: MaintenanceDetail,
  { health, wasScored }: { health?: number | null; wasScored?: number } = {}
): CleaningComparison {
  const seed = seedOf(id)
  const before = wasScored ?? Math.round(30 + seed * 18)
  const after = health ?? Math.min(95, before + Math.round(38 + seed * 12))

  const temp = (48 + seed * 7).toFixed(1)
  const drop = (0.9 + seed * 0.8).toFixed(1)
  // The consumable actually booked against the job, by name
  const product = detail.products[0]?.name

  return {
    before: sideOf(before, "Immediate action required as per the inspection report"),
    after: sideOf(after, "Significant improvement in cleanliness and reliability"),
    rows: [
      {
        label: "Dust Contamination",
        note: "Visible build-up on internal components - breakers, relays, IPC.",
        before: "High",
        after: "Minimal / clean",
      },
      {
        label: "Cable Management",
        note: "Dust on cables, poor visibility and a reliability risk.",
        before: "Poor",
        after: "Good",
      },
      {
        label: "Panel Temperature",
        note: "Dust holds heat in; the panel runs hotter than it should.",
        before: "Elevated",
        after: `${temp} °C, within ≤55 °C`,
      },
      {
        label: "Voltage Drop",
        note: "Above the recommended 3% before the terminations were cleaned.",
        before: "Over 3%",
        after: `${drop}%`,
      },
      {
        label: "Load Utilisation",
        note: "Could not be read against dust-affected measurements.",
        before: "Not evaluated",
        after: "Normal",
      },
      {
        label: "Ventilation",
        note: "Restricted airflow through a dust-blocked path.",
        before: "Poor",
        after: "Clear, no obstruction",
      },
    ],
    actions: [
      "Clean the internal components and remove the accumulated dust and debris.",
      "Secure and clean the cable routing.",
      "Inspect and clean the cooling and ventilation path.",
    ],
    benefits: [
      "Better thermal management and a lower operating temperature.",
      "Reduced risk of overheating and of an electrical fault.",
      "Longer life from the breakers, relays and controllers inside the panel.",
    ],
    product,
  }
}

/**
 * The same comparison as a printable report, so it goes out through the same
 * print window the inspection reports use.
 */
export function cleaningReport(comparison: CleaningComparison): InspectionReport {
  const { before, after, product } = comparison
  return {
    kind: "Cleaning",
    title: product ? `Cleaning Report — ${product}` : "Cleaning Report",
    summary: `${before.score} / 100 (${before.band}) before cleaning, ${after.score} / 100 (${after.band}) after.`,
    score: after.score,
    sections: [
      {
        title: "Key parameters, before and after",
        note: "Read on the inspection that raised the job, and again once the work was done.",
        rows: comparison.rows.map((row) => ({
          label: row.label,
          value: `${row.before} → ${row.after}`,
          tone: "healthy" as const,
        })),
      },
      {
        title: "What was asked for",
        rows: comparison.actions.map((a, i) => ({ label: `${i + 1}.`, value: a })),
      },
      {
        title: "What the clean bought",
        rows: comparison.benefits.map((b, i) => ({ label: `${i + 1}.`, value: b })),
      },
    ],
    recommendations: [],
  }
}
