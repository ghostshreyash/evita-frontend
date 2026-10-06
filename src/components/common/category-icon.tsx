import { cn } from "cn"

/**
 * A distinct line glyph per asset category, drawn in house.
 *
 * Every category gets its own symbol rather than sharing a generic one: on a
 * tablet at arm's length the glyph is what a field engineer reads first, and two
 * categories that look alike are worse than no glyph at all. The drawings follow
 * single-line-diagram convention where there is one - transformers are
 * interlocking circles, breakers carry the IEC cross over whatever quenches the
 * arc - so they mean something to an electrical reader rather than just
 * differing.
 *
 * Sized and stroked to sit beside the lucide icons used everywhere else:
 * 24x24, 1.8 stroke, round caps, currentColor.
 */
const glyphs: Record<string, React.ReactElement> = {
  Transformer: (
    <>
      <circle cx="9.5" cy="12" r="5" />
      <circle cx="14.5" cy="12" r="5" />
      <path d="M2.5 12h2M19.5 12h2" />
    </>
  ),
  "Power Transformer": (
    <>
      <circle cx="8" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="4.6" />
      <circle cx="16" cy="12" r="4.6" />
    </>
  ),
  "Distribution Transformer": (
    <>
      <rect x="5" y="8" width="14" height="11" rx="1.5" />
      <path d="M9 8V5.5M7.5 5.5h3M15 8V5.5M13.5 5.5h3" />
      <path d="M5 11H3M5 13.5H3M5 16H3M19 11h2M19 13.5h2M19 16h2" />
    </>
  ),
  "Instrument Transformer (CT/PT)": (
    <>
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.5v3.6M12 17.9v3.6" />
    </>
  ),
  "HT Panel": (
    <>
      <rect x="4.5" y="2.5" width="15" height="19" rx="1.5" />
      <path d="M13.2 6.5 9 13h3.2l-1.4 4.5L15 11h-3.2z" />
    </>
  ),
  "LT Panel": (
    <>
      <rect x="4.5" y="2.5" width="15" height="19" rx="1.5" />
      <path d="M4.5 8.5h15" />
      <path d="M8 11.5v3.5M12 11.5v3.5M16 11.5v3.5" />
      <path d="M7 18.5h10" />
    </>
  ),
  "MCC (Motor Control Center)": (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="1.5" />
      <path d="M9 4v16" />
      <path d="M2.5 9.3h6.5M2.5 14.7h6.5" />
      <circle cx="15.3" cy="12" r="4" />
      <circle cx="15.3" cy="12" r="1.1" />
    </>
  ),
  "PCC (Power Control Center)": (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="1.5" />
      <path d="M12 4v5" />
      <path d="M5.5 9h13" />
      <path d="M7.5 9v7M12 9v7M16.5 9v7" />
    </>
  ),
  "APFC Panel": (
    <>
      <rect x="4.5" y="2.5" width="15" height="19" rx="1.5" />
      <path d="M12 5.5v4M12 13.5v5" />
      <path d="M8 9.5h8M8 13.5h8" />
    </>
  ),
  "AMF Panel": (
    <>
      <rect x="4.5" y="2.5" width="15" height="19" rx="1.5" />
      <path d="M8 5.5v3.5M16 5.5v3.5" />
      <circle cx="8" cy="10" r="1" />
      <circle cx="16" cy="10" r="1" />
      <path d="m11.4 15.6-2.6-4.3" />
      <circle cx="12" cy="16.5" r="1" />
      <path d="M12 17.5v2.5" />
    </>
  ),
  "Distribution Board (DB)": (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
      <path d="M2.5 12h19" />
      <path d="M8.8 4.5v15M15.2 4.5v15" />
    </>
  ),
  "Sub Distribution Board (SDB)": (
    <>
      <path d="M12 2.5v4.5" />
      <path d="m10.2 5.2 1.8 1.8 1.8-1.8" />
      <rect x="5.5" y="7" width="13" height="12" rx="1.5" />
      <path d="M5.5 13h13M12 7v12" />
    </>
  ),
  "Lighting Distribution Board (LDB)": (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="1.5" />
      <path d="M12 7.3a3.3 3.3 0 0 0-2 5.9v1.3h4v-1.3a3.3 3.3 0 0 0-2-5.9Z" />
      <path d="M10.7 16.6h2.6" />
    </>
  ),
  Busbar: (
    <>
      <path d="M2.5 6h19M2.5 10h19M2.5 14h19" />
      <path d="M7 14v5M12 14v5M17 14v5" />
    </>
  ),
  "VCB (Vacuum Circuit Breaker)": (
    <>
      <rect x="7.5" y="5" width="9" height="14" rx="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5" />
      <path d="M9.5 10.6h5M9.5 13.6h5" />
    </>
  ),
  "ACB (Air Circuit Breaker)": (
    <>
      <path d="M12 2.5v6M12 15.5v6" />
      <path d="m9 9 6 6M15 9l-6 6" />
      <path d="M6.3 9.8a4.5 4.5 0 0 0 0 4.4M17.7 9.8a4.5 4.5 0 0 1 0 4.4" />
    </>
  ),
  "SF6 Circuit Breaker": (
    <>
      <path d="M12 2.5v6M12 15.5v6" />
      <path d="m9 9 6 6M15 9l-6 6" />
      <circle cx="5.8" cy="10.3" r="1.1" />
      <circle cx="6.6" cy="13.8" r="0.9" />
      <circle cx="18.2" cy="10.3" r="1.1" />
      <circle cx="17.4" cy="13.8" r="0.9" />
    </>
  ),
  MCCB: (
    <>
      <rect x="5" y="5.5" width="14" height="13" rx="2" />
      <path d="M12 2.5v3M12 18.5v3" />
      <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
    </>
  ),
  "VFD (Variable Frequency Drive)": (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M5.5 12c.9-3.2 1.8-3.2 2.7 0s1.8 3.2 2.7 0" />
      <path d="M13 12c1.4-4 2.8-4 4.2 0" />
    </>
  ),
  "Soft Starter Panel": (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M5.5 7.5v8.5H18" />
      <path d="m5.5 16 5-6h7" />
    </>
  ),
  UPS: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <rect x="5" y="9" width="7" height="6" rx="1" />
      <path d="M12 11v2" />
      <path d="M18 8.3 15.4 12.3h2.2l-1 3.4 2.6-4h-2.2z" />
    </>
  ),
  "Battery Bank": (
    <>
      <rect x="2.5" y="7" width="5" height="10" rx="1" />
      <rect x="9.5" y="7" width="5" height="10" rx="1" />
      <rect x="16.5" y="7" width="5" height="10" rx="1" />
      <path d="M5 7V5.5M12 7V5.5M19 7V5.5" />
    </>
  ),
  "Battery Charger": (
    <>
      <rect x="2.5" y="7.5" width="12" height="9" rx="1.5" />
      <path d="M14.5 10.3v3.4" />
      <path d="M9.2 9.2 5.8 13h2.8l-1 2.8 3.4-3.8H8.2z" />
      <path d="M17.5 7.5V10M20.5 7.5V10" />
      <rect x="16.3" y="10" width="5.4" height="3.4" rx="1" />
      <path d="M19 13.4v3" />
    </>
  ),
  Inverter: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M19 6 5 18" />
      <path d="M5.5 9.3h5" />
      <path d="M13.5 14.7c.8-2.3 1.6-2.3 2.4 0s1.6 2.3 2.4 0" />
    </>
  ),
  "Relay Panel": (
    <>
      <rect x="2.5" y="8.5" width="7.5" height="7" rx="1" />
      <path d="M10 12h2.5" />
      <path d="M14 18.5V17" />
      <circle cx="14" cy="15.8" r="1" />
      <path d="m14.9 15.1 4.3-3.5" />
      <circle cx="19.8" cy="10.8" r="1" />
      <path d="M19.8 9.8V7.5" />
    </>
  ),
  "Control Panel": (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="1.5" />
      <circle cx="8" cy="9" r="2.2" />
      <path d="M8 7.4v1.6" />
      <circle cx="16" cy="9" r="2.2" />
      <path d="M16 7.4v1.6" />
      <circle cx="7" cy="15.5" r="1" />
      <circle cx="12" cy="15.5" r="1" />
      <circle cx="17" cy="15.5" r="1" />
    </>
  ),
  "PLC Panel": (
    <>
      <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />
      <path d="M6.5 9.5H3M6.5 12H3M6.5 14.5H3M17.5 9.5H21M17.5 12H21M17.5 14.5H21" />
      <path d="M10.3 10v4M13.7 10v4" />
    </>
  ),
  "SCADA System": (
    <>
      <rect x="2.5" y="3.5" width="19" height="13" rx="1.5" />
      <path d="M9 20.5h6M12 16.5v4" />
      <circle cx="7" cy="12" r="1.3" />
      <circle cx="12" cy="7.5" r="1.3" />
      <circle cx="17" cy="12" r="1.3" />
      <path d="m8.1 11.1 2.8-2.7M13.1 8.4l2.8 2.7M8.3 12h7.4" />
    </>
  ),
  "RTU (Remote Terminal Unit)": (
    <>
      <rect x="3.5" y="11" width="12" height="8" rx="1.5" />
      <path d="M6 14h3M6 16.5h3" />
      <path d="M12.5 11V7" />
      <path d="M15.5 6.4a4.2 4.2 0 0 1 0 5.2M18.2 4.3a7.8 7.8 0 0 1 0 9.4" />
    </>
  ),
  "Fire Alarm Panel": (
    <>
      <rect x="2.5" y="4" width="19" height="16" rx="1.5" />
      <path d="M12 6.8a3.7 3.7 0 0 0-3.7 3.7c0 3-1.3 3.9-1.3 3.9h10s-1.3-.9-1.3-3.9A3.7 3.7 0 0 0 12 6.8Z" />
      <path d="M10.6 16.4a1.6 1.6 0 0 0 2.8 0" />
    </>
  ),
  "Solar Inverter": (
    <>
      <rect x="2.5" y="4.5" width="9" height="7" rx="0.8" />
      <path d="M7 4.5v7M2.5 8h9" />
      <path d="M7 11.5v3.5h5.5" />
      <rect x="12.5" y="11" width="9" height="8.5" rx="1.5" />
      <path d="M14.4 15.2c.8-2 1.6-2 2.4 0s1.6 2 2.4 0" />
    </>
  ),
  "Solar Combiner Box": (
    <>
      <rect x="12.5" y="6.5" width="9" height="11" rx="1.5" />
      <path d="M2.5 7.5h3.5l2.5 4.5h4" />
      <path d="M2.5 12h10" />
      <path d="M2.5 16.5h3.5L8.5 12" />
    </>
  ),
  "Solar Transformer": (
    <>
      <rect x="2.5" y="3" width="9" height="7" rx="0.8" />
      <path d="M7 3v7M2.5 6.5h9" />
      <path d="M7 10v3h2.5" />
      <circle cx="13.2" cy="16" r="4.3" />
      <circle cx="17.2" cy="16" r="4.3" />
    </>
  ),
  "Network Switch": (
    <>
      <rect x="2.5" y="4.5" width="19" height="12" rx="1.5" />
      <path d="M6 16.5v3M10 16.5v3M14 16.5v3M18 16.5v3" />
      <path d="M6.5 8.5h8m-2.2-2.2 2.2 2.2-2.2 2.2" />
      <path d="M17.5 12.5h-8m2.2-2.2-2.2 2.2 2.2 2.2" />
    </>
  ),
  "Industrial Network Equipment": (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="1.5" />
      <path d="M6 8.5h12" />
      <circle cx="9.8" cy="6" r="0.9" />
      <circle cx="14.2" cy="6" r="0.9" />
      <rect x="8.5" y="11" width="7" height="3.2" rx="0.8" />
      <rect x="8.5" y="16" width="7" height="3.2" rx="0.8" />
      <path d="M3 6h3M3 18h3" />
    </>
  ),
  Other: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="16" cy="12" r="1" />
    </>
  ),
}

/**
 * Renders one category's glyph. Falls back to the Other symbol, so a category
 * added to the parameter sheet before its drawing still renders something.
 */
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      {glyphs[category] ?? glyphs.Other}
    </svg>
  )
}
