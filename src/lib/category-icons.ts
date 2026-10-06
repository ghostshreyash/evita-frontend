/**
 * One colour per asset category, so a category reads the same on the dashboard
 * tiles, in task rows, on the task screen and across the Assets module.
 *
 * The glyph itself lives in components/common/category-icon.tsx — there is one
 * drawing per category and this file does not duplicate it. What is held here is
 * the colour, hand-assigned rather than cycled, plus the short name a tile uses.
 *
 * `tone` colours the glyph on a plain background. `tint` is the soft chip the
 * Assets screens sit it on; it is derived from the same tone, so a category
 * cannot end up blue in one place and green in another.
 */
type Tone =
  | "text-info"
  | "text-primary"
  | "text-highlight"
  | "text-critical"
  | "text-healthy"
  | "text-attention"
  | "text-neutral-soft-foreground"

/** The soft chip that goes with each tone */
const tints: Record<Tone, string> = {
  "text-info": "bg-info-soft text-info",
  // No primary-soft token exists; info-soft is the light ground the navy sits on
  "text-primary": "bg-info-soft text-primary",
  "text-highlight": "bg-highlight-soft text-highlight",
  "text-critical": "bg-critical-soft text-critical",
  "text-healthy": "bg-healthy-soft text-healthy",
  "text-attention": "bg-attention-soft text-attention",
  "text-neutral-soft-foreground": "bg-neutral-soft text-neutral-soft-foreground",
}

const tones: Record<string, Tone> = {
  Transformer: "text-info",
  "Power Transformer": "text-primary",
  "Distribution Transformer": "text-info",
  "Instrument Transformer (CT/PT)": "text-highlight",
  "HT Panel": "text-critical",
  "LT Panel": "text-primary",
  "MCC (Motor Control Center)": "text-critical",
  "PCC (Power Control Center)": "text-healthy",
  "APFC Panel": "text-attention",
  "AMF Panel": "text-attention",
  "Distribution Board (DB)": "text-healthy",
  "Sub Distribution Board (SDB)": "text-healthy",
  "Lighting Distribution Board (LDB)": "text-attention",
  Busbar: "text-primary",
  "VCB (Vacuum Circuit Breaker)": "text-critical",
  "ACB (Air Circuit Breaker)": "text-info",
  "SF6 Circuit Breaker": "text-highlight",
  MCCB: "text-info",
  "VFD (Variable Frequency Drive)": "text-healthy",
  "Soft Starter Panel": "text-attention",
  UPS: "text-healthy",
  "Battery Bank": "text-healthy",
  "Battery Charger": "text-attention",
  Inverter: "text-info",
  "Relay Panel": "text-highlight",
  "Control Panel": "text-primary",
  "PLC Panel": "text-info",
  "SCADA System": "text-highlight",
  "RTU (Remote Terminal Unit)": "text-highlight",
  "Fire Alarm Panel": "text-critical",
  "Solar Inverter": "text-attention",
  "Solar Combiner Box": "text-attention",
  "Solar Transformer": "text-attention",
  "Network Switch": "text-info",
  "Industrial Network Equipment": "text-primary",
  Other: "text-neutral-soft-foreground",
}

export type CategoryLook = { tone: Tone; tint: string }

export const categoryLook = (category: string): CategoryLook => {
  const tone = tones[category] ?? tones.Other
  return { tone, tint: tints[tone] }
}

/** Short name for a tile: "MCC (Motor Control Center)" → "MCC" */
export const shortCategory = (category: string) => category.replace(/\s*\((?!CT\/PT).*?\)/, "")
