/**
 * Mock data for building the OCC screens before the API exists.
 * Values mirror the mockups. Replace with API calls (TanStack Query) later.
 */
import type { AlertSeverity, HealthStatus, WorkStatus } from "@/lib/status"

export const globalKpis = {
  enterprises: { value: 128, change: 6 },
  plants: { value: 548, change: 4 },
  assets: { value: 86427, change: 8 },
  healthy: { value: 78642, percent: 91 },
  attention: { value: 5932, percent: 7 },
  critical: { value: 1853, percent: 2 },
  countries: 18,
  elpremars: 1248,
}

export type CriticalAlert = {
  id: string
  time: string
  severity: AlertSeverity
  asset: string
  plant: string
  enterprise: string
  issue: string
  status: WorkStatus
}

export const criticalAlerts: CriticalAlert[] = [
  { id: "ALT-1042", time: "10:12", severity: "critical", asset: "LT Panel - P2", plant: "Nagpur", enterprise: "Tata Steel", issue: "High temperature detected (92°C)", status: "open" },
  { id: "ALT-1041", time: "09:48", severity: "critical", asset: "Transformer - T1", plant: "Chennai", enterprise: "Reliance Industries", issue: "Abnormal vibration", status: "open" },
  { id: "ALT-1040", time: "09:32", severity: "warning", asset: "MCC-01", plant: "Pune", enterprise: "JSW Group", issue: "Inspection overdue", status: "open" },
  { id: "ALT-1039", time: "08:55", severity: "critical", asset: "UPS-03", plant: "Delhi", enterprise: "Adani Group", issue: "Output voltage deviation", status: "in_progress" },
  { id: "ALT-1038", time: "08:20", severity: "warning", asset: "LT Panel - B1", plant: "Dubai", enterprise: "NTPC", issue: "Contamination level high", status: "open" },
  { id: "ALT-1037", time: "07:41", severity: "warning", asset: "PCC - Main", plant: "Mumbai Works", enterprise: "Tata Steel", issue: "Partial discharge above limit (21 dB)", status: "in_progress" },
  { id: "ALT-1036", time: "06:15", severity: "info", asset: "DB-01", plant: "Hosur", enterprise: "ABC Industries", issue: "Sensor offline for 30 minutes", status: "closed" },
]

export const enterpriseStatus: { status: HealthStatus | "onboarding"; value: number }[] = [
  { status: "healthy", value: 86 },
  { status: "attention", value: 24 },
  { status: "critical", value: 9 },
  { status: "onboarding", value: 9 },
]

export const plantStatus: { status: HealthStatus; value: number }[] = [
  { status: "healthy", value: 402 },
  { status: "attention", value: 98 },
  { status: "critical", value: 34 },
  { status: "offline", value: 14 },
]

export const systemConnectivity = [
  { name: "EMMSE Platform", status: "Online", detail: "99.8% Uptime" },
  { name: "EVITA Cloud", status: "Online", detail: "99.5% Uptime" },
  { name: "OCC Services", status: "Online", detail: "99.9% Uptime" },
  { name: "Data Sync", status: "Healthy", detail: "Last sync: 2 mins ago" },
]

export const recentActivities = [
  { title: "New enterprise onboarded", detail: "ABC Industries Ltd.", time: "25 mins ago", kind: "enterprise" },
  { title: "Plant added", detail: "ABC - Hosur", time: "42 mins ago", kind: "plant" },
  { title: "Asset inspection completed", detail: "LT Panel - HP1 (Chennai)", time: "1 hour ago", kind: "inspection" },
  { title: "Support ticket resolved", detail: "#TK-4587", time: "2 hours ago", kind: "ticket" },
] as const

export type MapPlant = {
  name: string
  enterprise: string
  lng: number
  lat: number
  status: HealthStatus
}

