import {
  BatteryCharging,
  Boxes,
  CircuitBoard,
  Cpu,
  Gauge,
  LayoutGrid,
  type LucideIcon,
  Network,
  PanelsTopLeft,
  Plug,
  Server,
  Siren,
  SlidersHorizontal,
  Split,
  Zap,
} from "lucide-react"

/**
 * A glyph per asset category, so a category can be recognised at arm's length on
 * a tablet rather than read word by word.
 *
 * The glyph is held inside an object rather than returned bare: rendering
 * `<entry.icon />` keeps the component out of a local binding, which is what the
 * compiler needs to see to know nothing is being defined during render.
 */
const glyphs: Record<string, { icon: LucideIcon }> = {
  Transformer: { icon: Zap },
  "Power Transformer": { icon: Zap },
  "Distribution Transformer": { icon: Zap },
  "Instrument Transformer (CT/PT)": { icon: Gauge },
  "HT Panel": { icon: PanelsTopLeft },
  "LT Panel": { icon: PanelsTopLeft },
  "MCC (Motor Control Center)": { icon: SlidersHorizontal },
  "PCC (Power Control Center)": { icon: SlidersHorizontal },
  "APFC Panel": { icon: CircuitBoard },
  "AMF Panel": { icon: CircuitBoard },
  "Distribution Board (DB)": { icon: Split },
  "Sub Distribution Board (SDB)": { icon: Split },
  "Lighting Distribution Board (LDB)": { icon: Split },
  Busbar: { icon: Boxes },
  "VCB (Vacuum Circuit Breaker)": { icon: Plug },
  "ACB (Air Circuit Breaker)": { icon: Plug },
  "SF6 Circuit Breaker": { icon: Plug },
  MCCB: { icon: Plug },
  "VFD (Variable Frequency Drive)": { icon: SlidersHorizontal },
  "Soft Starter Panel": { icon: SlidersHorizontal },
  UPS: { icon: BatteryCharging },
  "Battery Bank": { icon: BatteryCharging },
  "Battery Charger": { icon: BatteryCharging },
  Inverter: { icon: BatteryCharging },
  "Relay Panel": { icon: CircuitBoard },
  "Control Panel": { icon: PanelsTopLeft },
  "PLC Panel": { icon: Cpu },
  "SCADA System": { icon: Server },
  "RTU (Remote Terminal Unit)": { icon: Server },
  "Fire Alarm Panel": { icon: Siren },
  "Solar Inverter": { icon: BatteryCharging },
  "Solar Combiner Box": { icon: Boxes },
  "Solar Transformer": { icon: Zap },
  "Network Switch": { icon: Network },
  "Industrial Network Equipment": { icon: Network },
}

const fallback = { icon: LayoutGrid }

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const glyph = glyphs[category] ?? fallback
  return <glyph.icon className={className} />
}
