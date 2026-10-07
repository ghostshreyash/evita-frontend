/**
 * Operational tables and regional slices for the OCC screens.
 * Kept separate from mock.ts so the dashboard/map data stays readable.
 * Replace with API calls (TanStack Query) later.
 */
import { addDays, format } from "date-fns"

import type { HealthStatus, WorkStatus } from "@/lib/status"
import { activeElpremarNames, dialCodeFor, elpremarNames, postalCodeForCity, type AssetCriticality, type EnterpriseScale } from "@/data/master-data"
import { activityTypes, priorities, assetCategories } from "@/data/mock"

export type Priority = (typeof priorities)[number]

/**
 * Mock bookings are pinned to today rather than to fixed dates, so the console
 * always shows live work and the assign dialog can open on a row's own day.
 * `day(2)` is the day after tomorrow. Drop this once the tables come from the API.
 */
const day = (offset: number) => format(addDays(new Date(), offset), "dd-MM-yyyy")

/* ---------- India slice (India Customer Map page) ---------- */

export const indiaKpis = {
  enterprises: { value: 52, change: 5 },
  plants: { value: 238, change: 4 },
  assets: { value: 38642, change: 7 },
  healthy: { value: 35150, percent: 91 },
  attention: { value: 2690, percent: 7 },
  critical: { value: 802, percent: 2 },
  elpremars: 604,
}

export const indiaEnterpriseStatus: { status: HealthStatus | "onboarding"; value: number }[] = [
  { status: "healthy", value: 34 },
  { status: "attention", value: 11 },
  { status: "critical", value: 4 },
  { status: "onboarding", value: 3 },
]

export const indiaPlantStatus: { status: HealthStatus; value: number }[] = [
  { status: "healthy", value: 176 },
  { status: "attention", value: 41 },
  { status: "critical", value: 15 },
  { status: "offline", value: 6 },
]

/* ---------- Working day ---------- */