export const mapPlants: MapPlant[] = [
  { name: "Mumbai Works", enterprise: "Tata Steel", lng: 72.88, lat: 19.08, status: "healthy" },
  { name: "Jamshedpur", enterprise: "Tata Steel", lng: 86.2, lat: 22.8, status: "critical" },
  { name: "Jamnagar", enterprise: "Reliance Industries", lng: 70.06, lat: 22.47, status: "healthy" },
  { name: "Dolvi", enterprise: "JSW Group", lng: 73.0, lat: 18.7, status: "attention" },
  { name: "Mundra", enterprise: "Adani Group", lng: 69.72, lat: 22.84, status: "healthy" },
  { name: "Nagpur", enterprise: "Tata Steel", lng: 79.09, lat: 21.15, status: "critical" },
  { name: "Chennai", enterprise: "Reliance Industries", lng: 80.27, lat: 13.08, status: "attention" },
  { name: "Pune", enterprise: "JSW Group", lng: 73.86, lat: 18.52, status: "attention" },
  { name: "Delhi", enterprise: "Adani Group", lng: 77.21, lat: 28.61, status: "healthy" },
  { name: "Hosur", enterprise: "ABC Industries", lng: 77.83, lat: 12.74, status: "healthy" },
  { name: "Kolkata", enterprise: "NTPC", lng: 88.36, lat: 22.57, status: "healthy" },
  { name: "Hyderabad", enterprise: "NTPC", lng: 78.49, lat: 17.39, status: "healthy" },
  { name: "Dubai", enterprise: "NTPC", lng: 55.27, lat: 25.2, status: "attention" },
  { name: "Riyadh", enterprise: "Reliance Industries", lng: 46.68, lat: 24.71, status: "healthy" },
  { name: "Frankfurt", enterprise: "Tata Steel", lng: 8.68, lat: 50.11, status: "healthy" },
  { name: "IJmuiden", enterprise: "Tata Steel", lng: 4.6, lat: 52.46, status: "attention" },
  { name: "Houston", enterprise: "Reliance Industries", lng: -95.37, lat: 29.76, status: "healthy" },
  { name: "Toronto", enterprise: "JSW Group", lng: -79.38, lat: 43.65, status: "healthy" },
  { name: "São Paulo", enterprise: "Adani Group", lng: -46.63, lat: -23.55, status: "critical" },
  { name: "Johannesburg", enterprise: "NTPC", lng: 28.05, lat: -26.2, status: "healthy" },
  { name: "Singapore", enterprise: "Tata Steel", lng: 103.82, lat: 1.35, status: "healthy" },
  { name: "Jakarta", enterprise: "Adani Group", lng: 106.85, lat: -6.21, status: "attention" },
  { name: "Sydney", enterprise: "JSW Group", lng: 151.21, lat: -33.87, status: "healthy" },
]

/** Region call-outs drawn on the global map */
export const mapRegionLabels = [
  { region: "North America", customers: 12, plants: 48, lng: -100, lat: 45 },
  { region: "Europe", customers: 28, plants: 142, lng: 12, lat: 51 },
  { region: "Middle East", customers: 6, plants: 32, lng: 45, lat: 33 },
  { region: "Asia", customers: 34, plants: 201, lng: 118, lat: 30 },
  { region: "South America", customers: 4, plants: 22, lng: -60, lat: -18 },
  { region: "Africa", customers: 6, plants: 18, lng: 22, lat: 2 },
  { region: "Australia", customers: 2, plants: 10, lng: 138, lat: -30 },
]

export const regionSummary = [
  { region: "India", customers: 52 },
  { region: "Middle East", customers: 18 },
  { region: "Asia (excl. India)", customers: 16 },
  { region: "Europe", customers: 14 },
  { region: "North America", customers: 12 },
  { region: "Africa", customers: 8 },
  { region: "South America", customers: 6 },
  { region: "Australia", customers: 2 },
]

export const topCustomers = [
  { name: "Tata Steel", assets: 6842 },
  { name: "Reliance Industries", assets: 5921 },
  { name: "JSW Group", assets: 4876 },
  { name: "Adani Group", assets: 3994 },
  { name: "NTPC", assets: 3118 },
]

export const indiaOverview = { customers: 52, plants: 238, assets: 38642 }

