/**
 * The Testing & Measurements template: what an ELPREMAR records for an asset,
 * how each item is captured, and the limits it is judged against.
 *
 * Scope follows the client's answers (Requirement sheet, Queries 32–35, 40, 59):
 * Phase 1 captures asset images at multiple angles, thermography at multiple
 * points and the fire prevention system, plus the contamination and physical
 * hygiene assessment the Asset Health Report is built from. Electrical
 * parameters and Partial Discharge are Phase 2: shown as locked sections so the
 * screen and the data model already have room for them.
 *
 * Stands in for `GET /api/v1/master-data` (parameter templates per Asset Type).
 * Every limit below is a working placeholder: the client was explicit that the
 * software must not invent engineering limits, so these live here as
 * configuration, flagged for OLIVINE to approve, and the backend will serve the
 * approved values per Asset Type without a code change.
 */

/** How a value reaches the record; manual and device values pass the same rules */
export type CaptureMethod = "Camera" | "Thermal camera" | "Manual entry" | "Device (Bluetooth)" | "Derived"

/** Pass / Warning / Critical, stored as the Pass / Attention / Fail OCC already reads */
export type ResultStatus = "Pass" | "Attention" | "Fail"

export const resultLabel: Record<ResultStatus, string> = { Pass: "Pass", Attention: "Warning", Fail: "Critical" }

/** Pill colours for a result, shared by the capture screen and the Test Results table */
export const resultPill: Record<ResultStatus, string> = {
  Pass: "bg-healthy-soft text-healthy",
  Attention: "bg-attention-soft text-attention",
  Fail: "bg-critical-soft text-critical",
}

/* ---------- 1. Asset images at multiple angles ---------- */

export type AngleSlot = { key: string; label: string; required: boolean }

const commonAngles: AngleSlot[] = [
  { key: "front", label: "Front View", required: true },
  { key: "left", label: "Left Side View", required: true },
  { key: "right", label: "Right Side View", required: true },
  { key: "top", label: "Top View", required: false },
  { key: "panel", label: "Control Panel / Accessories", required: false },
  { key: "nameplate", label: "Nameplate", required: false },
]

/** Extra views that matter for some asset types (the rest use the common six) */
const extraAngles: { match: RegExp; slots: AngleSlot[] }[] = [
  { match: /transformer/i, slots: [{ key: "bushings", label: "Bushings / Terminals", required: false }] },
  {
    match: /panel|mcc|pcc|board|db\b|switchgear|busbar/i,
    slots: [
      { key: "busbar", label: "Busbar Chamber", required: false },
      { key: "glands", label: "Cable Entry / Glands", required: false },
    ],
  },
]

export function angleSlotsFor(category: string): AngleSlot[] {
  return [...commonAngles, ...(extraAngles.find((e) => e.match.test(category))?.slots ?? [])]
}

/* ---------- 2. Thermography at multiple points ---------- */

/** Points offered for one tap; the ELPREMAR can name any other point */
export function thermalPointsFor(category: string): string[] {
  if (/transformer/i.test(category)) return ["HV Bushings", "LV Bushings", "Cable Box", "Tank Body"]
  if (/ups|battery|inverter|charger/i.test(category)) return ["Input Terminals", "Output Terminals", "Battery Links"]
  return ["Incomer Terminations", "Busbar Chamber", "Outgoing Feeders", "Cable Terminations"]
}

/** At least this many thermal points for a valid thermography record */
export const MIN_THERMAL_POINTS = 2

/**
 * Temperature rise of a point over ambient (ΔT), the usual way a thermal image
 * is judged. PLACEHOLDER limits pending OLIVINE approval.
 */
export const deltaTLimit = { warning: 10, critical: 20, text: "ΔT ≤ 10 °C" }

export function judgeDeltaT(dt: number): ResultStatus {
  if (dt > deltaTLimit.critical) return "Fail"
  if (dt > deltaTLimit.warning) return "Attention"
  return "Pass"
}

