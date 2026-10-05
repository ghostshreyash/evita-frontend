import {
  Activity,
  Atom,
  BatteryCharging,
  BatteryFull,
  Columns3,
  Combine,
  Cog,
  Cpu,
  Fan,
  Gauge,
  Grid3x3,
  LayoutPanelTop,
  Lightbulb,
  MonitorCog,
  MonitorDot,
  Network,
  PanelsTopLeft,
  PlugZap,
  Power,
  RadioTower,
  Repeat,
  Router,
  Rows3,
  Settings,
  Shield,
  Siren,
  SlidersHorizontal,
  Split,
  Sun,
  Sunrise,
  ToggleLeft,
  ToggleRight,
  UtilityPole,
  Wind,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react"

/**
 * One glyph and one colour per asset category, so a category reads the same on
 * the dashboard tiles, in task rows and on the task screen. Every category in
 * the master list gets its own icon — no two share one — coloured from the
 * theme tokens in the spirit of the EVITA dashboard mockup.
 */
type Look = { icon: LucideIcon; tone: string }

const looks: Record<string, Look> = {
  Transformer: { icon: Zap, tone: "text-info" },
  "Power Transformer": { icon: UtilityPole, tone: "text-primary" },
  "Distribution Transformer": { icon: Split, tone: "text-info" },
  "Instrument Transformer (CT/PT)": { icon: Gauge, tone: "text-highlight" },
  "HT Panel": { icon: PanelsTopLeft, tone: "text-critical" },
  "LT Panel": { icon: LayoutPanelTop, tone: "text-primary" },
  "MCC (Motor Control Center)": { icon: Cog, tone: "text-critical" },
  "PCC (Power Control Center)": { icon: Power, tone: "text-healthy" },
  "APFC Panel": { icon: Activity, tone: "text-attention" },
  "AMF Panel": { icon: ToggleRight, tone: "text-attention" },
  "Distribution Board (DB)": { icon: Grid3x3, tone: "text-healthy" },
  "Sub Distribution Board (SDB)": { icon: Columns3, tone: "text-healthy" },
  "Lighting Distribution Board (LDB)": { icon: Lightbulb, tone: "text-attention" },
  Busbar: { icon: Rows3, tone: "text-primary" },
  "VCB (Vacuum Circuit Breaker)": { icon: ToggleLeft, tone: "text-critical" },
  "ACB (Air Circuit Breaker)": { icon: Wind, tone: "text-info" },
  "SF6 Circuit Breaker": { icon: Atom, tone: "text-highlight" },
  MCCB: { icon: Shield, tone: "text-info" },
  "VFD (Variable Frequency Drive)": { icon: Fan, tone: "text-healthy" },
  "Soft Starter Panel": { icon: SlidersHorizontal, tone: "text-attention" },
  UPS: { icon: BatteryCharging, tone: "text-healthy" },
  "Battery Bank": { icon: BatteryFull, tone: "text-healthy" },
  "Battery Charger": { icon: PlugZap, tone: "text-attention" },
  Inverter: { icon: Repeat, tone: "text-info" },
  "Relay Panel": { icon: Workflow, tone: "text-highlight" },
  "Control Panel": { icon: MonitorCog, tone: "text-primary" },
  "PLC Panel": { icon: Cpu, tone: "text-info" },
  "SCADA System": { icon: MonitorDot, tone: "text-highlight" },
  "RTU (Remote Terminal Unit)": { icon: RadioTower, tone: "text-highlight" },
  "Fire Alarm Panel": { icon: Siren, tone: "text-critical" },
  "Solar Inverter": { icon: Sun, tone: "text-attention" },
  "Solar Combiner Box": { icon: Combine, tone: "text-attention" },
  "Solar Transformer": { icon: Sunrise, tone: "text-attention" },
  "Network Switch": { icon: Network, tone: "text-info" },
  "Industrial Network Equipment": { icon: Router, tone: "text-primary" },
  Other: { icon: Settings, tone: "text-neutral-soft-foreground" },
}

export const categoryLook = (category: string): Look => looks[category] ?? looks.Other

/** Short name for a tile: "MCC (Motor Control Center)" → "MCC" */
export const shortCategory = (category: string) => category.replace(/\s*\((?!CT\/PT).*?\)/, "")
