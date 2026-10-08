import type { InspectionCapture, InspectionResult, Measurement, Observation } from "@/data/inspection-detail"
import { healthBandFor, healthScoreWeights } from "@/data/master-data"
import {
  contaminationLevel,
  contaminationScore,
  deltaTLimit,
  fpsScore,
  hygieneChecks,
  inspectionReadingsFor,
  judgeDeltaT,
  MIN_THERMAL_POINTS,
  missingReadings,
  readingKeys,
  readingPhases,
  thermalScore,
  type ResultStatus,
} from "@/data/test-template"

/**
 * Inspection rules: turn the structured capture into the flat test
 * results, the observations and the health score.
 *
 * Deterministic on purpose. The client's rule (Query 34) is that measured
 * values are judged by fixed engineering rules that AI never overrides; AI
 * (backend, after sync) only adds advisory findings from the images. When the
 * API exists, POST /inspections/{id}/submit runs these same rules server-side
 * and its result replaces this field estimate.
 */

/**
 * A client-generated id, the same id the offline sync sends so the server can
 * de-duplicate retries. randomUUID needs a secure context (HTTPS or
 * localhost); a tablet on a plain-HTTP LAN address falls back to a random id.
 */
export const newId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export const emptyCapture = (): InspectionCapture => ({ angles: {}, thermal: [], ambient: "", readings: {}, dustTypes: [], hygiene: {}, fps: { remarks: "" } })

const num = (v: string) => (v.trim() === "" || Number.isNaN(Number(v)) ? undefined : Number(v))

/** Each recorded thermal point with its rise over ambient and its result */
export function thermalReadings(capture: InspectionCapture) {
  const ambient = num(capture.ambient)
  return capture.thermal.map((t) => {
    const max = num(t.maxTemp)
    const dt = max !== undefined && ambient !== undefined ? Math.round((max - ambient) * 10) / 10 : undefined
    return { ...t, max, dt, status: dt !== undefined ? judgeDeltaT(dt) : undefined }
  })
}

const worst = (list: (ResultStatus | undefined)[]): ResultStatus | undefined =>
  list.includes("Fail") ? "Fail" : list.includes("Attention") ? "Attention" : list.includes("Pass") ? "Pass" : undefined

/**
 * Which Phase-1 sections are complete enough to submit.
 *
 * Contamination and hygiene are not here: the AI reads them off the images
 * after sync, so there is nothing for the ELPREMAR to complete.
 */
export function sectionsDone(capture: InspectionCapture, category: string, evidenceIds: Set<string>) {
  return {
    // As in asset onboarding: as many named images as the asset has, at least one
    images: Object.values(capture.angles).some((id) => evidenceIds.has(id)),
    // Phase 1 records the images; the temperatures are read off them after sync
    thermal: capture.thermal.length >= MIN_THERMAL_POINTS,
    readings: missingReadings(category, capture.readings).length === 0,
    fps: capture.fps.installed === "No" || (capture.fps.installed === "Yes" && !!capture.fps.status),
  }
}

/** The Test Results table: one row per value, with its limit and result */
export function resultsFrom(capture: InspectionCapture, category: string, evidenceIds: Set<string>): Measurement[] {
  const rows: Measurement[] = []
  const shot = Object.values(capture.angles).filter((id) => evidenceIds.has(id)).length
  if (shot) rows.push({ parameter: "Asset images", value: String(shot), unit: "images", source: "Camera", limit: "At least one", status: "Pass" })

  const ambient = num(capture.ambient)
  if (ambient !== undefined) rows.push({ parameter: "Ambient temperature", value: String(ambient), unit: "°C", source: "Manual entry", limit: "Reference", status: "Pass" })
  for (const r of thermalReadings(capture)) {
    if (r.max === undefined) continue
    rows.push({
      parameter: `Thermal hotspot: ${r.point}`,
      value: String(r.max),
      unit: "°C",
      source: "Thermal camera",
      limit: r.dt !== undefined ? `${deltaTLimit.text} (ΔT ${r.dt} °C)` : deltaTLimit.text,
      status: r.status ?? "Pass",
    })
  }

  /*
   * The electrical readings, in the order the sheet lists them for this asset
   * type. No limits yet: the client was explicit that the software must not
   * invent engineering limits, so a recorded reading is carried as Pass with
   * its limit left blank until OLIVINE supplies the thresholds.
   */
  for (const spec of inspectionReadingsFor(category)) {
    const parts = readingKeys(spec)
      .map((k, i) => ({ phase: spec.phases ? readingPhases[i] : "", value: capture.readings[k]?.trim() ?? "" }))
      .filter((part) => part.value !== "")
    if (!parts.length) continue
    rows.push({
      parameter: spec.label,
      value: parts.map((part) => (part.phase ? `${part.phase} ${part.value}` : part.value)).join(" / "),
      unit: spec.unit,
      source: "Manual entry",
      status: "Pass",
    })
  }

  const level = contaminationLevel(capture.thickness, capture.dustTypes)
  if (level)
    rows.push({
      parameter: "Contamination level",
      value: level,
      unit: "—",
      source: `Manual entry · ${capture.thickness}${capture.dustTypes.length ? `, ${capture.dustTypes.join(", ")}` : ""}`,
      limit: "Low",
      status: level === "Low" ? "Pass" : level === "Medium" ? "Attention" : "Fail",
    })

  const checked = hygieneChecks.filter((c) => capture.hygiene[c.key])
  if (checked.length) {
    const issues = checked.filter((c) => !capture.hygiene[c.key].ok).length
    rows.push({
      parameter: "Physical hygiene checks",
      value: `${checked.length - issues} of ${hygieneChecks.length} OK`,
      unit: "checks",
      source: "Manual entry",
      limit: "All OK",
      status: issues === 0 ? "Pass" : issues <= 2 ? "Attention" : "Fail",
    })
  }

  // Same parameter name the old form and OCC use, so existing readers keep working
  if (capture.fps.installed)
    rows.push({
      parameter: "Fire Prevention Status",
      value: capture.fps.installed === "No" ? "Not installed" : (capture.fps.status ?? "Installed"),
      unit: "—",
      source: capture.fps.remarks ? `Manual entry · ${capture.fps.remarks}` : "Manual entry",
      limit: "Installed, Healthy / Normal",
      status: capture.fps.installed === "No" || capture.fps.status === "At Risk" ? "Fail" : capture.fps.status === "Healthy / Normal" ? "Pass" : "Attention",
    })
  return rows
}

