import type { DetailRow } from "@/components/common/detail-list"
import type { AssetProfile } from "@/data/asset-data"

/**
 * The read-only blocks an asset is described by, as rows.
 *
 * The review step and the asset detail screen show the same groups, so they are
 * built once here. Anything the engineer left blank drops out, which is what
 * keeps a lightly-filled optional section from rendering as a wall of dashes —
 * see `DetailList`.
 */

export const assetDetailRows = (p: AssetProfile): DetailRow[] => [
  { label: "Enterprise", value: p.details.enterprise, always: true },
  { label: "Plant", value: p.details.plant, always: true },
  { label: "Department", value: p.details.department },
  { label: "Sub-Department", value: p.details.subDepartment },
  { label: "Address", value: p.details.address },
  { label: "Location / Area", value: p.details.area, always: true },
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

export const assetOperationalRows = (p: AssetProfile): DetailRow[] => [
  { label: "Operational Status", value: p.operational.operationalStatus, always: true },
  { label: "Asset Condition", value: p.operational.condition },
  { label: "Commissioning Date", value: p.operational.commissioned },
  { label: "Current Load (kVA)", value: p.operational.load },
  {
    label: "GPS Coordinates",
    value: p.operational.latitude && p.operational.longitude ? `${p.operational.latitude}, ${p.operational.longitude}` : "",
  },
  { label: "Asset Criticality", value: p.operational.criticality, always: true },
  { label: "Warranty Period", value: unit(p.operational.warranty, p.operational.warrantyUnit) },
  { label: "AMC / Maintenance Contract", value: p.operational.amc },
  { label: "Next Due Date", value: p.operational.nextDue },
  { label: "Remarks", value: p.operational.remarks },
]

/** "5" + "Years" -> "5 Years"; nothing at all when the value is blank */
const unit = (value?: string, suffix?: string) => (value ? [value, suffix].filter(Boolean).join(" ") : "")