/** Hour-long intervals a job can be booked into (09:00 - 18:00) */
export const daySlots = [9, 10, 11, 12, 13, 14, 15, 16, 17]

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`

/** 14 -> "14:00 - 15:00" */
export const slotLabel = (hour: number) => `${hh(hour)} - ${hh(hour + 1)}`

/**
 * Slot for a job the mock data records no time for. Hashing the job's own key
 * keeps it stable between renders without putting a time on every legacy row.
 */
export function slotFor(key: string) {
  const n = [...key].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return daySlots[n % daySlots.length]
}

/* ---------- Maintenance ---------- */

/** The maintenance programmes an activity can belong to */
export const maintenanceTypes = ["Preventive", "Condition-Based", "Fire Preventive"] as const

export type MaintenanceType = (typeof maintenanceTypes)[number]

export type MaintenanceRow = {
  id: string
  asset: string
  plant: string
  enterprise: string
  country: string
  type: MaintenanceType
  /** Planned work is always owned and booked, so these are never blank */
  elpremar: string
  scheduled: string
  /** Hour the booked interval starts */
  slot: number
  status: WorkStatus
  /** The inspection this work traces back to. Every job has one. */
  inspectionId: string
}

/** A row before its inspection is attached — the inspection queue is built later */
type UnlinkedMaintenance = Omit<MaintenanceRow, "inspectionId">

export const maintenanceProgress: MaintenanceRow[] = [
  { id: "MT-2291", asset: "LT Panel - Block A", plant: "Mumbai Unit 2", enterprise: "Tata Steel Limited", country: "India", type: "Preventive", elpremar: "Suresh Kumar", scheduled: day(-2), slot: 9, inspectionId: "TSK-8841", status: "completed" },
  { id: "MT-2290", asset: "Transformer - T1", plant: "Jamnagar Substation", enterprise: "Reliance Industries", country: "India", type: "Condition-Based", elpremar: "Amit Sharma", scheduled: day(0), slot: 10, inspectionId: "TSK-8840", status: "open" },
  { id: "MT-2289", asset: "MCC - Unit 2", plant: "Dolvi Substation", enterprise: "JSW Group", country: "India", type: "Preventive", elpremar: "Ramesh Patil", scheduled: day(0), slot: 9, inspectionId: "TSK-8839", status: "in_progress" },
  { id: "MT-2288", asset: "PCC - Main", plant: "Mundra Warehouse", enterprise: "Adani Group", country: "India", type: "Fire Preventive", elpremar: "Anil Singh", scheduled: day(2), slot: 11, inspectionId: "TSK-8838", status: "open" },
  // Deliberately shares Suresh Kumar's 10:00 slot with TSK-8837, so the dialog has a clash to show
  { id: "MT-2287", asset: "HT Panel - Incomer 1", plant: "Hyderabad Main Plant", enterprise: "NTPC", country: "India", type: "Preventive", elpremar: "Suresh Kumar", scheduled: day(3), slot: 10, inspectionId: "TSK-8837", status: "assigned" },
  { id: "MT-2286", asset: "APFC Panel - 1", plant: "Dubai Main Plant", enterprise: "Emirates Steel", country: "United Arab Emirates", type: "Preventive", elpremar: "Khalid Rahman", scheduled: day(1), slot: 11, inspectionId: "TSK-8836", status: "open" },
  { id: "MT-2285", asset: "UPS - 03", plant: "Frankfurt Utility Block", enterprise: "Thyssenkrupp AG", country: "Germany", type: "Fire Preventive", elpremar: "Lukas Weber", scheduled: day(4), slot: 10, inspectionId: "TSK-8835", status: "assigned" },
  { id: "MT-2284", asset: "Switchboard - SB2", plant: "Houston Main Plant", enterprise: "LyondellBasell", country: "United States", type: "Condition-Based", elpremar: "Maria Lopez", scheduled: day(1), slot: 15, inspectionId: "TSK-8834", status: "open" },
]

/**
 * The dashboard panel shows the latest few; the Maintenance Activities screen
 * shows the whole book of work. Generated from fixed pools with a seeded RNG so
 * ids, owners and intervals stay put between renders, and so nobody is booked
 * into the same interval twice. Replace with GET /maintenance-activities later.
 */

const units = ["Block A", "Block B", "Unit 1", "Unit 2", "Unit 3", "Main", "Incomer 1", "Incomer 2", "T1", "T2", "SB1", "SB2", "03", "04"]
const workStates: WorkStatus[] = ["open", "assigned", "in_progress", "completed"]

function moreMaintenance(count: number): UnlinkedMaintenance[] {
  let seed = 20250528
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: T[]) => pool[Math.floor(random() * pool.length)]
  const taken = new Set(maintenanceProgress.map((m) => `${m.elpremar}|${m.scheduled}|${m.slot}`))
  const rows: UnlinkedMaintenance[] = []

  for (let i = 0; i < count; i++) {
    // Walked in order, not picked at random, so every site and every
    // ELPREMAR is guaranteed to appear once the count covers the pools
    const site = sites[i % sites.length]
    const elpremar = crew[(i) % crew.length]
    const scheduled = day(Math.floor(random() * 50) - 28)
    let slot = pick(daySlots)
    // Shift along the day rather than book the same person twice at once
    for (let n = 0; n < daySlots.length && taken.has(`${elpremar}|${scheduled}|${slot}`); n++)
      slot = daySlots[(daySlots.indexOf(slot) + 1) % daySlots.length]
    taken.add(`${elpremar}|${scheduled}|${slot}`)

    rows.push({
      id: `MT-${2283 - i}`,
      asset: `${pick(assetCategories)} - ${pick(units)}`,
      plant: site.plant,
      enterprise: site.enterprise,
      country: site.country,
      type: pick([...maintenanceTypes]),
      elpremar,
      scheduled,
      slot,
      status: pick(workStates),
    })
  }
  return rows
}


/* ---------- Tasks ---------- */

/** An inspection task only ever waits, runs or finishes — there is no separate assigned state */
export type TaskStatus = Extract<WorkStatus, "pending" | "in_progress" | "completed">

export type TaskRow = {
  id: string
  /** Owned and booked from the start, so these are never blank */
  elpremar: string
  enterprise: string
  plant: string
  asset: string
  country: string
  /** An inspection activity — cleaning is maintenance work and belongs on that tab */
  activity: string
  due: string
  /** Hour the booked interval starts */
  slot: number
  priority: Priority
  status: TaskStatus
}

export const taskQueue: TaskRow[] = [
  { id: "TSK-8841", elpremar: "Suresh Kumar", enterprise: "Tata Steel Limited", plant: "Mumbai Unit 2", asset: "LT Panel - Block A", country: "India", activity: "Thermal Scan", due: day(0), slot: 11, priority: "High", status: "in_progress" },
  { id: "TSK-8840", elpremar: "Amit Sharma", enterprise: "Reliance Industries", plant: "Jamnagar Substation", asset: "Transformer - T1", country: "India", activity: "Partial Discharge Testing", due: day(2), slot: 11, priority: "Critical", status: "pending" },
  { id: "TSK-8839", elpremar: "Ramesh Patil", enterprise: "JSW Group", plant: "Dolvi Substation", asset: "MCC - Unit 2", country: "India", activity: "Visual Inspection", due: day(3), slot: 11, priority: "Medium", status: "pending" },
  { id: "TSK-8838", elpremar: "Anil Singh", enterprise: "Adani Group", plant: "Mundra Warehouse", asset: "PCC - Main", country: "India", activity: "Preventive Assessment", due: day(-3), slot: 10, priority: "Low", status: "completed" },
  { id: "TSK-8837", elpremar: "Suresh Kumar", enterprise: "NTPC", plant: "Hyderabad Main Plant", asset: "HT Panel - Incomer 1", country: "India", activity: "Insulation Resistance Testing", due: day(3), slot: 10, priority: "Medium", status: "pending" },
  { id: "TSK-8836", elpremar: "Khalid Rahman", enterprise: "Emirates Steel", plant: "Dubai Main Plant", asset: "APFC Panel - 1", country: "United Arab Emirates", activity: "Preventive Assessment", due: day(2), slot: 9, priority: "High", status: "pending" },
  { id: "TSK-8835", elpremar: "Lukas Weber", enterprise: "Thyssenkrupp AG", plant: "Frankfurt Utility Block", asset: "Fire Alarm Panel - FA1", country: "Germany", activity: "Fire Prevention System Check", due: day(4), slot: 14, priority: "Medium", status: "pending" },
  { id: "TSK-8834", elpremar: "Maria Lopez", enterprise: "LyondellBasell", plant: "Houston Main Plant", asset: "Switchboard - SB2", country: "United States", activity: "Thermal Scan", due: day(5), slot: 9, priority: "Low", status: "pending" },
]

/**
 * The dashboard panel shows the latest few; the Inspection Activities screen
 * shows the whole queue. Same seeded approach as the maintenance book, and it
 * checks the maintenance bookings too so nobody is sent to two jobs at once.
 */
const inspectionWork = activityTypes.filter((a) => a !== "Panel Cleaning (INSTA CLEAN)")

function moreInspections(count: number): TaskRow[] {
  let seed = 20250529
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: T[]) => pool[Math.floor(random() * pool.length)]
  const taken = new Set(
    [...maintenanceBook.map((m) => `${m.elpremar}|${m.scheduled}|${m.slot}`),
     ...taskQueue.map((t) => `${t.elpremar}|${t.due}|${t.slot}`)]
  )
  const states: TaskStatus[] = ["pending", "in_progress", "completed"]
  const rows: TaskRow[] = []

  for (let i = 0; i < count; i++) {
    // Walked in order, not picked at random, so every site and every
    // ELPREMAR is guaranteed to appear once the count covers the pools
    const site = sites[i % sites.length]
    const elpremar = crew[(i * 3) % crew.length]
    const due = day(Math.floor(random() * 50) - 28)
    let slot = pick(daySlots)
    for (let n = 0; n < daySlots.length && taken.has(`${elpremar}|${due}|${slot}`); n++)
      slot = daySlots[(daySlots.indexOf(slot) + 1) % daySlots.length]
    taken.add(`${elpremar}|${due}|${slot}`)

    rows.push({
      id: `TSK-${8833 - i}`,
      elpremar,
      enterprise: site.enterprise,
      plant: site.plant,
      asset: `${pick(assetCategories)} - ${pick(units)}`,
      country: site.country,
      activity: pick(inspectionWork),
      due,
      slot,
      priority: pick([...priorities]),
      status: pick(states),
    })
  }
  return rows
}


/* ---------- Support tickets ---------- */

/**
 * What the ticket is about; drives the Category column on the tickets table.
 * Technical = field device / instrument faults, System = OCC platform and app
 * issues, Asset = panel or QR/asset-record problems, Access = user and role
 * requests, Report = health reports and exports, Assignment = ELPREMAR requests.
 *
 * Configurable: the Raise Ticket form and the Category filter both read this
 * list, so adding a category here is the only change a new one needs.
 */
export const ticketCategories = [
  "System",
  "Technical",
  "Assignment",
  "Asset",
  "Inspection",
  "Testing & Measurement",
  "Maintenance",
  "Report",
  "Access",
  "Data/Sync",
  "Dashboard",
  "Other",
] as const

export type TicketCategory = (typeof ticketCategories)[number]

/**
 * Which EVITA / OLIVINE module the ticket came from. A ticket raised inside a
 * module carries its context across (asset, inspection or report id), so OCC
 * never has to ask the reporter which record they were looking at.
 */
export const ticketSources = [
  "OCC Console",
  "EVITA",
  "EMMSE",
  "Asset",
  "Inspection",
  "Testing & Measurements",
  "Maintenance",
  "Reports",
] as const

export type TicketSource = (typeof ticketSources)[number]

export type TicketRow = {
  id: string
  enterprise: string
  plant: string
  country: string
  subject: string
  category: TicketCategory
  raised: string
  /** Who reported it — an enterprise or plant user, not the OCC desk */
  raisedBy: string
  /** The module the ticket was raised from */
  source: TicketSource
  /** Last status change / comment / assignment, as `dd-MM-yyyy HH:mm` */
  lastUpdated: string
  /** Who the ticket is assigned to (ELPREMAR or OCC desk owner) */
  elpremar?: string
  scheduled?: string
  /** Hour the booked interval starts */
  slot?: number
  priority: Priority
  status: WorkStatus
  /** What was done about it, captured when the ticket is closed */
  resolution?: string
  /* --- contextual references, carried from the originating module --- */
  /** Digital Asset ID the ticket is about */
  assetId?: string
  inspectionId?: string
  maintenanceId?: string
  reportId?: string
}

/** `dd-MM-yyyy HH:mm`, for the Last Updated stamp and the activity history */
const stamp = (offset: number, hour: number) => `${day(offset)} ${hh(hour)}`

/** Enterprise and plant people who report problems, kept apart from the field crew */
const requesters = [
  "Rajesh Iyer",
  "Meena Krishnan",
  "Arun Prakash",
  "Sneha Gupta",
  "Imran Qureshi",
  "Fatima Al Nuaimi",
  "Hans Richter",
  "Elena Fischer",
  "Diego Alvarez",
  "Grace Tan",
]

export const supportTickets: TicketRow[] = [
  { id: "TK-4592", enterprise: "Tata Steel Limited", plant: "Jamshedpur Main Plant", country: "India", subject: "EVITA sync failing on tablet", category: "System", raised: day(-1), raisedBy: "Rajesh Iyer", source: "EVITA", lastUpdated: stamp(-1, 10), priority: "High", status: "open" },
  { id: "TK-4591", enterprise: "JSW Group", plant: "Dolvi Substation", country: "India", subject: "Request ELPREMAR assignment", category: "Assignment", raised: day(-1), raisedBy: "Meena Krishnan", source: "OCC Console", lastUpdated: stamp(-1, 12), priority: "Medium", status: "open" },
  { id: "TK-4590", enterprise: "Reliance Industries", plant: "Jamnagar Substation", country: "India", subject: "PD meter not pairing over Bluetooth", category: "Testing & Measurement", raised: day(-2), raisedBy: "Arun Prakash", source: "Testing & Measurements", lastUpdated: stamp(0, 9), elpremar: "Amit Sharma", scheduled: day(1), slot: 11, priority: "Critical", status: "in_progress", assetId: "AST-JMN-0142", inspectionId: "TSK-8840" },
  { id: "TK-4589", enterprise: "Adani Group", plant: "Mundra Warehouse", country: "India", subject: "Health report PDF not downloading", category: "Report", raised: day(-2), raisedBy: "Sneha Gupta", source: "Reports", lastUpdated: stamp(-1, 15), elpremar: "Anil Singh", scheduled: day(-2), slot: 10, priority: "Low", status: "closed", reportId: "RPT-MUN-2291", resolution: "Export service restarted; the report now downloads as PDF." },
  { id: "TK-4588", enterprise: "NTPC", plant: "Kolkata Unit 2", country: "India", subject: "Add new sub-division to hierarchy", category: "System", raised: day(-3), raisedBy: "Imran Qureshi", source: "OCC Console", lastUpdated: stamp(-2, 11), elpremar: "Priya Nair", scheduled: day(-3), slot: 14, priority: "Medium", status: "closed", resolution: "Sub-division added under Electrical and access granted." },
  { id: "TK-4587", enterprise: "Emirates Steel", plant: "Dubai Main Plant", country: "United Arab Emirates", subject: "EMMSE dashboard loading slowly", category: "Dashboard", raised: day(-3), raisedBy: "Fatima Al Nuaimi", source: "EMMSE", lastUpdated: stamp(-2, 16), elpremar: "Khalid Rahman", scheduled: day(-2), slot: 9, priority: "Medium", status: "closed", resolution: "Widget query tuned; dashboard now loads within 2s." },
  { id: "TK-4586", enterprise: "Tata Steel Europe", plant: "IJmuiden Unit 2", country: "Netherlands", subject: "Asset QR code not scanning", category: "Asset", raised: day(-4), raisedBy: "Hans Richter", source: "Asset", lastUpdated: stamp(-4, 13), priority: "High", status: "open", assetId: "AST-IJM-0077" },
  { id: "TK-4585", enterprise: "BHP Group", plant: "Sydney Utility Block", country: "Australia", subject: "User access request for plant head", category: "Access", raised: day(-4), raisedBy: "Grace Tan", source: "OCC Console", lastUpdated: stamp(-3, 10), elpremar: "Lukas Weber", scheduled: day(-4), slot: 15, priority: "Low", status: "closed", resolution: "Plant Head role granted and confirmed with the requester." },
]

/**
 * The dashboard panel shows the latest few; the Support Tickets screen shows the
 * whole desk. Same seeded approach as the maintenance and inspection books, so
 * ids, owners and references stay put between renders.
 */
const ticketSubjectsByCategory: Record<TicketCategory, string[]> = {
  System: ["EVITA sync failing on tablet", "Add new sub-division to hierarchy", "Session times out too quickly"],
  Technical: ["Thermal camera not connecting", "Handheld device will not charge", "Sensor reading drifts after calibration"],
  Assignment: ["Request ELPREMAR assignment", "Reassign shutdown activity to another engineer", "ELPREMAR unavailable for booked slot"],
  Asset: ["Asset QR code not scanning", "Correct the panel rating on record", "Duplicate asset record created"],
  Inspection: ["Inspection checklist missing a step", "Cannot submit inspection from the field", "Inspection photos not uploading"],
  "Testing & Measurement": ["PD meter not pairing over Bluetooth", "IR test values not saving", "Measurement unit shown incorrectly"],
  Maintenance: ["Maintenance activity stuck in progress", "INSTA CLEAN consumables not recorded", "Cannot close out completed maintenance"],
  Report: ["Health report PDF not downloading", "Report shows last month's figures", "Add plant summary to the export"],
  Access: ["User access request for plant head", "Reset login for a new engineer", "Role change for maintenance supervisor"],
  "Data/Sync": ["Offline records not syncing back", "Duplicate readings after sync", "Sync stuck at 80 percent"],
  Dashboard: ["EMMSE dashboard loading slowly", "KPI tile shows a stale count", "Map markers missing for one plant"],
  Other: ["General query on platform usage", "Training request for new joiners", "Feedback on the console layout"],
}

/** Which module a category is most likely raised from */
const sourceForCategory: Record<TicketCategory, TicketSource> = {
  System: "OCC Console",
  Technical: "EVITA",
  Assignment: "OCC Console",
  Asset: "Asset",
  Inspection: "Inspection",
  "Testing & Measurement": "Testing & Measurements",
  Maintenance: "Maintenance",
  Report: "Reports",
  Access: "OCC Console",
  "Data/Sync": "EVITA",
  Dashboard: "EMMSE",
  Other: "OCC Console",
}


/* ---------- ELPREMAR schedule (Assign ELPREMAR dialog) ---------- */

export type ScheduleEntry = {
  date: Date
  kind: "job" | "leave"
  label: string
  /** Hour the job starts; leave covers the whole day and has no slot */
  slot?: number
}

/**
 * Mock schedule for one ELPREMAR: a deterministic spread of jobs and leave
 * over the current and next two months (seeded by ELPREMAR id, so it is
 * stable between renders). Unavailable ELPREMARs start on leave today.
 * Replace with GET /elpremars/:id/schedule later.
 */
export function mockElpremarSchedule(elpremarId: string, available: boolean): ScheduleEntry[] {
  let seed = [...elpremarId].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) >>> 0
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const jobs = [...activityTypes]
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const entries: ScheduleEntry[] = []

  for (let i = 0; i < 92; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const r = random()
    if (date.getDay() === 0) continue // Sundays off
    if (r < 0.06) {
      entries.push({ date, kind: "leave", label: "On leave" })
    } else if (r < 0.42) {
      const count = r < 0.16 ? 2 : 1
      const taken = new Set<number>()
      for (let j = 0; j < count; j++) {
        // Two jobs on one day must not land in the same interval
        let k = Math.floor(random() * daySlots.length)
        while (taken.has(daySlots[k])) k = (k + 1) % daySlots.length
        taken.add(daySlots[k])
        entries.push({ date, kind: "job", label: jobs[Math.floor(random() * jobs.length)], slot: daySlots[k] })
      }
    }
  }

  if (!available) {
    for (let i = 0; i < 5; i++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
      entries.push({ date, kind: "leave", label: "On leave" })
    }
  }
  return entries
}

/* ---------- Enterprise register (Enterprise Onboarding landing) ---------- */

export type EnterpriseRecord = {
  id: string
  name: string
  /** "Industry" or "Retail" - see master-data.sectorTypes */
  sectorType: string
  /** Large / Mid / Small - a separate field from the sector, never combined with it */
  scale: EnterpriseScale
  /** Sector within that type - see master-data.sectorsFor() */
  sector: string
  country: string
  city: string
  plants: number
  assets: number
  elpremars: number
  onboarded: string
  /** Operational health of their assets */
  status: HealthStatus | "onboarding"
  /**
   * Whether the account may be used. Deactivation is how an enterprise is
   * stopped from using the app - records are never deleted, so history stays.
   */
  accountStatus: "active" | "inactive"
}

export const enterpriseRecords: EnterpriseRecord[] = [
  { id: "TSL-ENT-001", name: "Tata Steel Limited", scale: "Large", sectorType: "Industry", sector: "Large Cap", country: "India", city: "Mumbai", plants: 12, assets: 6842, elpremars: 48, onboarded: "12-01-2024", status: "healthy", accountStatus: "active" },
  { id: "RIL-ENT-002", name: "Reliance Industries", scale: "Large", sectorType: "Industry", sector: "Large Cap", country: "India", city: "Jamnagar", plants: 9, assets: 5921, elpremars: 41, onboarded: "03-03-2024", status: "attention", accountStatus: "active" },
  { id: "JSW-ENT-003", name: "JSW Group", scale: "Large", sectorType: "Industry", sector: "Large Cap", country: "India", city: "Dolvi", plants: 11, assets: 4876, elpremars: 36, onboarded: "22-04-2024", status: "healthy", accountStatus: "active" },
  { id: "ADN-ENT-004", name: "Adani Group", scale: "Large", sectorType: "Industry", sector: "Large Cap", country: "India", city: "Mundra", plants: 8, assets: 3994, elpremars: 29, onboarded: "17-06-2024", status: "critical", accountStatus: "active" },
  { id: "NTP-ENT-005", name: "NTPC", scale: "Large", sectorType: "Industry", sector: "Government / PSU", country: "India", city: "Hyderabad", plants: 14, assets: 3118, elpremars: 33, onboarded: "09-08-2024", status: "healthy", accountStatus: "active" },
  { id: "ABC-ENT-006", name: "ABC Industries Ltd.", scale: "Small", sectorType: "Industry", sector: "MSME", country: "India", city: "Hosur", plants: 3, assets: 962, elpremars: 8, onboarded: "27-05-2025", status: "onboarding", accountStatus: "active" },
  { id: "EMR-ENT-007", name: "Emirates Steel", scale: "Small", sectorType: "Industry", sector: "Mid Cap", country: "United Arab Emirates", city: "Dubai", plants: 4, assets: 1488, elpremars: 12, onboarded: "14-11-2024", status: "attention", accountStatus: "active" },
  { id: "SBC-ENT-008", name: "SABIC", scale: "Mid", sectorType: "Industry", sector: "Large Cap", country: "Saudi Arabia", city: "Riyadh", plants: 6, assets: 2104, elpremars: 18, onboarded: "02-12-2024", status: "healthy", accountStatus: "inactive" },
  { id: "THY-ENT-009", name: "Thyssenkrupp AG", scale: "Mid", sectorType: "Industry", sector: "Large Cap", country: "Germany", city: "Frankfurt", plants: 5, assets: 1776, elpremars: 15, onboarded: "19-01-2025", status: "healthy", accountStatus: "active" },
  { id: "SGX-ENT-010", name: "Singapore Grid Co.", scale: "Small", sectorType: "Retail", sector: "Commercial Offices", country: "Singapore", city: "Singapore", plants: 2, assets: 806, elpremars: 7, onboarded: "05-02-2025", status: "healthy", accountStatus: "active" },
  { id: "HIN-ENT-011", name: "Hindalco Industries", scale: "Mid", sectorType: "Industry", sector: "Large Cap", country: "India", city: "Renukoot", plants: 7, assets: 2914, elpremars: 24, onboarded: "11-09-2024", status: "attention", accountStatus: "active" },
  { id: "VED-ENT-012", name: "Vedanta Limited", scale: "Large", sectorType: "Industry", sector: "Large Cap", country: "India", city: "Jharsuguda", plants: 10, assets: 3640, elpremars: 31, onboarded: "28-10-2024", status: "healthy", accountStatus: "active" },
  { id: "BPC-ENT-013", name: "Bharat Petroleum", scale: "Mid", sectorType: "Industry", sector: "Government / PSU", country: "India", city: "Kochi", plants: 6, assets: 2488, elpremars: 21, onboarded: "16-12-2024", status: "critical", accountStatus: "active" },
  { id: "UTC-ENT-014", name: "UltraTech Cement", scale: "Mid", sectorType: "Industry", sector: "Mid Cap", country: "India", city: "Ahmedabad", plants: 9, assets: 2176, elpremars: 19, onboarded: "22-01-2025", status: "healthy", accountStatus: "active" },
  { id: "DRL-ENT-015", name: "Dr. Reddy's Labs", scale: "Small", sectorType: "Industry", sector: "Mid Cap", country: "India", city: "Hyderabad", plants: 4, assets: 1352, elpremars: 14, onboarded: "07-03-2025", status: "attention", accountStatus: "active" },
  { id: "TAT-ENT-016", name: "Tata Steel Europe", scale: "Mid", sectorType: "Industry", sector: "Large Cap", country: "Netherlands", city: "IJmuiden", plants: 5, assets: 2042, elpremars: 17, onboarded: "19-09-2024", status: "attention", accountStatus: "active" },
  { id: "LYB-ENT-017", name: "LyondellBasell", scale: "Mid", sectorType: "Industry", sector: "Large Cap", country: "United States", city: "Houston", plants: 7, assets: 2760, elpremars: 23, onboarded: "04-11-2024", status: "healthy", accountStatus: "active" },
  { id: "VAL-ENT-018", name: "Vale S.A.", scale: "Mid", sectorType: "Industry", sector: "Large Cap", country: "Brazil", city: "São Paulo", plants: 6, assets: 1988, elpremars: 16, onboarded: "13-02-2025", status: "critical", accountStatus: "inactive" },
  { id: "ESK-ENT-019", name: "Eskom Holdings", scale: "Mid", sectorType: "Industry", sector: "Government / PSU", country: "South Africa", city: "Johannesburg", plants: 8, assets: 2314, elpremars: 20, onboarded: "26-03-2025", status: "healthy", accountStatus: "active" },
  { id: "BHP-ENT-020", name: "BHP Group", scale: "Small", sectorType: "Industry", sector: "Large Cap", country: "Australia", city: "Sydney", plants: 3, assets: 1104, elpremars: 11, onboarded: "09-06-2025", status: "onboarding", accountStatus: "active" },
]

export const enterpriseRegisterKpis = {
  total: enterpriseRecords.length,
  /* Active means the account may be used, not that the assets are healthy */
  active: enterpriseRecords.filter((e) => e.accountStatus === "active").length,
  onboarding: enterpriseRecords.filter((e) => e.status === "onboarding").length,
  plants: enterpriseRecords.reduce((n, e) => n + e.plants, 0),
  assets: enterpriseRecords.reduce((n, e) => n + e.assets, 0),
  /*
   * Absolute month-over-month movement. These are counts in the tens, so a
   * percentage would round to a fraction of an enterprise and read as noise.
   * Assets are in the tens of thousands, so that one carries a percentage.
   */
  delta: { total: 2, active: 2, plants: 9, assets: 8 },
}

/** Priority pill colours, matching the health/alert token families */
export const priorityTone: Record<Priority, string> = {
  Low: "bg-neutral-soft text-neutral-soft-foreground",
  Medium: "bg-info-soft text-info-soft-foreground",
  High: "bg-attention-soft text-attention-soft-foreground",
  Critical: "bg-critical-soft text-critical-soft-foreground",
}

/**
 * How badly a failure on this asset would hurt. Only three levels, so High is the
 * top of the scale and takes the critical red — unlike Priority, where High sits
 * below Critical. Low stays neutral rather than green: a low-criticality asset is
 * not a healthy one, it just matters less.
 */
export const criticalityTone: Record<AssetCriticality, string> = {
  Low: "bg-neutral-soft text-neutral-soft-foreground",
  Medium: "bg-attention-soft text-attention-soft-foreground",
  High: "bg-critical-soft text-critical-soft-foreground",
}

/* ---------- Seeded pools for the enterprise profile ---------- */

/**
 * `profileFor` below draws every plant, department and contact from these pools
 * via a hash of the enterprise id, so a given enterprise always renders the same
 * profile between reloads without any of it being stored.
 */

/** Stable hash so a given enterprise always draws the same values */
const seedOf = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
const pick = <T,>(pool: readonly T[], seed: number, offset: number) => pool[(seed + offset * 7) % pool.length]

const plantSuffixes = ["Main Plant", "Unit 2", "Substation", "Utility Block", "Warehouse", "Annexe"]
/* Shared with the ELPREMAR registry, so assigned work always names a real person */
const elpremarPool = elpremarNames

/** Dates count back from a fixed reference so the data never shifts */
const REFERENCE = new Date(2026, 8, 28)
const dateBack = (days: number) => {
  const d = new Date(REFERENCE)
  d.setDate(d.getDate() - days)
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`
}

