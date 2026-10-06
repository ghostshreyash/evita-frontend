import type { DetailRow } from "@/components/common/detail-list"
import type { AssetProfile } from "@/data/asset-data"

/**
 * The read-only blocks an asset is described by, as rows.
 *
 * The review step and the asset detail screen show the same four groups, so
 * they are built once here. Anything the engineer left blank drops out, which is
 * what keeps a lightly-filled optional section from rendering as a wall of
 * dashes — see `DetailList`.
 */

export const assetDetailRows = (p: AssetProfile): DetailRow[] => [
  { label: "Enterprise", value: p.details.enterprise, always: true },
  { label: "Plant", value: p.details.plant, always: true },
  { label: "Location / Area", value: p.details.area, always: true },
  { label: "Department", value: p.details.department, always: true },
  { label: "Sub-Department", value: p.details.subDepartment },
  { label: "Asset Category", value: p.details.category, always: true },
  { label: "Asset Name / Tag ID", value: p.details.tag, always: true },
  { label: "Asset Description", value: p.details.description },
]

export const assetTechnicalRows = (p: AssetProfile): DetailRow[] => [
  { label: "Rated Voltage", note: "(Primary)", value: unit(p.technical.primaryVoltage, p.technical.primaryVoltageUnit), always: true },
  { label: "Rated Voltage", note: "(Secondary)", value: unit(p.technical.secondaryVoltage, p.technical.secondaryVoltageUnit) },
  { label: "Rated Power / Capacity", value: unit(p.technical.capacity, p.technical.capacityUnit), always: true },
  { label: "Frequency", value: unit(p.technical.frequency, "Hz") },
  { label: "Phase", value: p.technical.phase },
  { label: "Vector Group", value: skip(p.technical.vectorGroup) },
  { label: "Impedance (%)", value: p.technical.impedance },
  { label: "Cooling Type", value: p.technical.cooling },
  { label: "Insulation Class", value: skip(p.technical.insulation) },
  { label: "Tap Changer", value: skip(p.technical.tapChanger) },
  { label: "Oil Type", value: skip(p.technical.oilType) },
  { label: "Year of Manufacture", value: p.details.year },
  { label: "Manufacturer", value: p.details.manufacturer },
  { label: "Model", value: p.details.model },
  { label: "Serial Number", value: p.details.serial },
]

export const assetOperationalRows = (p: AssetProfile): DetailRow[] => [
  { label: "Asset Condition", value: p.operational.condition, always: true },
  { label: "Installation Date", value: p.details.installed },
  { label: "Commissioning Date", value: p.operational.commissioned },
  { label: "Current Load (kVA)", value: p.operational.load },
  { label: "Location in Plant", value: p.operational.locationInPlant, always: true },
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

/** "1600" + "kVA" -> "1600 kVA"; nothing at all when the value is blank */
const unit = (value?: string, suffix?: string) => (value ? [value, suffix].filter(Boolean).join(" ") : "")

/** "Not Applicable" is an answer on the form but noise on a summary */
const skip = (value?: string) => (value && value !== "Not Applicable" ? value : "")