/* ---------- 3. Contamination (feeds the Contamination Report) ---------- */

export const dustThickness = ["< 1 mm", "1–3 mm", "> 3 mm"] as const
export type DustThickness = (typeof dustThickness)[number]

export const dustTypes = [
  "Dry dust",
  "Conductive / metallic dust",
  "Oily / greasy deposit",
  "Moisture / damp",
  "Chemical / corrosive",
  "Insect / rodent nesting",
] as const

/** Low / Medium / High, the scale the Asset Health Report shows */
export type ContaminationLevel = "Low" | "Medium" | "High"

/** Types that make even a thin layer serious, because they conduct or corrode */
const severeTypes = new Set<string>(["Conductive / metallic dust", "Moisture / damp", "Chemical / corrosive"])

/**
 * Deterministic rule: thickness sets the level, and a conductive, damp or
 * corrosive deposit raises it one step. AI image analysis (backend) may later
 * suggest a level, but advises only — it never overrides this rule.
 */
export function contaminationLevel(thickness?: DustThickness, types: readonly string[] = []): ContaminationLevel | undefined {
  if (!thickness) return undefined
  const base = thickness === "< 1 mm" ? 0 : thickness === "1–3 mm" ? 1 : 2
  const level = Math.min(2, base + (types.some((t) => severeTypes.has(t)) ? 1 : 0))
  return (["Low", "Medium", "High"] as const)[level]
}

/* ---------- 4. Physical hygiene (feeds the Hygiene Report; no score in Phase 1) ---------- */

export const hygieneChecks = [
  { key: "hanging", label: "Hanging cables / wires" },
  { key: "ducts", label: "Cable ducts" },
  { key: "joints", label: "Cable joints" },
  { key: "lugs", label: "Thimbles / lugs" },
  { key: "door", label: "Panel door & lock" },
  { key: "glands", label: "Cable glands" },
  { key: "dressing", label: "Cable dressing & routing" },
  { key: "housekeeping", label: "Housekeeping & safety signage" },
] as const

/* ---------- 5. Fire prevention system ---------- */

/** The client's Fire Prevention Status master, for an installed system */
export const fpsStatuses = ["Healthy / Normal", "Alarming", "At Risk", "Not Tested"] as const
export type FpsStatus = (typeof fpsStatuses)[number]

/* ---------- Phase 2: shown locked so the template already has room ---------- */

export const phase2Parameters = [
  { label: "Partial Discharge", unit: "dB", method: "Device (Bluetooth)" },
  { label: "Voltage", unit: "V / kV", method: "Device / Manual" },
  { label: "Load Current", unit: "A", method: "Device / Manual" },
  { label: "Frequency", unit: "Hz", method: "Device / Manual" },
  { label: "Power Factor", unit: "—", method: "Device / Manual" },
  { label: "Current THD", unit: "%", method: "Device / Manual" },
  { label: "Insulation Resistance", unit: "MΩ", method: "Device / Manual" },
  { label: "Earth Resistance", unit: "Ω", method: "Device / Manual" },
  { label: "Humidity", unit: "%", method: "Manual entry" },
] as const

/* ---------- Health score inputs ---------- */

/**
 * Each input normalised to 0–100 before the weights in master-data
 * (`healthScoreWeights`: Visual Contamination 70, Thermal 20, Fire Prevention 10)
 * are applied. PLACEHOLDER normalisation pending OLIVINE approval.
 */
export const contaminationScore: Record<ContaminationLevel, number> = { Low: 100, Medium: 60, High: 25 }
export const thermalScore: Record<ResultStatus, number> = { Pass: 100, Attention: 60, Fail: 20 }
/** Not installed scores 0: the asset has no protection, which is itself the finding */
export const fpsScore: Record<FpsStatus | "Not Installed", number> = {
  "Healthy / Normal": 100,
  "Alarming": 50,
  "At Risk": 0,
  "Not Tested": 50,
  "Not Installed": 0,
}