/* ---------- Enterprise detail: full onboarding profile ---------- */

/** One department inside a plant, with its own sub-departments */
export type DepartmentProfile = {
  id: string
  name: string
  code: string
  type: string
  parent: string
  salutation: string
  head: string
  email: string
  phoneCode: string
  phone: string
  description: string
  subDepartments: { name: string; code: string; function: string; description?: string }[]
}

/** One plant, with the departments that sit under it */
export type PlantProfile = {
  id: string
  name: string
  type: string
  code: string
  city: string
  state: string
  /** The plant's own location - work is dispatched here, not to the head office */
  pin: string
  latitude: string
  longitude: string
  salutation: string
  head: string
  email: string
  phoneCode: string
  phone: string
  capacity: string
  capacityUnit: string
  commissioningDate: string
  timeZone: string
  address: string
  notes: string
  departments: DepartmentProfile[]
}

/**
 * Everything captured during onboarding. An enterprise has many plants, each
 * with its own departments; the administrator account is enterprise-level and
 * shared across every plant.
 */
export type EnterpriseProfile = {
  enterprise: { name: string; shortName: string; sectorType: string; sector: string; website: string; description: string }
  location: { country: string; state: string; city: string; pin: string; latitude: string; longitude: string; address: string }
  plants: PlantProfile[]
  account: { email: string; role: string; lastLogin: string }
}

