/**
 * Controlled vocabularies from the Olivine Digital Platform specification.
 *
 * These are the platform's master data: every dropdown on an onboarding or asset
 * form should read from here rather than declaring its own list, so the options
 * stay consistent across EVITA, EMMS-E and OCC.
 */

/* ---------- Enterprise sector ---------- */

/**
 * An enterprise is either Industry or Retail. The choice drives the sector list
 * below, and per the spec also the landing screen: Industry defaults to the
 * management view, Retail to the monitoring view.
 */
export const sectorTypes = ["Industry", "Retail"] as const
export type SectorType = (typeof sectorTypes)[number]

/**
 * How big an enterprise is, held separately from its sector. The two are never
 * combined into one stored value — a classification like "Industry, Large" is
 * aggregated from the two fields at read time, so either can be filtered alone.
 */
export const enterpriseScales = ["Large", "Mid", "Small"] as const
export type EnterpriseScale = (typeof enterpriseScales)[number]

export const industrySectors = [
  "Large Cap",
  "Mid Cap",
  "Small Cap",
  "MSME",
  "Startup",
  "Government / PSU",
] as const

export const retailSectors = [
  "Residence",
  "Hospitals & Healthcare",
  "Hotels & Restaurants",
  "Shopping Malls",
  "Retail Stores",
  "Commercial Offices",
  "Educational Institutions",
  "Entertainment Facilities",
  "Warehouses & Logistics",
  "Transportation Facilities",
  "Religious Facilities",
] as const

/** Sector options for the chosen type; empty until a type is picked */
export const sectorsFor = (type?: string): readonly string[] =>
  type === "Industry" ? industrySectors : type === "Retail" ? retailSectors : []

/** Label for the dependent sector field - stays generic until a type is picked */
export const sectorLabelFor = (type?: string) =>
  type === "Industry" ? "Industry Sector" : type === "Retail" ? "Retail Sector" : "Sector"

/** Default landing screen per sector type */
export const defaultScreenFor = (type?: string) =>
  type === "Retail" ? "Monitoring" : "Management"

/* ---------- Contact ---------- */

/** Dialling codes for the countries the platform operates in */
export const dialCodes = [
  { code: "+91", country: "India" },
  { code: "+971", country: "United Arab Emirates" },
  { code: "+966", country: "Saudi Arabia" },
  { code: "+65", country: "Singapore" },
  { code: "+44", country: "United Kingdom" },
  { code: "+49", country: "Germany" },
  { code: "+31", country: "Netherlands" },
  { code: "+1", country: "United States" },
  { code: "+55", country: "Brazil" },
  { code: "+27", country: "South Africa" },
  { code: "+61", country: "Australia" },
] as const

/** Dialling code for a country name, defaulting to India */
export const dialCodeFor = (country?: string) =>
  dialCodes.find((d) => d.country === country)?.code ?? "+91"

/* ---------- Organisation ---------- */

export const departmentTypes = [
  "Electrical",
  "Operations",
  "Maintenance",
  "Engineering",
  "Projects",
  "Instrumentation & Control",
  "Production",
  "Utilities",
  "Safety",
  "Facility Management",
  "Reliability",
  "EHS",
  "Other",
] as const

export const userRoles = [
  "Enterprise Admin",
  "Enterprise Manager",
  "Plant Admin",
  "Plant Manager",
  "ELPREMAR",
  "OCC Admin",
  "OCC Manager",
  "OCC Technician",
  "OCC EMMSE",
  "OCC Support",
  "System Admin",
] as const

/**
 * Team designation. A supervisor never works as an operator, and a helper is
 * recorded as an operator - the two were agreed to be the same thing.
 * Separate from the role streams below: one person can hold several of those.
 */
export const elpremarDesignations = ["Supervisor", "Operator"] as const

export const elpremarRoles = [
  "ELPREMAR – EVITA Field Inspection",
  "ELPREMAR – INSTA CLEAN Cleaning",
  "ELPREMAR – Fire Prevention",
] as const

/**
 * Just the stream name. On a screen that is already about ELPREMARs the prefix
 * is noise on every row, and dropping it keeps the column from wrapping.
 */
