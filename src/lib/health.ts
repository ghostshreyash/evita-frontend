import type { InspectionResult, Measurement, Observation, Severity } from "@/data/inspection-detail"
import { healthBandFor } from "@/data/master-data"

/**
 * Field estimate of the asset's health from what was recorded on site.
 *
 * TODO: the Health Score is the backend's job — the URS weights (visual
 * contamination, thermal, fire prevention, …) applied by the API across the
 * asset's whole history. Until then this gives the ELPREMAR a fair read of the
 * readings in front of them: start from 100, take points off for every reading
 * that failed or needs attention and for every observation by severity, then
 * band it with the specification's thresholds (master-data `healthBands`).
 */
const severityCost: Record<Severity, number> = { Low: 3, Medium: 10, High: 20, Critical: 35 }

export function scoreInspection(measurements: Measurement[], observations: Observation[]): InspectionResult {
  const fails = measurements.filter((m) => m.status === "Fail").length
  const attention = measurements.filter((m) => m.status === "Attention").length
  const cost = fails * 20 + attention * 8 + observations.reduce((n, o) => n + severityCost[o.severity], 0)
  const healthScore = Math.max(0, Math.min(100, 100 - cost))
  const band = healthBandFor(healthScore)
  const classification = band.tone === "healthy" ? "Healthy" : band.tone === "attention" ? "Attention" : "Critical"
  const flagged = fails + attention > 0

  return {
    healthScore,
    classification,
    majorFindings: observations.length
      ? observations.map((o) => `${o.type}: ${o.value}`)
      : flagged
        ? measurements.filter((m) => m.status !== "Pass").map((m) => `${m.parameter}: ${m.value} ${m.unit} (${m.status})`)
        : ["No abnormality found. All readings within acceptable limits."],
    recommendedActions:
      observations.length || flagged
        ? [
            "Raise a condition-based maintenance activity for the flagged compartment.",
            "Re-scan under load after the intervention to confirm the reading has settled.",
          ]
        : ["No action required. Retain the present inspection interval."],
    maintenanceRequired: observations.some((o) => o.severity !== "Low") || flagged,
  }
}

/** Band label and colours for a score, as the specification words them */
export function bandLook(score: number) {
  const band = healthBandFor(score)
  return {
    label: band.label,
    text: band.tone === "healthy" ? "text-healthy" : band.tone === "attention" ? "text-attention" : "text-critical",
    soft: band.tone === "healthy" ? "bg-healthy-soft text-healthy-soft-foreground" : band.tone === "attention" ? "bg-attention-soft text-attention-soft-foreground" : "bg-critical-soft text-critical-soft-foreground",
    stroke: band.tone === "healthy" ? "var(--success)" : band.tone === "attention" ? "var(--warning)" : "var(--destructive)",
  }
}