/** Coordinates for a city, for filling a location in from its address */
export const coordsForCity = (city: string) => {
  const point = coordsFor[city]
  return point ? { lat: point[0], lng: point[1] } : undefined
}

export const stateFor: Record<string, string> = {
  Mumbai: "Maharashtra", Jamnagar: "Gujarat", Dolvi: "Maharashtra", Mundra: "Gujarat",
  Hyderabad: "Telangana", Hosur: "Tamil Nadu", Renukoot: "Uttar Pradesh", Jharsuguda: "Odisha",
  Kochi: "Kerala", Ahmedabad: "Gujarat", Dubai: "Dubai", Riyadh: "Riyadh Province",
  Frankfurt: "Hesse", Singapore: "Singapore", IJmuiden: "North Holland", Houston: "Texas",
  "Sao Paulo": "Sao Paulo", Johannesburg: "Gauteng", Sydney: "New South Wales",
  Jamshedpur: "Jharkhand", Pune: "Maharashtra", Chennai: "Tamil Nadu", Kolkata: "West Bengal",
  Nagpur: "Maharashtra", Vijayanagar: "Karnataka", Vadodara: "Gujarat",
  "Abu Dhabi": "Abu Dhabi", Sharjah: "Sharjah", "Ras Al Khaimah": "Ras Al Khaimah",
  Jubail: "Eastern Province", Yanbu: "Al Madinah", Dammam: "Eastern Province",
  Jurong: "Singapore", Tuas: "Singapore", Duisburg: "North Rhine-Westphalia",
  Hamburg: "Hamburg", Dortmund: "North Rhine-Westphalia", Rotterdam: "South Holland",
  Amsterdam: "North Holland", Dallas: "Texas", Pittsburgh: "Pennsylvania", Cleveland: "Ohio",
  "Rio de Janeiro": "Rio de Janeiro", "Belo Horizonte": "Minas Gerais",
  Durban: "KwaZulu-Natal", "Cape Town": "Western Cape", Pretoria: "Gauteng",
  Melbourne: "Victoria", Perth: "Western Australia", Brisbane: "Queensland",
}
const coordsFor: Record<string, [string, string]> = {
  /* Plant cities, so a plant never falls back to 0,0 */
  Jamshedpur: ["22.8046", "86.2029"],
  Pune: ["18.5204", "73.8567"],
  Chennai: ["13.0827", "80.2707"],
  Kolkata: ["22.5726", "88.3639"],
  Nagpur: ["21.1458", "79.0882"],
  Vijayanagar: ["15.1394", "76.6400"],
  Vadodara: ["22.3072", "73.1812"],
  "Abu Dhabi": ["24.4539", "54.3773"],
  Sharjah: ["25.3463", "55.4209"],
  "Ras Al Khaimah": ["25.8007", "55.9762"],
  Jubail: ["27.0046", "49.6460"],
  Yanbu: ["24.0895", "38.0637"],
  Dammam: ["26.4207", "50.0888"],
  Jurong: ["1.3329", "103.7436"],
  Duisburg: ["51.4344", "6.7623"],
  Hamburg: ["53.5511", "9.9937"],
  Dortmund: ["51.5136", "7.4653"],
  Rotterdam: ["51.9244", "4.4777"],
  Amsterdam: ["52.3676", "4.9041"],
  Dallas: ["32.7767", "-96.7970"],
  Pittsburgh: ["40.4406", "-79.9959"],
  Cleveland: ["41.4993", "-81.6944"],
  "Sao Paulo": ["-23.5505", "-46.6333"],
  "São Paulo": ["-23.5505", "-46.6333"],
  "Rio de Janeiro": ["-22.9068", "-43.1729"],
  "Belo Horizonte": ["-19.9167", "-43.9345"],
  Durban: ["-29.8587", "31.0218"],
  "Cape Town": ["-33.9249", "18.4241"],
  Pretoria: ["-25.7479", "28.2293"],
  Melbourne: ["-37.8136", "144.9631"],
  Perth: ["-31.9505", "115.8605"],
  Mumbai: ["19.0760", "72.8777"], Jamnagar: ["22.4707", "70.0577"], Dolvi: ["18.7000", "73.0000"],
  Mundra: ["22.8394", "69.7219"], Hyderabad: ["17.3850", "78.4867"], Hosur: ["12.7409", "77.8253"],
  Renukoot: ["24.2000", "83.0333"], Jharsuguda: ["21.8558", "84.0062"], Kochi: ["9.9312", "76.2673"],
  Ahmedabad: ["23.0225", "72.5714"], Dubai: ["25.2048", "55.2708"], Riyadh: ["24.7136", "46.6753"],
  Frankfurt: ["50.1109", "8.6821"], Singapore: ["1.3521", "103.8198"], IJmuiden: ["52.4607", "4.6103"],
  Houston: ["29.7604", "-95.3698"], Johannesburg: ["-26.2041", "28.0473"], Sydney: ["-33.8688", "151.2093"],
}
/** Cities a plant can sit in, per country. The HQ city is always used first. */
const plantCitiesByCountry: Record<string, string[]> = {
  India: ["Mumbai", "Jamshedpur", "Pune", "Chennai", "Hyderabad", "Kolkata", "Ahmedabad", "Nagpur", "Vijayanagar", "Vadodara"],
  "United Arab Emirates": ["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah"],
  "Saudi Arabia": ["Riyadh", "Jubail", "Yanbu", "Dammam"],
  Singapore: ["Singapore", "Jurong", "Tuas"],
  Germany: ["Frankfurt", "Duisburg", "Hamburg", "Dortmund"],
  Netherlands: ["IJmuiden", "Rotterdam", "Amsterdam"],
  "United States": ["Houston", "Dallas", "Pittsburgh", "Cleveland"],
  Brazil: ["Sao Paulo", "Rio de Janeiro", "Belo Horizonte"],
  "South Africa": ["Johannesburg", "Durban", "Cape Town", "Pretoria"],
  Australia: ["Sydney", "Melbourne", "Perth", "Brisbane"],
}

