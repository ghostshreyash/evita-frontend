/**
 * What each asset type is asked for at onboarding.
 *
 * Transcribed from the client's `EVITA_Electrical_Asset_Onboarding_Parameters`
 * sheet (ONBOARDING. tab, 286 rows over 34 asset types, plus the Drop Down List
 * tab for the option lists). The electrical specification is not one fixed form:
 * an ACB is asked for a breaking capacity and a pole configuration, a battery
 * bank for its cell count and Ah rating, a solar inverter for its DC input
 * power. Only the criticality is asked of everything.
 *
 * The sheet is the authority here, including where it disagrees with the
 * mockups. Where it gives no option list for a Choice parameter, the field
 * falls back to free text - see `missingOptionLists` at the bottom.
 */
import { assetCriticality, manufacturers } from "@/data/master-data"

/* ---------- Option lists, from the Drop Down List tab ---------- */

const lists = {
  manufacturer: manufacturers,
  criticality: assetCriticality,
  pole: ["2P", "3P", "4P"],
  busbarMaterial: ["Copper", "Aluminium"],
  busbarType: ["Open", "Enclosed", "Busduct"],
  phase: ["1 Phase", "3 Phase"],
  cooling: ["ONAN", "ONAF", "OFAF", "OFWF", "Dry type", "Other"],
  firePanel: ["Conventional", "Addressable"],
  htIncomer: ["VCB", "SF6", "ACB", "Other"],
  networkKit: ["Router", "Firewall", "Media Converter", "Gateway", "Other"],
  comms: ["Ethernet", "Fiber", "Serial", "Modbus", "Other"],
  tapChanger: ["OLTC", "Off-circuit", "None"],
} as const satisfies Record<string, readonly string[]>

type ListName = keyof typeof lists

/* ---------- Shape ---------- */

export type ParamKind = "number" | "text" | "choice"

export type ParamSpec = {
  /** Stable key the form stores the answer under */
  key: string
  label: string
  required: boolean
  kind: ParamKind
  unit?: string
  /** Absent on a Choice the sheet gives no list for; the field becomes text */
  options?: readonly string[]
}

/**
 * One parameter, written as `Label|M or O|kind|unit or #list`.
 *
 * A terse table rather than 200 object literals: it stays close to the sheet it
 * was transcribed from, so the two can be compared line by line.
 */
const parse = (entry: string): ParamSpec => {
  const [label, req, kind, extra] = entry.split("|")
  const spec: ParamSpec = {
    key: label
      .replace(/[^A-Za-z0-9 ]/g, " ")
      .trim()
      .split(/\s+/)
      .map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
      .join(""),
    label,
    required: req === "M",
    kind: kind as ParamKind,
  }
  if (extra?.startsWith("#")) spec.options = lists[extra.slice(1) as ListName]
  else if (extra) spec.unit = extra
  return spec
}

/* ---------- The sheet ---------- */

/** Asked of every asset type. The two photographs it also lists are step 3's job. */
const common = ["Criticality|M|choice|#criticality"]

