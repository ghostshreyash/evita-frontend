/**
 * The INSTA CLEAN products, and which one an inspection calls for.
 *
 * From the client on 12-10-2026. There are three, and the choice is made by
 * what the panel is carrying rather than by preference:
 *
 * - INSTA 50 where the deposit is carbon or soot, typically after a fault or a
 *   fire. Used with the panel **offline**.
 * - INSTA 100 where it is ordinary dust around half a millimetre to a
 *   millimetre thick. Used with the panel **online**.
 * - INSTA 200 for data centres. Rarely called for, and never recommended
 *   automatically - it is chosen by hand when the site calls for it.
 *
 * The inspection report carries the recommendation, and the engineer can
 * override it on the cleaning task: the client was explicit that the field
 * judgement wins ("mujhe laga ki nahi, AI nahi samajh paaya, INSTA 100 se mera
 * kaam nahi hoga").
 */
import type { InspectionCapture } from "@/data/inspection-detail"

export const instaProducts = ["INSTA 50", "INSTA 100", "INSTA 200"] as const

export type InstaProduct = (typeof instaProducts)[number]

export const instaUse: Record<InstaProduct, { condition: "Offline" | "Online" | "As required"; detail: string }> = {
  "INSTA 50": { condition: "Offline", detail: "Carbon or soot deposit, typically after a fault" },
  "INSTA 100": { condition: "Online", detail: "Ordinary dust, roughly 0.5 to 1 mm thick" },
  "INSTA 200": { condition: "As required", detail: "Data centre equipment; chosen by hand" },
}

/** A deposit heavy enough to call for the online clean rather than a wipe */
const THICK_ENOUGH = new Set(["1–3 mm", "> 3 mm"])

/**
 * Which product the inspection calls for, and why.
 *
 * Carbon decides it first: a sooted panel is cleaned offline whatever else it
 * is carrying. Otherwise the dust thickness decides. Nothing is recommended
 * when the asset has not been assessed - an empty recommendation is honest,
 * an invented one is not.
 */
export function recommendInsta(capture?: InspectionCapture): { product: InstaProduct; because: string } | undefined {
  if (!capture) return undefined

  const carbon = capture.contamination?.["Carbon / soot"]
  if (carbon === "High" || carbon === "Medium") {
    return { product: "INSTA 50", because: `${carbon} carbon or soot deposit — clean with the panel offline` }
  }

  const dust = capture.contamination?.Dust
  if (capture.thickness && (THICK_ENOUGH.has(capture.thickness) || dust === "High")) {
    return { product: "INSTA 100", because: `Dust at ${capture.thickness} — clean with the panel online` }
  }

  if (capture.thickness) {
    return { product: "INSTA 100", because: `Dust at ${capture.thickness} — a light online clean` }
  }
  return undefined
}