/** Cities for one enterprise: its HQ first, then the rest of that country's pool */
const plantCitiesFor = (e: EnterpriseRecord) => {
  const pool = plantCitiesByCountry[e.country] ?? [e.city]
  return [e.city, ...pool.filter((c) => c !== e.city)]
}

const industryPlantTypes = ["Integrated Steel Plant", "Refinery", "Power Plant", "Cement Plant", "Manufacturing Unit"]
const retailPlantTypes = ["Commercial Complex", "Shopping Centre", "Data Centre", "Facility Block"]
const deptPool = ["Electrical", "Maintenance", "Operations", "Engineering", "Utilities", "Instrumentation & Control", "Safety"]
const subDeptPool = [
  { name: "HT Maintenance", code: "HT", function: "Maintenance", description: "High tension equipment maintenance" },
  { name: "LT Maintenance", code: "LT", function: "Maintenance", description: "Low tension equipment maintenance" },
  { name: "Panels & Switchgear", code: "PS", function: "Operations", description: "Panels, switchgear and control" },
  { name: "Transformers", code: "TF", function: "Maintenance", description: "Transformer maintenance" },
  { name: "Protection & Relay", code: "PR", function: "Testing", description: "Relay testing and calibration" },
]
const capacityValues = ["5", "12", "8", "3.5", "20", "450"]
const capacityUnitPool = ["MTPA", "MW", "MVA", "MTPA", "MW", "kVA"]
const timeZonesByCountry: Record<string, string> = {
  India: "(UTC+05:30) India Standard Time",
  "United Arab Emirates": "(UTC+04:00) Gulf Standard Time",
  "Saudi Arabia": "(UTC+03:00) Arabia Standard Time",
  Singapore: "(UTC+08:00) Singapore Time",
  Germany: "(UTC+01:00) Central European Time",
  Netherlands: "(UTC+01:00) Central European Time",
  "United States": "(UTC-06:00) Central Time",
  Brazil: "(UTC-03:00) Brasilia Time",
  "South Africa": "(UTC+02:00) South Africa Standard Time",
  Australia: "(UTC+10:00) Australian Eastern Time",
}