const byType: Record<string, string[]> = {
  "ACB (Air Circuit Breaker)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Rated Current|M|number|A",
    "Breaking Capacity|O|number|kA",
    "Pole Configuration|M|choice|#pole",
  ],
  "AMF Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Generator Rating|O|number|kVA",
    "Controller Make/Model|O|text",
  ],
  "APFC Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Total APFC Capacity|M|number|kVAr",
    "Controller Make/Model|O|text",
  ],
  "Battery Bank": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Nominal Bank Voltage|M|number|V",
    "Number of Batteries / Cells|M|number|Nos.",
    "Unit Ah Capacity|M|number|Ah",
  ],
  "Battery Charger": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Charger Capacity|M|number|A",
    "Input Voltage|M|text|V",
    "Output Voltage|O|text|V DC",
    "Battery Bank Voltage|O|number|V DC",
  ],
  Busbar: [
    "Manufacturer|M|choice|#manufacturer",
    "Busbar Rating|M|number|A",
    "Rated Voltage|M|number|V/kV",
    "Material|M|choice|#busbarMaterial",
    "Busbar Type|M|choice|#busbarType",
  ],
  "Control Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Control Voltage|M|number|V DC/AC",
    "Rated Current|O|number|A",
    "PLC/Controller Present|M|choice",
  ],
  "Distribution Board (DB)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Incomer Rating|M|number|A",
    "Enclosure IP Rating|O|text",
  ],
  "Distribution Transformer": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Power|M|number|kVA",
    "HV / LV Voltage|M|text|kV/V",
    "Phase|M|choice|#phase",
    "Impedance|O|number|%",
    "Cooling Type|O|choice|#cooling",
    "Vector Group|O|text",
  ],
  "Fire Alarm Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Panel Type|M|choice|#firePanel",
    "Connected Device Count|O|number|Nos.",
  ],
  "HT Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|kV",
    "Rated Current|M|number|A",
    "Incomer Arrangement|M|choice|#htIncomer",
    "Protection Relay Type|O|text",
  ],
  "Industrial Network Equipment": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Equipment Type|M|choice|#networkKit",
    "Make/Model|O|text",
    "Supply Voltage|M|text|V DC/AC",
    "Communication Interface|M|choice|#comms",
  ],
  "Instrument Transformer (CT/PT)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Instrument Type|M|choice",
    "Primary Rating|M|text|A or kV",
    "Secondary Rating|M|text|A or V",
    "Accuracy Class|O|choice",
    "Core / Ratio Details|O|text",
  ],
  Inverter: [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Power|M|number|kVA/MVA",
    "Rated Voltage|M|number|V",
  ],
  "Lighting Distribution Board (LDB)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Incomer Rating|M|number|A",
    "Outgoing Way Count|O|number|Nos.",
  ],
  "LT Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Rated Current|M|number|A",
    "Incomer Type|M|choice",
    "Busbar Material / Rating|M|choice",
  ],
  "MCC (Motor Control Center)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Rated Current|M|number|A",
    "Busbar Rating|O|number|A",
    "Number of Motor Feeders|O|number|Nos.",
    "Motor Starter Technology|M|choice",
  ],
  MCCB: [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Rated Current|M|number|A",
    "Trip Rating|O|number|A",
    "Breaking Capacity|O|number|kA",
    "Pole Configuration|M|choice|#pole",
  ],
  "Network Switch": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Switch Type|O|choice",
    "Power Supply|M|text|V DC/AC",
  ],
  Other: [
    "Manufacturer|O|text",
    "Model / Type|O|text",
    "Rated Voltage|O|text|V/kV",
    "Rated Power / Current|O|text|kW/kVA/A",
  ],
  "PCC (Power Control Center)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Rated Current|M|number|A",
    "Short Circuit Rating|M|number|kA",
  ],
  "PLC Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "PLC Make/Model|M|text",
    "Supply Voltage|M|text|V DC/AC",
  ],
  "Power Transformer": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Power|M|number|MVA",
    "HV / LV Voltage|M|text|kV/V",
    "Phase|M|choice|#phase",
    "Vector Group|O|text",
    "Cooling Type|O|choice|#cooling",
    "Impedance|O|number|%",
    "Tap Changer Type|O|choice|#tapChanger",
  ],
  "Relay Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "System Voltage|M|text|V/kV",
    "Relay Make/Model|O|text",
  ],
  "RTU (Remote Terminal Unit)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Supply Voltage|M|text|V DC",
  ],
  "SF6 Circuit Breaker": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|kV",
    "Rated Current|M|number|A",
    "Breaking Capacity|O|number|kA",
  ],
  "Soft Starter Panel": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Motor Power Rating|O|number|kW",
    "Rated Current|M|number|A",
  ],
  "Solar Combiner Box": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Rated Current|M|number|A",
  ],
  "Solar Inverter": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated AC Power|M|number|kW",
    "Max DC Input Power|M|number|kWp",
    "Grid Voltage|O|text|V",
  ],
  "Sub Distribution Board (SDB)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|V",
    "Incomer Rating|M|number|A",
  ],
  Transformer: [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Power|M|number|kVA/MVA",
    "HV / LV Voltage|M|text|kV/V",
    "Phase|M|choice|#phase",
    "Cooling Type|O|choice|#cooling",
    "Vector Group|O|text",
    "Impedance|O|number|%",
    "Insulation / Temperature Class|O|text",
  ],
  UPS: [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "UPS Capacity|M|number|kVA/kW",
    "Input Voltage|M|text|V",
    "Rated Current|M|text|A",
  ],
  "VCB (Vacuum Circuit Breaker)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Rated Voltage|M|number|kV",
    "Rated Current|M|number|A",
    "Breaking Capacity|O|number|kA",
    "Operating Mechanism|O|choice",
  ],
  "VFD (Variable Frequency Drive)": [
    "Manufacturer|M|choice|#manufacturer",
    "Model / Type|O|text",
    "Input Voltage|M|text|V",
    "Rated Current|M|number|A",
    "Motor Power Rating|O|number|kW",
    "Drive Capacity|M|number|kW/HP",
  ],
}

/* ---------- Reading it ---------- */

/** Asset types the sheet covers */
export const parameterisedTypes = Object.keys(byType)

/**
 * What to ask for this asset type: its own specification, then the criticality
 * every type carries. A type the sheet does not cover falls back to "Other",
 * which asks only for the loosest set rather than nothing at all.
 */
export function parametersFor(category: string): ParamSpec[] {
  const entries = byType[category] ?? byType.Other
  return [...entries, ...common].map(parse)
}

/** Which of them must be answered before the step can be left */
export const requiredParameters = (category: string) => parametersFor(category).filter((p) => p.required)

/** What the engineer still owes on this step; empty once it is complete */
export function missingParameters(category: string, answers: Record<string, string | undefined>) {
  return requiredParameters(category).filter((p) => !answers[p.key]?.trim())
}

/**
 * Choice parameters the sheet names but gives no option list for. They render
 * as free text until the client supplies the lists, rather than being dropped
 * or given invented options.
 */
export const missingOptionLists = [
  "PLC/Controller Present (Control Panel)",
  "Instrument Type (Instrument Transformer CT/PT)",
  "Accuracy Class (Instrument Transformer CT/PT)",
  "Incomer Type (LT Panel)",
  "Busbar Material / Rating (LT Panel)",
  "Motor Starter Technology (MCC)",
  "Switch Type (Network Switch)",
  "Operating Mechanism (VCB)",
] as const