export const liveActivity = [
  { time: "10:22", title: "New plant onboarded", detail: "ABC Industries Ltd. • Gujarat, India", kind: "plant" },
  { time: "10:18", title: "Asset inspection completed", detail: "LT Panel - P1 • Reliance • Jamnagar", kind: "inspection" },
  { time: "10:14", title: "Critical alert raised", detail: "Transformer T-2 • Tata Steel • Jamshedpur", kind: "alert" },
  { time: "10:11", title: "EMMSE sync completed", detail: "Adani Power • Mundra", kind: "sync" },
  { time: "10:08", title: "Support ticket resolved", detail: "#TK-4587 • Closed", kind: "ticket" },
] as const

/* ---------- Onboarding dropdown options ---------- */

export const enterpriseTypes = ["Manufacturing", "Power & Utilities", "Oil & Gas", "Infrastructure", "Data Centre", "Transport", "Other"]
export const industrySectors = ["Steel & Metals", "Petrochemicals", "Power Generation", "Cement", "Automotive", "Pharmaceuticals", "FMCG", "IT / Data Centres", "Other"]
export const countries = ["India", "United Arab Emirates", "Saudi Arabia", "Singapore", "United Kingdom", "Germany", "Netherlands", "United States", "Brazil", "South Africa", "Australia"]
export const indianStates = ["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi", "Telangana", "West Bengal", "Jharkhand", "Odisha", "Uttar Pradesh", "Rajasthan"]
export const plantTypes = ["Integrated Steel Plant", "Refinery", "Power Plant", "Cement Plant", "Manufacturing Unit", "Data Centre", "Substation", "Other"]
/** @deprecated use departmentTypes from @/data/master-data (Olivine platform spec) */
export const departmentTypes = ["Engineering", "Operations", "Maintenance", "Utilities", "Quality", "Safety"]
export const subDepartmentFunctions = ["Maintenance", "Operations", "Testing", "Projects"]
export const salutations = ["Mr.", "Ms.", "Mrs.", "Dr.", "Er.", "Prof."]
export const timeZones = ["(UTC+05:30) India Standard Time", "(UTC+04:00) Gulf Standard Time", "(UTC+03:00) Arabia Standard Time", "(UTC+08:00) Singapore Time", "(UTC+00:00) GMT", "(UTC+01:00) Central European Time"]

/* ---------- ELPREMAR ---------- */


export type Elpremar = {
  id: string
  name: string
  department: string
  plant: string
  enterprise: string
  phone: string
  email: string
  available: boolean
  skills: string[]
}

export const elpremars: Elpremar[] = [
  { id: "EMP-EL-0047", name: "Suresh Kumar", department: "Electrical", plant: "Mumbai Works", enterprise: "Tata Steel Limited", phone: "+91 98765 43210", email: "suresh.kumar@tatasteel.com", available: true, skills: ["HT Panels & Switchgear", "Thermography", "Routine Inspections"] },
  { id: "EMP-EL-0052", name: "Amit Sharma", department: "Electrical", plant: "Jamnagar", enterprise: "Reliance Industries", phone: "+91 98111 22334", email: "amit.sharma@ril.com", available: true, skills: ["Transformers", "Condition Monitoring", "Cable Testing"] },
  { id: "EMP-EL-0061", name: "Ramesh Patil", department: "Maintenance", plant: "Dolvi", enterprise: "JSW Group", phone: "+91 99200 44556", email: "ramesh.patil@jsw.in", available: false, skills: ["Breaker Maintenance", "INSTA CLEAN Application", "Routine Inspections"] },
  { id: "EMP-EL-0073", name: "Anil Singh", department: "Electrical", plant: "Mundra", enterprise: "Adani Group", phone: "+91 97654 11223", email: "anil.singh@adani.com", available: true, skills: ["Protection & Relay Testing", "HT Panels & Switchgear", "Earthing & Lightning Protection"] },
  { id: "EMP-EL-0081", name: "Priya Nair", department: "Electrical", plant: "Hyderabad", enterprise: "NTPC", phone: "+91 98480 55667", email: "priya.nair@ntpc.co.in", available: true, skills: ["Thermography", "Condition Monitoring", "Transformers"] },
  { id: "EMP-EL-0094", name: "Khalid Rahman", department: "Electrical", plant: "Dubai", enterprise: "NTPC", phone: "+971 50 123 4567", email: "khalid.rahman@ntpc.ae", available: true, skills: ["HT Panels & Switchgear", "Breaker Maintenance", "Cable Testing"] },
  { id: "EMP-EL-0102", name: "Lukas Weber", department: "Maintenance", plant: "Frankfurt", enterprise: "Tata Steel Limited", phone: "+49 151 2345 6789", email: "lukas.weber@tatasteel.de", available: true, skills: ["Earthing & Lightning Protection", "Routine Inspections", "INSTA CLEAN Application"] },
  { id: "EMP-EL-0115", name: "Maria Lopez", department: "Electrical", plant: "Houston", enterprise: "Reliance Industries", phone: "+1 713 555 0142", email: "maria.lopez@ril.com", available: false, skills: ["Transformers", "Protection & Relay Testing", "Thermography"] },
]