/** Build the full onboarding profile for one enterprise, deterministically */
export function profileFor(e: EnterpriseRecord): EnterpriseProfile {
  const seed = seedOf(e.id)
  const slug = e.name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 10)
  const [lat, lng] = coordsFor[e.city] ?? ["0.0000", "0.0000"]
  const plantTypePool = e.sectorType === "Retail" ? retailPlantTypes : industryPlantTypes
  const short = e.id.slice(0, 3)
  const mail = (name: string) => name.toLowerCase().replace(/ /g, ".") + "@" + slug + ".com"

  const cities = plantCitiesFor(e)
  const plants: PlantProfile[] = Array.from({ length: Math.min(e.plants, 12) }, (_, i) => {
    const s = seed + i * 101
    const city = cities[i % cities.length]
    const head = pick(elpremarPool, s, 4)
    const commissioned = new Date(2016 + (s % 9), s % 12, 1 + (s % 27))

    const departments: DepartmentProfile[] = Array.from({ length: 2 + (s % 3) }, (_, j) => {
      const ds = s + j * 37
      const dName = deptPool[(ds + j) % deptPool.length]
      const dHead = pick(elpremarPool, ds, 6)
      return {
        id: short + "-P" + (i + 1) + "-D" + (j + 1),
        name: dName,
        code: "DEP-" + dName.slice(0, 2).toUpperCase() + "-" + (i + 1) + (j + 1),
        type: dName,
        parent: j === 0 ? "" : "Engineering",
        salutation: ds % 4 === 0 ? "Ms." : "Mr.",
        head: dHead,
        email: mail(dHead),
        phoneCode: dialCodeFor(e.country),
        phone: String(8000000000 + (ds % 899999999)).slice(0, 10),
        description: dName + " systems and reliability activities for the " + city + " plant.",
        subDepartments: subDeptPool.slice(0, 2 + (ds % 3)).map((sd) => ({
          ...sd,
          code: "SUB-" + short + "-" + sd.code + (i + 1) + (j + 1),
        })),
      }
    })

    return {
      id: short + "-P" + (i + 1),
      city,
      state: stateFor[city] ?? e.country,
      pin: postalCodeForCity(city) ?? String(110000 + (s % 789999)),
      latitude: (coordsFor[city] ?? ["0.0000", "0.0000"])[0],
      longitude: (coordsFor[city] ?? ["0.0000", "0.0000"])[1],
      name: city + " " + pick(plantSuffixes, s, 2),
      type: pick(plantTypePool, s, 3),
      code: short + "-" + city.slice(0, 3).toUpperCase() + "-" + String(i + 1).padStart(3, "0"),
      salutation: s % 5 === 0 ? "Dr." : s % 3 === 0 ? "Ms." : "Mr.",
      head,
      email: mail(head),
      phoneCode: dialCodeFor(e.country),
      phone: String(9000000000 + (s % 899999999)).slice(0, 10),
      capacity: pick(capacityValues, s, 5),
      capacityUnit: pick(capacityUnitPool, s, 5),
      commissioningDate:
        commissioned.getFullYear() +
        "-" + String(commissioned.getMonth() + 1).padStart(2, "0") +
        "-" + String(commissioned.getDate()).padStart(2, "0"),
      timeZone: timeZonesByCountry[e.country] ?? "(UTC+00:00) GMT",
      address: pick(plantSuffixes, s, 2) + ", " + city + ", " + e.country,
      notes: "Registered during initial enterprise onboarding.",
      departments,
    }
  })

  return {
    enterprise: {
      name: e.name,
      shortName: short,
      sectorType: e.sectorType,
      sector: e.sector,
      website: "https://www." + slug + ".com",
      description: e.name + " is registered with OLIVINE for electrical reliability management across " + e.plants + " plants.",
    },
    location: {
      country: e.country,
      state: stateFor[e.city] ?? e.country,
      city: e.city,
      pin: String(100000 + (seed % 800000)),
      latitude: lat,
      longitude: lng,
      address: e.name + ", " + pick(plantSuffixes, seed, 1) + ", " + e.city + ", " + e.country,
    },
    plants,
    // One administrator for the whole enterprise, shared across every plant
    account: {
      email: "admin@" + slug + ".com",
      role: "Enterprise Admin",
      lastLogin: dateBack(seed % 6),
    },
  }
}

