/**
 * The asset register for the signed-in ELPREMAR's plant, and the full profile
 * behind each row.
 *
 * Shape mirrors the ELPREMAR registry in elpremar-data.ts: a flat list for the
 * table, plus a deterministic profile built on demand for the detail screen.
 * Everything is seeded off the asset's own id, so a reload never moves a value.
 * Replace with API calls (TanStack Query) later.
 *
 * Ordering note, same as occ-tables.ts: the generated register at the bottom
 * reads the pools above it. Hoisted functions still close over `const` pools
 * that sit in the temporal dead zone until their declaration is reached, so the
 * register stays last. Execute this module in node after merging.
 */
import {
  assetCategoryCode,
  assetConditions,
  assetCriticality,
  assetOperationalStatus,
  commonAssetCategories,
  coolingTypes,
  insulationClasses,
  manufacturers,
  oilTypes,
  phaseTypes,
  tapChangerTypes,
  vectorGroups,
  type AssetCriticality,
} from "@/data/master-data"
import { elpremarRecords } from "@/data/elpremar-data"
import { enterpriseRecords, profileFor, type PlantProfile } from "@/data/occ-tables"

/* ---------- Types ---------- */

/** One row of the asset register */
export type AssetRecord = {
  /** Unique platform id, e.g. TSL-MUM-11KV-TRF-001 */
  id: string
  /** What the plant calls it on the panel door, e.g. TRF-T1-11KV */
  tag: string
  name: string
  category: string
  /** Area within the plant, e.g. "Main Substation (11kV)" */
  area: string
  plant: string
  enterprise: string
  department: string
  criticality: AssetCriticality
  manufacturer: string
  model: string
  serial: string
  /** Year of manufacture */
  year: number
  /** DD-MM-YYYY */
  installed: string
  onboarded: string
  /**
   * 0-100, scored from the last inspection. Null until one has happened: a
   * newly onboarded asset has no score rather than a placeholder one, and
   * reads as "Onboarded" wherever a health status is shown.
   */
  health: number | null
}

/** Everything the onboarding wizard captured, as the detail screen reads it */
export type AssetProfile = {
  details: {
    enterprise: string
    plant: string
    area: string
    department: string
    subDepartment: string
    category: string
    tag: string
    description: string
    manufacturer: string
    model: string
    serial: string
    year: string
    installed: string
    criticality: string
  }
  technical: {
    primaryVoltage: string
    primaryVoltageUnit: string
    secondaryVoltage: string
    secondaryVoltageUnit: string
    capacity: string
    capacityUnit: string
    frequency: string
    phase: string
    cooling: string
    vectorGroup: string
    impedance: string
    insulation: string
    tapChanger: string
    oilType: string
  }
  operational: {
    operationalStatus: string
    condition: string
    commissioned: string
    load: string
    latitude: string
    longitude: string
    criticality: string
    warranty: string
    warrantyUnit: string
    amc: string
    nextDue: string
    remarks: string
  }
  /** Named by the engineer who captured them - there is no fixed set */
  documents: { id: string; name: string; file: string; uploaded: string }[]
  images: { id: string; name: string }[]
}

/* ---------- Seeded helpers ---------- */

const seedOf = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const pick = <T,>(pool: readonly T[], seed: number, offset: number) => pool[(seed + offset * 7) % pool.length]

/** Dates count back from a fixed reference so nothing shifts between reloads */
const REFERENCE = new Date(2026, 8, 28)

