/**
 * The Testing & Measurements template: what an ELPREMAR records for an asset,
 * how each item is captured, and the limits it is judged against.
 *
 * Scope follows the client's answers (Requirement sheet, Queries 32–35, 40, 59):
 * Phase 1 captures asset images at multiple angles, thermography at multiple
 * points and the fire prevention system, plus the electrical readings and the
 * contamination and physical hygiene assessment the Asset Health Report is
 * built from. Which readings apply depends on the asset type, from the client's
 * inspection parameter sheet. Partial Discharge is Phase 2: the capture screen
 * keeps a disabled Partial Discharge tab so the flow and the data model already
 * have room for it.
 *
 * Stands in for `GET /api/v1/master-data` (parameter templates per Asset Type).
 * Every limit below is a working placeholder: the client was explicit that the
 * software must not invent engineering limits, so these live here as
 * configuration, flagged for OLIVINE to approve, and the backend will serve the
 * approved values per Asset Type without a code change.
 */

import { assetCategories } from "@/data/master-data"

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

/* ---------- 3. Electrical readings, per asset type ---------- */

/**
 * One reading taken at the asset. `required` follows the client's inspection
 * parameter sheet, which marks each reading mandatory, optional or not
 * applicable per asset type — see `inspectionReadingsFor`.
 */
export type ReadingSpec = {
  key: string
  label: string
  unit: string
  required: boolean
  /** Taken once per phase, so it renders as three boxes: R, Y and B */
  phases?: boolean
}

/** The three phases, as the sheet names them */
export const readingPhases = ["R", "Y", "B"] as const

/** The 34 asset types the inspection sheet has a column for, in its own order */
const readingTypes = [
  "ACB (Air Circuit Breaker)",
  "AMF Panel",
  "APFC Panel",
  "Battery Bank",
  "Battery Charger",
  "Busbar",
  "Control Panel",
  "Distribution Board (DB)",
  "Distribution Transformer",
  "Fire Alarm Panel",
  "Industrial Network Equipment",
  "Instrument Transformer (CT/PT)",
  "Inverter",
  "Lighting Distribution Board (LDB)",
  "LT Panel",
  "MCC (Motor Control Center)",
  "MCCB",
  "Network Switch",
  "Other",
  "PCC (Power Control Center)",
  "PLC Panel",
  "Power Transformer",
  "Relay Panel",
  "RTU (Remote Terminal Unit)",
  "SCADA System",
  "SF6 Circuit Breaker",
  "Soft Starter Panel",
  "Solar Combiner Box",
  "Solar Inverter",
  "Sub Distribution Board (SDB)",
  "Transformer",
  "UPS",
  "VCB (Vacuum Circuit Breaker)",
  "VFD (Variable Frequency Drive)",
]

/**
 * The sheet as one character per asset type, in `readingTypes` order:
 * M mandatory, O optional, "." not applicable. Transcribed rather than
 * restated as prose so a column can be checked against the sheet by eye.
 */
const readingRows: (Omit<ReadingSpec, "required"> & { sheet: string })[] = [
  { key: "voltage", label: "Voltage", unit: "V", sheet: "MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM" },
  { key: "phaseLoad", label: "Load Current per phase", unit: "A", phases: true, sheet: "MMM...MMM....MMMM.OMOO......MMM..." },
  { key: "frequency", label: "Frequency", unit: "Hz", sheet: "MMM...MMM...MMMMM.OMMOM..MM.MMMMMM" },
  { key: "neutralEarth", label: "Neutral–Earth Voltage", unit: "V", sheet: "OO..O.OOOOOOOOOOOOOOOOOOOOO..OOOOO" },
  { key: "bodyEarth", label: "Body–Earth Voltage", unit: "V", sheet: "OOO.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOO" },
  { key: "loadCurrent", label: "Load Current", unit: "A", sheet: "...MMM......M.........M..OMM...MOM" },
  { key: "neutralCurrent", label: "Neutral Current", unit: "A", sheet: "........O....OOO...OOOO..OO..OO.O." },
]

/**
 * Which readings this asset type is inspected for.
 *
 * A type the sheet has no column for gets no readings at all. Nothing is
 * borrowed from the "Other" column: a reading the sheet does not give for an
 * asset is not taken on that asset - see `visualOnlyTypes`.
 */
export function inspectionReadingsFor(category: string): ReadingSpec[] {
  const column = readingTypes.indexOf(category)
  if (column === -1) return []
  return readingRows
    .filter((row) => row.sheet[column] !== ".")
    .map(({ sheet, ...spec }) => ({ ...spec, required: sheet[column] === "M" }))
}

/**
 * Asset types inspected without electrical readings: images, thermal and the
 * fire prevention system only.
 *
 * Confirmed by the client on 08-10-2026. An HT Panel's parameters cannot be
 * measured reliably with the panel energised, and the instruments for them are
 * not held; a Solar Transformer is rare enough that the instruments for it are
 * not held either. Both still carry their full onboarding specification - it is
 * the inspection that is limited, not the asset record.
 */
export const visualOnlyTypes = assetCategories.filter((c) => !readingTypes.includes(c))

/** Every input key one spec contributes: a per-phase reading contributes three */
export const readingKeys = (spec: ReadingSpec) =>
  spec.phases ? readingPhases.map((p) => `${spec.key}${p}`) : [spec.key]

/** The mandatory readings still blank, by label, for the completion check */
export function missingReadings(category: string, readings: Record<string, string>): string[] {
  return inspectionReadingsFor(category)
    .filter((spec) => spec.required && readingKeys(spec).some((k) => !readings[k]?.trim()))
    .map((spec) => spec.label)
}

/* ---------- 4. Contamination (feeds the Contamination Report) ---------- */

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

/* ---------- 5. Physical hygiene (feeds the Hygiene Report; no score in Phase 1) ---------- */

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

/* ---------- 6. Fire prevention system ---------- */

/** The client's Fire Prevention Status master, for an installed system */
export const fpsStatuses = ["Healthy / Normal", "Alarming", "At Risk", "Not Tested"] as const
export type FpsStatus = (typeof fpsStatuses)[number]

/* ---------- Phase 2: what the disabled Partial Discharge tab will hold ---------- */

export const phase2Parameters = [
  { label: "Partial Discharge", unit: "dB", method: "Device (Bluetooth)" },
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
