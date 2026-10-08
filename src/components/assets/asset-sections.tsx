import type { DetailRow } from "@/components/common/detail-list"
import type { AssetProfile } from "@/data/asset-data"

/**
 * The read-only blocks an asset is described by, as rows.
 *
 * The review step and the asset detail screen show the same groups, so they are
 * built once here. Anything the engineer left blank drops out, which is what
 * keeps a lightly-filled optional section from rendering as a wall of dashes —
 * see `DetailList`.
 *
 * Two groups, not three: an asset is where it is and what it is, and then the
 * electrical specification its type calls for. Nothing about how it is run is
 * captured at onboarding - no OLIVINE document asks for it.
 */

export const assetDetailRows = (p: AssetProfile): DetailRow[] => [
  { label: "Enterprise", value: p.details.enterprise, always: true },
  { label: "Plant", value: p.details.plant, always: true },
  { label: "Department", value: p.details.department },
  { label: "Sub-Department", value: p.details.subDepartment },
  { label: "Location / Area", value: p.details.area, always: true },
  {
    label: "GPS Coordinates",
    value: p.details.latitude && p.details.longitude ? `${p.details.latitude}, ${p.details.longitude}` : "",
  },
  { label: "Asset Category", value: p.details.category, always: true },
  { label: "Asset Name", value: p.details.tag, always: true },
  { label: "Asset Description", value: p.details.description },
]

/**
 * The electrical specification. Which parameters appear depends on the asset
 * type, so these are read off the profile rather than named here — see
 * data/asset-parameters.ts.
 */
export const assetTechnicalRows = (p: AssetProfile): DetailRow[] =>
  p.parameters.map((param) => ({
    label: param.label,
    value: param.value ? [param.value, param.unit].filter(Boolean).join(" ") : "",
  }))