const dmy = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`

const dateOffset = (days: number) => {
  const d = new Date(REFERENCE)
  d.setDate(d.getDate() + days)
  return dmy(d)
}

/** DD-MM-YYYY -> Date, for sorting and comparing the dates generated as strings */
export const parseDmy = (d: string) => {
  const [dd, mm, yyyy] = d.split("-").map(Number)
  return new Date(yyyy, mm - 1, dd)
}

/* ---------- Pools ---------- */

/**
 * Areas inside a plant an asset can be registered against. Deliberately the
 * electrical rooms a field engineer actually walks, not the plant's own
 * department tree - an asset lives in a room, and is owned by a department.
 */
const areaPool = [
  "Main Substation (11kV)",
  "LT Panel Room - Block A",
  "DG Set Area",
  "Production Floor",
  "Utility Area",
  "Cable Trench",
  "Compressor House",
  "Water Treatment Plant",
] as const


/** Cooling types an oil-filled transformer can carry; dry kit never uses these */
const oilCooledTypes = coolingTypes.filter((c) => c.startsWith("O"))

/** Voltage class per category, as the nameplate reads it */
const ratingFor = (category: string, seed: number) => {
  if (category.includes("Transformer")) return { primary: "11", primaryUnit: "kV", secondary: "415", secondaryUnit: "V", capacity: String(630 + (seed % 5) * 400), capacityUnit: "kVA" }
  if (category.includes("HT") || category.includes("VCB") || category.includes("SF6"))
    return { primary: "11", primaryUnit: "kV", secondary: "11", secondaryUnit: "kV", capacity: String(400 + (seed % 4) * 200), capacityUnit: "A" }
  if (category === "UPS" || category === "Battery Bank" || category === "Battery Charger")
    return { primary: "415", primaryUnit: "V", secondary: "415", secondaryUnit: "V", capacity: String(20 + (seed % 6) * 20), capacityUnit: "kVA" }
  return { primary: "415", primaryUnit: "V", secondary: "415", secondaryUnit: "V", capacity: String(100 + (seed % 8) * 75), capacityUnit: "kVA" }
}

/** Voltage segment of the Asset ID, e.g. "11KV" */
const voltageToken = (value: string, unit: string) => `${value}${unit}`.toUpperCase()

/** First three letters of a city, for the plant segment of the Asset ID */
const cityCode = (city: string) => city.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()

/* ---------- Where the signed-in engineer works ---------- */

/**
 * The posting the register is built for. EVITA shows one engineer's own site, so
 * the enterprise and plant are fixed rather than filterable - everything in the
 * table belongs to this plant.
 *
 * Taken from the ELPREMAR registry so the plant, its city and its departments
 * are the same ones the rest of the app names.
 */
export function siteFor(elpremarId: string): { enterprise: string; plant: PlantProfile; department: string } {
  const person = elpremarRecords.find((e) => e.id === elpremarId) ?? elpremarRecords[0]
  const enterprise = enterpriseRecords.find((e) => e.name === person.enterprise) ?? enterpriseRecords[0]
  const plants = profileFor(enterprise).plants
  const plant = plants.find((p) => p.name === person.plant) ?? plants[0]
  return { enterprise: enterprise.name, plant, department: person.department || plant.departments[0].name }
}

/* ---------- Profile ---------- */

/**
 * Rebuild everything onboarding captured for one asset. Seeded off the asset id,
 * so the review screen, the detail screen and the register agree without any of
 * it being stored.
 */
export function assetProfileFor(a: AssetRecord): AssetProfile {
  const s = seedOf(a.id)
  const rating = ratingFor(a.category, s)
  const oily = a.category.includes("Transformer")
  const site = enterpriseRecords.find((e) => e.name === a.enterprise)
  const plant = site ? profileFor(site).plants.find((p) => p.name === a.plant) : undefined
  // Drawn from the plant's own tree, so a profile can never name a sub-department
  // that does not exist under its department; blank when the department has none
  const subDepts = plant?.departments.find((d) => d.name === a.department)?.subDepartments ?? []
  const subDepartment = subDepts.length ? subDepts[s % subDepts.length].name : ""
  const commissioned = parseDmy(a.installed)

  return {
    details: {
      enterprise: a.enterprise,
      plant: a.plant,
      area: a.area,
      department: a.department,
      subDepartment,
      category: a.category,
      tag: a.tag,
      description: `${rating.primary} ${rating.primaryUnit}/${rating.secondary} ${rating.secondaryUnit} ${a.category} — ${a.tag}`,
      manufacturer: a.manufacturer,
      model: a.model,
      serial: a.serial,
      year: String(a.year),
      installed: a.installed,
      criticality: a.criticality,
    },
    technical: {
      primaryVoltage: rating.primary,
      primaryVoltageUnit: rating.primaryUnit,
      secondaryVoltage: rating.secondary,
      secondaryVoltageUnit: rating.secondaryUnit,
      capacity: rating.capacity,
      capacityUnit: rating.capacityUnit,
      frequency: "50",
      // Anything carrying a transformer or a panel is three-phase; only the small
      // DC-backed kit differs, so this follows the category rather than a hash
      phase: a.category === "Battery Bank" || a.category === "Battery Charger" ? "DC" : a.category === "UPS" ? phaseTypes[0] : phaseTypes[1],
      cooling: oily ? pick(oilCooledTypes, s, 2) : "AN (Air Natural)",
      vectorGroup: oily ? pick(vectorGroups, s, 3) : "Not Applicable",
      impedance: oily ? (4 + (s % 40) / 10).toFixed(2) : "",
      insulation: pick(insulationClasses, s, 4),
      tapChanger: oily ? pick(tapChangerTypes, s, 5) : "Not Applicable",
      oilType: oily ? pick(oilTypes, s, 6) : "Dry Type / None",
    },
    operational: {
      operationalStatus: pick(assetOperationalStatus, s, 9),
      condition: pick(assetConditions, s, 7),
      commissioned: a.installed,
      load: String(Math.round(Number(rating.capacity) * (0.4 + (s % 45) / 100))),
      latitude: plant?.latitude ?? "0.0000",
      longitude: plant?.longitude ?? "0.0000",
      criticality: a.criticality,
      warranty: String(2 + (s % 4)),
      warrantyUnit: "Years",
      amc: s % 3 === 0 ? "No" : "Yes",
      // Next general check, counted forward from commissioning in whole years
      nextDue: dmy(new Date(REFERENCE.getFullYear(), commissioned.getMonth(), commissioned.getDate())),
      remarks: s % 4 === 0 ? "Installed as part of the Phase-2 expansion." : "",
    },
    documents: [
      { id: "d1", name: "Nameplate Photo (Close-up)", file: `${a.tag}-Nameplate.jpg`, uploaded: a.onboarded },
      { id: "d2", name: "Manufacturer Datasheet", file: `${a.manufacturer.replace(/\W/g, "")}_${a.tag}_Datasheet.pdf`, uploaded: a.onboarded },
      { id: "d3", name: "Installation Report", file: `${a.tag}_InstallationReport.pdf`, uploaded: a.onboarded },
      { id: "d4", name: "Single Line Diagram (SLD)", file: `SLD_${a.area.replace(/\W/g, "")}.pdf`, uploaded: a.onboarded },
      { id: "d5", name: "Warranty Certificate", file: `Warranty_${a.tag}.pdf`, uploaded: a.onboarded },
    ],
    images: [
      { id: "i1", name: "Front View" },
      { id: "i2", name: "Side View" },
      { id: "i3", name: "Nameplate" },
      { id: "i4", name: "Panel / Accessories" },
      { id: "i5", name: "Overall Area" },
    ],
  }
}

/* ---------- Asset ID ---------- */

/**
 * The unique platform id for an asset: enterprise, plant, category and a running
 * number within that group — TSL-MUM-TRF-001. Built here rather than typed, so
 * two assets can never be handed the same one.
 *
 * It deliberately carries no voltage segment. The mockup's id does, but the
 * ratings are optional and entered on step 2, while the id is shown filled in on
 * step 1 — an id that changed once a voltage was typed would not be a prefilled
 * id. Every id now has the same shape whether or not the nameplate was readable.
 */
export function buildAssetId(parts: {
  enterprise: string
  city: string
  category: string
  /** Assets already registered, so the running number continues from them */
  existing?: readonly AssetRecord[]
}) {
  const enterprise = enterpriseRecords.find((e) => e.name === parts.enterprise)
  const prefix = [
    enterprise?.id.slice(0, 3) ?? parts.enterprise.slice(0, 3).toUpperCase(),
    cityCode(parts.city),
    assetCategoryCode(parts.category),
  ].join("-")
  const taken = (parts.existing ?? assetRegister).filter((a) => a.id.startsWith(prefix + "-"))
  const highest = taken.reduce((n, a) => Math.max(n, Number(a.id.slice(prefix.length + 1)) || 0), 0)
  return `${prefix}-${String(highest + 1).padStart(3, "0")}`
}

/* ---------- Register ---------- */

/*
 * Generated last: this reads every pool above plus siteFor(), which itself
 * reaches into the enterprise registry. Keep it at the end of the module.
 */

/** How many assets a plant's register holds — enough that paging is real */
const REGISTER_SIZE = 84

/**
 * Build the register for one plant. Categories, areas and criticality are
 * assigned by position rather than by hash, so every bucket is populated: a
 * divisor across a list this short has left a filter option empty before, which
 * reads on screen as a count stuck at zero.
 */
function buildRegister(elpremarId: string): AssetRecord[] {
  const { enterprise, plant, department } = siteFor(elpremarId)
  const departments = plant.departments
  const counters = new Map<string, number>()
  // Same segment buildAssetId uses, so an asset onboarded now joins the same series
  const house = enterpriseRecords.find((e) => e.name === enterprise)?.id.slice(0, 3) ?? enterprise.slice(0, 3).toUpperCase()

  return Array.from({ length: REGISTER_SIZE }, (_, i) => {
    const category = commonAssetCategories[i % commonAssetCategories.length]
    const area = areaPool[i % areaPool.length]
    const criticality = assetCriticality[i % assetCriticality.length]
    const s = seedOf(`${plant.code}-${category}-${i}`)
    const rating = ratingFor(category, s)

    const prefix = [house, cityCode(plant.city), assetCategoryCode(category)].join("-")
    const n = (counters.get(prefix) ?? 0) + 1
    counters.set(prefix, n)

    const code = assetCategoryCode(category)
    const inspected = i % 9 !== 8
    const installed = dateOffset(-(400 + ((s + i * 53) % 3200)))
    // Manufactured in the year it was installed or the one before, never after
    const year = parseDmy(installed).getFullYear() - (s % 2)

    return {
      id: `${prefix}-${String(n).padStart(3, "0")}`,
      tag: `${code}-${String(n).padStart(2, "0")}-${voltageToken(rating.primary, rating.primaryUnit)}`,
      name: `${category} - ${String(n).padStart(2, "0")}`,
      category,
      area,
      plant: plant.name,
      enterprise,
      department: departments[i % departments.length]?.name ?? department,
      criticality,
      manufacturer: pick(manufacturers.slice(0, -1), s, 1),
      model: `${code}-${rating.primary}/${rating.secondary}`,
      serial: `SN-${year}-${String(1000 + (s % 8999))}`,
      year,
      installed,
      onboarded: dateOffset(-(5 + ((s + i * 29) % 420))),
      /*
       * Spread across the three health bands by position, so none is ever empty.
       * Roughly one in nine is newly onboarded and not yet inspected, so it has
       * no score at all - those read as "Onboarded" rather than as a band.
       */
      health: inspected ? [88, 92, 74, 61, 55, 44, 96, 68, 38, 81][i % 10] + (s % 4) : null,
    }
  })
}

/**
 * The register as it stands for the engineer signed in to the demo. One plant's
 * worth of assets — EVITA never shows another site's equipment.
 */
export const assetRegister: AssetRecord[] = buildRegister(elpremarRecords[0].id)