export const roleStream = (role: string) => role.replace(/^ELPREMAR\s*[–-]\s*/, "")

/**
 * The certified ELPREMAR roster. Shared so the workforce registry and the work
 * rows assigned to them draw from one list - otherwise a person could exist with
 * no work, or work could be assigned to someone who is not on the register.
 * Gender travels with the name so salutations cannot contradict it.
 */
export const elpremarRoster = [
  { name: "Suresh Kumar", gender: "Male" },
  { name: "Amit Sharma", gender: "Male" },
  { name: "Ramesh Patil", gender: "Male" },
  { name: "Anil Singh", gender: "Male" },
  { name: "Priya Nair", gender: "Female" },
  { name: "Vikram Desai", gender: "Male" },
  { name: "Khalid Rahman", gender: "Male" },
  { name: "Lukas Weber", gender: "Male" },
  { name: "Maria Lopez", gender: "Female" },
  { name: "Rajesh Verma", gender: "Male" },
  { name: "Sunita Iyer", gender: "Female" },
  { name: "Arun Joshi", gender: "Male" },
  { name: "Deepak Menon", gender: "Male" },
  { name: "Kavita Reddy", gender: "Female" },
  { name: "Imran Qureshi", gender: "Male" },
  { name: "Sanjay Gupta", gender: "Male" },
  { name: "Meera Bose", gender: "Female" },
  { name: "Rahul Chawla", gender: "Male" },
  { name: "Farah Siddiqui", gender: "Female" },
  { name: "Joseph Mathew", gender: "Male" },
] as const

/** Just the names, for pools that only need to assign work */
export const elpremarNames = elpremarRoster.map((e) => e.name)

/** How many of the roster are suspended rather than working */
const suspended = 3

/**
 * Whether a roster member's account is live. Taken by position rather than
 * hashed, so the bucket is actually populated across a roster this small, and
 * the inactive ones are at the end of the list - the hand-written work rows
 * name the earlier members, and those people have to be able to hold that work.
 * Shared so a member's status and the crew work is assigned to cannot drift.
 */
export const elpremarLifecycle = (i: number) => (i >= elpremarRoster.length - suspended ? "inactive" : "active")

/**
 * Who can be given work. Inactive is purely administrative - someone who has
 * left, is on long leave, or whose registration has lapsed. It is not a health
 * or warning state. There is no trained / untrained split: an ELPREMAR is only
 * onboarded once they are trained and certified.
 */
export const activeElpremarNames = elpremarRoster
  .filter((_, i) => elpremarLifecycle(i) === "active")
  .map((e) => e.name)

/**
 * Postal code to district and city. Stands in for the places API that will do
 * this lookup for real - the point is that the operator types the code and the
 * location fills itself in, rather than typing all three.
 */
const postalAreas: Record<string, { district: string; city: string; state: string }> = {
  "400001": { district: "Mumbai City", city: "Mumbai", state: "Maharashtra" },
  "400703": { district: "Thane", city: "Navi Mumbai", state: "Maharashtra" },
  "831001": { district: "East Singhbhum", city: "Jamshedpur", state: "Jharkhand" },
  "361001": { district: "Jamnagar", city: "Jamnagar", state: "Gujarat" },
  "402107": { district: "Raigad", city: "Dolvi", state: "Maharashtra" },
  "370421": { district: "Kutch", city: "Mundra", state: "Gujarat" },
  "500081": { district: "Hyderabad", city: "Hyderabad", state: "Telangana" },
  "700001": { district: "Kolkata", city: "Kolkata", state: "West Bengal" },
  "380001": { district: "Ahmedabad", city: "Ahmedabad", state: "Gujarat" },
  "682001": { district: "Ernakulam", city: "Kochi", state: "Kerala" },
  "411001": { district: "Pune", city: "Pune", state: "Maharashtra" },
  "600001": { district: "Chennai", city: "Chennai", state: "Tamil Nadu" },
}

/** Look up a postal code. Returns undefined when it is not a code we know. */
export const areaForPostalCode = (code: string) => postalAreas[code.trim()]

/** The postal code for a city, where we know one */
export const postalCodeForCity = (city: string) =>
  Object.keys(postalAreas).find((code) => postalAreas[code].city === city)