export const enterprises = ["Tata Steel Limited", "Reliance Industries", "JSW Group", "Adani Group", "NTPC", "ABC Industries Ltd."]
export const plants = ["Mumbai Works", "Jamshedpur", "Jamnagar", "Dolvi", "Mundra", "Hosur"]
export const areas = ["Main Substation (11kV)", "LT Panels - Block A", "DG Set Area", "Production Floor", "Utility Area", "Cable Trench"]
export const assetCategories = ["LT Panel", "HT Panel", "APFC Panel", "MCC", "PCC", "PDB", "Switchboard", "MCB Panel", "MCCB Panel", "Transformer", "UPS", "VFD/Servo Drives", "PLC", "SCADA/DCS Equipment", "Control Panel", "Distribution Board", "Fire Alarm Panel", "LAN/Network Electrical Equip.", "Others"]
export const activityTypes = ["Preventive Assessment", "Visual Inspection", "Thermal Scan", "Panel Cleaning (INSTA CLEAN)", "Insulation Resistance Testing", "Partial Discharge Testing", "Fire Prevention System Check"]
export const durations = ["1 Hour", "2 Hours", "4 Hours", "6 Hours", "8 Hours"]
export const priorities = ["Low", "Medium", "High", "Critical"] as const
export const supervisors = ["Ramesh Patil", "Amit Verma", "R. K. Sharma", "S. Krishnan"]
export const shiftOptions = ["General Shift (Rotational)", "Morning Shift", "Evening Shift", "Night Shift"]
export const elpremarSkills = [
  "HT Panels & Switchgear",
  "Transformers",
  "Protection & Relay Testing",
  "Routine Inspections",
  "Thermography",
  "Breaker Maintenance",
  "Cable Testing",
  "Earthing & Lightning Protection",
  "Condition Monitoring",
  "INSTA CLEAN Application",
]

export const todaysTasks: { time: string; asset: string; activity: string; status: WorkStatus }[] = [
  { time: "09:00", asset: "LT Panels - Block A", activity: "Inspection", status: "completed" },
  { time: "11:30", asset: "DG Set - Unit 2", activity: "Testing", status: "in_progress" },
  { time: "14:00", asset: "Cable Trench", activity: "Visual Check", status: "pending" },
]

export type AssignedTask = {
  date: string
  elpremar: string
  enterprise: string
  location: string
  activity: string
  priority: (typeof priorities)[number]
  status: WorkStatus
}

export const recentAssignedTasks: AssignedTask[] = [
  { date: "27-05-2025", elpremar: "Suresh Kumar", enterprise: "Tata Steel Limited", location: "LT Panels - Block A", activity: "Inspection", priority: "Medium", status: "completed" },
  { date: "28-05-2025", elpremar: "Suresh Kumar", enterprise: "Tata Steel Limited", location: "Main Substation (11kV)", activity: "Assessment", priority: "High", status: "assigned" },
  { date: "29-05-2025", elpremar: "Amit Sharma", enterprise: "Reliance Industries", location: "DG Set - Unit 1", activity: "Testing", priority: "Medium", status: "assigned" },
]

/**
 * A plausible in-service date for an asset, as `dd-MM-yyyy`. Takes the caller's
 * seeded RNG so a given activity always reports the same commissioning date.
 */
export function commissionDate(random: () => number) {
  const day = 1 + Math.floor(random() * 28)
  const month = 1 + Math.floor(random() * 12)
  const year = 2010 + Math.floor(random() * 14)
  return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`
}