/**
 * Asset health split for one enterprise. The record carries a total and an
 * overall status; these are the per-band counts behind that status, using the
 * platform's Healthy / Alarming / At Risk bands.
 */
export function assetHealthFor(e: EnterpriseRecord) {
  const mix =
    e.status === "critical"
      ? { healthy: 0.58, attention: 0.27 }
      : e.status === "attention"
        ? { healthy: 0.74, attention: 0.2 }
        : { healthy: 0.91, attention: 0.07 }
  const healthy = Math.round(e.assets * mix.healthy)
  const attention = Math.round(e.assets * mix.attention)
  return { healthy, attention, critical: e.assets - healthy - attention }
}

/* ---------- The full books of work ---------- */

/*
 * Generated last: these read enterpriseRecords and profileFor, plus the pools
 * above. Keep them at the end of the module — hoisted function declarations
 * still close over `const` pools, which sit in the temporal dead zone until
 * their declaration is reached.
 */

/**
 * Every site work can be booked against, taken from the enterprises' own plant
 * lists so a row's enterprise and plant always match what the enterprise detail
 * screen shows. Two plants each keeps the pool broad without flooding it.
 */
const sites = enterpriseRecords.flatMap((e) =>
  profileFor(e)
    .plants.slice(0, 2)
    .map((plant) => ({ enterprise: e.name, plant: plant.name, country: e.country })),
)