/** Codes we can resolve, for placeholder text and test data */
export const knownPostalCodes = Object.keys(postalAreas)

/* ---------- Assets ---------- */

export const assetCategories = [
  "Transformer",
  "Power Transformer",
  "Distribution Transformer",
  "Instrument Transformer (CT/PT)",
  "HT Panel",
  "LT Panel",
  "MCC (Motor Control Center)",
  "PCC (Power Control Center)",
  "APFC Panel",
  "AMF Panel",
  "Distribution Board (DB)",
  "Sub Distribution Board (SDB)",
  "Lighting Distribution Board (LDB)",
  "Busbar",
  "VCB (Vacuum Circuit Breaker)",
  "ACB (Air Circuit Breaker)",
  "SF6 Circuit Breaker",
  "MCCB",
  "VFD (Variable Frequency Drive)",
  "Soft Starter Panel",
  "UPS",
  "Battery Bank",
  "Battery Charger",
  "Inverter",
  "Relay Panel",
  "Control Panel",
  "PLC Panel",
  "SCADA System",
  "RTU (Remote Terminal Unit)",
  "Fire Alarm Panel",
  "Solar Inverter",
  "Solar Combiner Box",
  "Solar Transformer",
  "Network Switch",
  "Industrial Network Equipment",
  "Other",
] as const

export const assetCriticality = ["High", "Medium", "Low"] as const

export type AssetCriticality = (typeof assetCriticality)[number]

/** Contamination / hygiene status, the wording used on inspection records */
export const contaminationStatus = [
  "Good",
  "Attention Required",
  "Poor Condition",
  "Not Inspected / No Data",
] as const

export const healthStatusValues = ["Healthy", "Attention Required", "Poor Condition", "Not Inspected"] as const

export const firePreventionStatus = [
  "Healthy / Normal",
  "Attention Required",
  "Abnormal",
  "Not Tested",
  "Not Applicable",
] as const

export const manufacturers = [
  "ABB",
  "Siemens",
  "Schneider Electric",
  "Larsen & Toubro (L&T)",
  "CG Power",
  "Crompton Greaves",
  "GE",
  "Hitachi Energy",
  "Eaton",
  "Legrand",
  "Havells",
  "Bharat Heavy Electricals Limited (BHEL)",
  "Toshiba",
  "Mitsubishi Electric",
  "Rockwell Automation",
  "Other",
] as const

/**
 * The categories offered directly on the Asset Category Reference grid during
 * onboarding — the kit a plant actually holds. The remaining categories are not
 * hidden: "Other" opens the full master list above.
 */
export const commonAssetCategories = [
  "Transformer",
  "Distribution Transformer",
  "HT Panel",
  "LT Panel",
  "MCC (Motor Control Center)",
  "PCC (Power Control Center)",
  "APFC Panel",
  "Distribution Board (DB)",
  "VCB (Vacuum Circuit Breaker)",
  "ACB (Air Circuit Breaker)",
  "VFD (Variable Frequency Drive)",
  "UPS",
  "Battery Bank",
  "Control Panel",
  "PLC Panel",
  "Fire Alarm Panel",
  "Busbar",
  "Relay Panel",
  "Network Switch",
  "Other",
] as const

/**
 * Three-letter code per category, used to build the unique Asset ID at the end
 * of onboarding (TSL-MUM-11KV-TRF-001). Every category needs one, so an asset in
 * any category can be given an ID; anything unlisted falls back to its initials.
 */