/** What the rules found, as observations OCC and the reports list */
export function observationsFrom(capture: InspectionCapture): Observation[] {
  const list: Observation[] = []
  for (const r of thermalReadings(capture))
    if (r.status && r.status !== "Pass")
      list.push({
        type: "Thermal abnormality",
        value: `${r.point}: ${r.max} °C, ${r.dt} °C over ambient`,
        severity: r.status === "Fail" ? "High" : "Medium",
        remarks: "Re-scan under load after the intervention to confirm.",
      })
  const level = contaminationLevel(capture.thickness, capture.dustTypes)
  if (level && level !== "Low")
    list.push({
      type: "Contamination",
      value: `${level} contamination (${capture.thickness}${capture.dustTypes.length ? `, ${capture.dustTypes.join(", ").toLowerCase()}` : ""})`,
      severity: level === "High" ? "High" : "Medium",
      remarks: "Cleaning recommended (INSTA CLEAN).",
    })
  for (const c of hygieneChecks) {
    const h = capture.hygiene[c.key]
    if (h && !h.ok) list.push({ type: "Visual / physical condition", value: `${c.label}: needs attention`, severity: "Medium", remarks: h.note })
  }
  if (capture.fps.installed === "No")
    list.push({ type: "Fire prevention", value: "No fire prevention system installed", severity: "Medium", remarks: capture.fps.remarks || "Fire prevention action recommended." })
  else if (capture.fps.status && capture.fps.status !== "Healthy / Normal")
    list.push({ type: "Fire prevention", value: `Fire prevention system: ${capture.fps.status}`, severity: capture.fps.status === "At Risk" ? "High" : "Medium", remarks: capture.fps.remarks })
  return list
}

/**
 * Health Score = Σ weight × input score, over the inputs that have a value.
 * Weights from master-data (Visual Contamination 70, Thermal 20, Fire
 * Prevention 10); an input not yet recorded drops out and the rest re-weight,
 * so the estimate on screen is fair while the sheet is half filled.
 */
export function scoreCapture(capture: InspectionCapture): InspectionResult {
  const level = contaminationLevel(capture.thickness, capture.dustTypes)
  const thermal = worst(thermalReadings(capture).map((r) => r.status))
  const fps = capture.fps.installed === "No" ? fpsScore["Not Installed"] : capture.fps.status ? fpsScore[capture.fps.status] : undefined
  const breakdown = {
    visual: level ? contaminationScore[level] : undefined,
    thermal: thermal ? thermalScore[thermal] : undefined,
    fps,
  }
  const weight = Object.fromEntries(healthScoreWeights.map((w) => [w.input, w.weight]))
  const parts = [
    [breakdown.visual, weight["Visual Contamination"]],
    [breakdown.thermal, weight["Thermal Condition"]],
    [breakdown.fps, weight["Fire Prevention Status"]],
  ].filter((p): p is [number, number] => p[0] !== undefined)
  const total = parts.reduce((n, [, w]) => n + w, 0)
  const healthScore = total ? Math.round(parts.reduce((n, [s, w]) => n + s * w, 0) / total) : 100
  const band = healthBandFor(healthScore)
  const observations = observationsFrom(capture)
  const recommendedActions = [
    ...(level === "High" || level === "Medium" ? [`Schedule INSTA CLEAN maintenance (${level.toLowerCase()} contamination).`] : []),
    ...(thermal && thermal !== "Pass" ? ["Re-torque and re-scan the hot terminations under load."] : []),
    ...(capture.fps.installed === "No" ? ["Install a fire prevention system on this asset."] : []),
    ...(observations.some((o) => o.type === "Visual / physical condition") ? ["Correct the physical hygiene issues listed."] : []),
  ]
  return {
    healthScore,
    classification: band.tone === "healthy" ? "Healthy" : band.tone === "attention" ? "Attention" : "Critical",
    majorFindings: observations.length ? observations.map((o) => `${o.type}: ${o.value}`) : ["No abnormality found. All values within limits."],
    recommendedActions: recommendedActions.length ? recommendedActions : ["No action required. Retain the present inspection interval."],
    maintenanceRequired: recommendedActions.length > 0,
    breakdown,
  }
}

/**
 * OCC's activity names → the client's Inspection Type master. Activities that
 * are Phase-2 tests (insulation, PD) still run the Phase-1 capture today.
 */
export function inspectionTypeFor(activity: string) {
  if (/thermal/i.test(activity)) return "Thermal Inspection"
  if (/fire/i.test(activity)) return "Fire Prevention System Inspection"
  if (/re-?inspect/i.test(activity)) return "Re-inspection"
  return "Visual Inspection"
}