/** The crew work is assigned to: active accounts only */
const crew = activeElpremarNames

/** The raw book. Exported below once the inspections it traces back to exist. */
const maintenanceBook: UnlinkedMaintenance[] = [...maintenanceProgress, ...moreMaintenance(60)]

/** The whole inspection queue — what the Inspection Activities screen lists */
export const inspectionActivities: TaskRow[] = [...taskQueue, ...moreInspections(60)]

/**
 * Trace every job back to an inspection at the same site, so the maintenance list
 * can always show what it relates to. Spread across that plant's inspections
 * rather than all pointing at the first one; a site with no inspection of its own
 * falls back to the queue at large, so no row is ever left without one. Rows that
 * already name an inspection keep it.
 */
function linkInspections(
  rows: (UnlinkedMaintenance & { inspectionId?: string })[],
  inspections: TaskRow[]
): MaintenanceRow[] {
  const byPlant = new Map<string, TaskRow[]>()
  for (const t of inspections) {
    const key = `${t.enterprise}|${t.plant}`
    const pool = byPlant.get(key)
    if (pool) pool.push(t)
    else byPlant.set(key, [t])
  }

  let n = 0
  return rows.map((m) => {
    // The hand-written rows are already paired to the right asset — keep those
    if (m.inspectionId) return m as MaintenanceRow
    const pool = byPlant.get(`${m.enterprise}|${m.plant}`) ?? inspections
    return { ...m, inspectionId: pool[n++ % pool.length].id }
  })
}

/** Everything on the books, newest id first — what the Maintenance Activities screen lists */
export const maintenanceActivities: MaintenanceRow[] = linkInspections(maintenanceBook, inspectionActivities)

const ticketStates: WorkStatus[] = ["open", "open", "in_progress", "in_progress", "closed", "closed"]

function moreTickets(count: number): TicketRow[] {
  let seed = 20260117
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]
  const rows: TicketRow[] = []

  for (let i = 0; i < count; i++) {
    const site = pick(sites)
    const category = pick(ticketCategories)
    const status = pick(ticketStates)
    const priority = pick(priorities)
    const raisedOn = Math.floor(random() * 40) - 42
    // Nothing is updated before it is raised, and an open ticket has not moved on
    const updatedOn = status === "open" ? raisedOn : Math.min(raisedOn + 1 + Math.floor(random() * 6), 0)
    const settled = status === "closed"
    const owned = settled || status === "in_progress"
    const short = site.plant.slice(0, 3).toUpperCase()

    rows.push({
      id: `TK-${4584 - i}`,
      enterprise: site.enterprise,
      plant: site.plant,
      country: site.country,
      subject: pick(ticketSubjectsByCategory[category]),
      category,
      raised: day(raisedOn),
      raisedBy: pick(requesters),
      source: sourceForCategory[category],
      lastUpdated: stamp(updatedOn, pick(daySlots)),
      ...(owned ? { elpremar: pick(crew), scheduled: day(updatedOn), slot: pick(daySlots) } : {}),
      priority,
      status,
      ...(settled ? { resolution: "Verified with the reporter and closed out." } : {}),
      // Only the modules that actually carry a record pass one across
      ...(category === "Asset" || category === "Maintenance" ? { assetId: `AST-${short}-${String(100 + i).padStart(4, "0")}` } : {}),
      ...(category === "Inspection" || category === "Testing & Measurement" ? { inspectionId: `TSK-${8800 - i}` } : {}),
      ...(category === "Maintenance" ? { maintenanceId: `MT-${2280 - i}` } : {}),
      ...(category === "Report" ? { reportId: `RPT-${short}-${2200 + i}` } : {}),
    })
  }
  return rows
}

/** The whole support desk, newest ticket first — what the Support Tickets screen lists */
export const allSupportTickets: TicketRow[] = [...supportTickets, ...moreTickets(44)]