const assetCategoryCodes: Record<string, string> = {
  Transformer: "TRF",
  "Power Transformer": "PTR",
  "Distribution Transformer": "DTR",
  "Instrument Transformer (CT/PT)": "ITR",
  "HT Panel": "HTP",
  "LT Panel": "LTP",
  "MCC (Motor Control Center)": "MCC",
  "PCC (Power Control Center)": "PCC",
  "APFC Panel": "APF",
  "AMF Panel": "AMF",
  "Distribution Board (DB)": "DB",
  "Sub Distribution Board (SDB)": "SDB",
  "Lighting Distribution Board (LDB)": "LDB",
  Busbar: "BUS",
  "VCB (Vacuum Circuit Breaker)": "VCB",
  "ACB (Air Circuit Breaker)": "ACB",
  "SF6 Circuit Breaker": "SF6",
  MCCB: "MCB",
  "VFD (Variable Frequency Drive)": "VFD",
  "Soft Starter Panel": "SSP",
  UPS: "UPS",
  "Battery Bank": "BAT",
  "Battery Charger": "BCH",
  Inverter: "INV",
  "Relay Panel": "RLY",
  "Control Panel": "CTP",
  "PLC Panel": "PLC",
  "SCADA System": "SCD",
  "RTU (Remote Terminal Unit)": "RTU",
  "Fire Alarm Panel": "FAP",
  "Solar Inverter": "SIN",
  "Solar Combiner Box": "SCB",
  "Solar Transformer": "STR",
  "Network Switch": "NSW",
  "Industrial Network Equipment": "INE",
  Other: "OTH",
}

/** Asset ID segment for a category, e.g. "Transformer" -> "TRF" */
export const assetCategoryCode = (category: string) => {
  const known = assetCategoryCodes[category]
  if (known) return known
  // Initials of an unlisted category, ignoring anything in brackets
  const initials = category
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 3)
  return initials || "AST"
}

/*
 * The lists below come from the EVITA onboarding mockups rather than the
 * parameter sheet - the sheet names the fields but not their options. Move any
 * of them into the sheet's wording the moment the client rules on it.
 */

/**
 * Whether the asset is in service. Mandatory, per the client's answer on the
 * asset onboarding screen.
 *
 * CAUTION - these values are NOT from the parameter sheet. The sheet lists
 * "Asset Operational Status" and gives its values as "Not Required", while the
 * answer makes the field mandatory. The two disagree, so this list is a
 * placeholder standing in until the client rules on it; do not treat it as
 * ratified vocabulary.
 */
export const assetOperationalStatus = [
  "In Service",
  "Standby",
  "Under Maintenance",
  "Isolated / Shutdown",
  "Decommissioned",
] as const

/** Condition of the asset at the moment it is onboarded */
export const assetConditions = ["New", "Refurbished", "In Service", "Relocated"] as const

export const phaseTypes = ["Single Phase (1Ø)", "Two Phase (2Ø)", "Three Phase (3Ø)", "DC", "Not Applicable"] as const

export const coolingTypes = ["ONAN", "ONAF", "OFAF", "ODAF", "AN (Air Natural)", "AF (Air Forced)", "Dry Type", "Not Applicable"] as const

export const insulationClasses = ["Class A", "Class B", "Class E", "Class F", "Class H", "Class C", "Not Applicable"] as const

export const tapChangerTypes = ["Yes (OLTC)", "Yes (OCTC)", "No", "Not Applicable"] as const

export const oilTypes = ["Mineral Oil", "Silicone Oil", "Ester (Natural)", "Ester (Synthetic)", "Dry Type / None"] as const

export const vectorGroups = ["Dyn11", "Dyn1", "Ynd11", "YNyn0", "Dd0", "Yy0", "Not Applicable"] as const

/** Units offered beside a numeric rating */
export const voltageUnits = ["V", "kV"] as const
export const powerUnits = ["kVA", "MVA", "kW", "MW", "A"] as const
/** Frequency is a choice on the parameter sheet, not a number with a unit */
export const frequencyValues = ["DC", "50 Hz", "60 Hz", "Variable Frequency", "Not Applicable"] as const
export const warrantyUnits = ["Months", "Years"] as const

export const yesNo = ["Yes", "No"] as const

/**
 * Images captured at onboarding. The first three are mandatory: without a
 * nameplate photo the ratings on the form cannot be checked against the asset.
 */
export const assetImageSlots = [
  { key: "front", label: "Front View", required: true },
  { key: "side", label: "Side View", required: true },
  { key: "nameplate", label: "Nameplate", required: true },
  { key: "panel", label: "Panel / Accessories", required: false },
  { key: "area", label: "Overall Area", required: false },
] as const

export type AssetImageSlot = (typeof assetImageSlots)[number]["key"]

/** Documents collected at onboarding, in the order the mockup lists them */
export const assetDocumentTypes = [
  { key: "nameplate", label: "Nameplate Photo (Close-up)", required: true },
  { key: "datasheet", label: "Manufacturer Datasheet", required: false },
  { key: "installation", label: "Installation Report (if available)", required: false },
  { key: "sld", label: "Single Line Diagram (SLD)", required: false },
  { key: "warranty", label: "Warranty Certificate", required: false },
  { key: "other", label: "Other Documents", required: false },
] as const

export type AssetDocumentType = (typeof assetDocumentTypes)[number]["key"]

/* ---------- Work ---------- */

export const inspectionTypes = [
  "Visual Inspection",
  "Thermal Inspection",
  "Fire Prevention System Inspection",
  "Re-inspection",
] as const

export const maintenanceTypes = [
  "Preventive Maintenance",
  "Condition-Based Maintenance",
  "Fire Preventive Maintenance",
] as const

export const taskPriorities = ["Low", "Medium", "High", "Urgent / Emergency"] as const

export const taskStatuses = [
  "Assigned",
  "Accepted",
  "Pending",
  "In Progress",
  "On Hold",
  "Completed",
  "Closed",
] as const

export const inspectionStatuses = ["Pending", "In Progress", "Submitted", "Completed"] as const

/* ---------- Measurement ---------- */

export const measurementParameters = [
  "Rated Voltage",
  "Rated Current",
  "Rated Capacity",
  "Temperature",
  "Ambient Temperature",
  "Winding Temperature",
  "Oil Temperature",
  "Load Current",
  "Load %",
  "Voltage",
  "Current Total Harmonic Distortion (THD)",
  "Power Factor",
  "Frequency",
  "Insulation Resistance",
  "Earth Resistance",
  "Partial Discharge",
  "Thermal Hotspot Temperature",
  "Temperature Difference / ΔT",
  "Contamination Level",
  "Humidity",
  "Fire Prevention Status",
  "Other Asset-Type Specific Parameter",
] as const

export const measurementUnits = [
  "V", "kV", "mV", "A", "kA", "mA", "VA", "kVA", "MVA",
  "W", "kW", "MW", "Hz", "°C", "%", "Ω", "kΩ", "MΩ", "dB", "Other",
] as const

/** Short codes for the unit select next to a capacity value */
export const plantCapacityUnitCodes = ["MW", "MVA", "kVA", "kW", "MWp", "HP", "MTPA"] as const

export const plantCapacityUnits = [
  "MW — Megawatt",
  "MVA — Mega Volt-Ampere",
  "kVA — Kilo Volt-Ampere",
  "kW — Kilowatt",
  "MWp — Megawatt Peak (solar)",
  "HP — Horsepower",
] as const

export const acVoltageRatings = [
  "24 V AC", "48 V AC", "110 V AC", "230 V AC", "240 V AC", "415 V AC", "440 V AC", "690 V AC",
  "3.3 kV AC", "6.6 kV AC", "11 kV AC", "22 kV AC", "33 kV AC",
  "66 kV AC", "110 kV AC", "132 kV AC", "220 kV AC", "400 kV AC", "765 kV AC", "Other",
] as const

export const dcVoltageRatings = [
  "12 V DC", "24 V DC", "48 V DC", "110 V DC", "125 V DC", "220 V DC", "600 V DC", "750 V DC", "1000 V DC",
] as const

/* ---------- Health score ---------- */

/** Health score bands from the specification */
export const healthBands = [
  { min: 70, max: 100, label: "Healthy", tone: "healthy" as const },
  // Client's Parameters sheet: 50–69 = Attention Required (Orange)
  { min: 50, max: 69, label: "Attention Required", tone: "attention" as const },
  { min: 0, max: 49, label: "At Risk", tone: "critical" as const },
]

export const healthBandFor = (score: number) =>
  healthBands.find((b) => score >= b.min && score <= b.max) ?? healthBands[healthBands.length - 1]

/** Scoring weights from the specification */
export const healthScoreWeights = [
  { input: "Visual Contamination", weight: 70 },
  { input: "Thermal Condition", weight: 20 },
  { input: "Fire Prevention Status", weight: 10 },
]
