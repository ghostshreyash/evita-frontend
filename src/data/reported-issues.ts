import { addDays, format } from "date-fns"

import { elpremarRecords } from "@/data/elpremar-data"
import type { Priority, TicketCategory, TicketRow } from "@/data/occ-tables"
import type { TicketDetail } from "@/data/ticket-detail"
import type { WorkStatus } from "@/lib/status"

/**
 * The issues the field has already reported, seeded so the Reported Issues
 * screen has a history on it.
 *
 * OCC's own ticket seed is deliberately raised by enterprise and plant people
 * rather than by the crew - see `requesters` in occ-tables - because on the
 * console a ticket comes in from a customer. An issue reported from a tablet is
 * the other direction: the ELPREMAR standing in front of the panel is the
 * reporter, and until this screen existed there was nowhere to see one. These
 * rows are what Report an Issue produces, written as though it had already been
 * used, so the screen is not empty on a device that has never raised one.
 *
 * They go through the same ticket store as everything else, so an issue raised
 * now sits in one list with these and moves through the same states.
 *
 * TODO(api): drop this file when GET /support-tickets?raisedBy=me exists. The
 * shapes below are what that endpoint should return.
 */

/** Dates run back from today, as the rest of the mock books do */
const day = (offset: number) => format(addDays(new Date(), offset), "dd-MM-yyyy")

/** `dd-MM-yyyy HH:mm`, with the minutes fixed by the day so a stamp never moves */
const at = (offset: number, hour: number) =>
  `${day(offset)} ${String(hour).padStart(2, "0")}:${String((Math.abs(offset) * 7) % 60).padStart(2, "0")}`

/** The desk side of the trail. Nothing here names a person OLIVINE has not given us */
const desk = "OLIVINE Helpdesk"

type IssueTemplate = {
  category: TicketCategory
  subject: string
  description: string
  priority: Priority
  /** What the desk did about it, written on the ticket as it closes */
  resolution: string
  /** What the engineer attached, which on a plant floor is photographs */
  photos?: string[]
}

/**
 * What actually gets reported from a tablet: something wrong with the asset in
 * front of the engineer, or something wrong with EVITA while they are standing
 * there. Eight of them, so no two issues on one person's list read the same.
 */
const fieldIssues: IssueTemplate[] = [
  {
    category: "Asset",
    subject: "Panel door hinge broken",
    description:
      "The lower hinge on the panel door has sheared and the door does not sit flush. The gasket is not sealing on that edge, so dust is getting in. Photographs of the hinge and the gap are attached.",
    priority: "High",
    resolution: "Hinge and gasket replaced by the plant's own maintenance team. Verified sealing on the next visit.",
    photos: ["panel-door-hinge.jpg", "door-gap.jpg"],
  },
  {
    category: "Asset",
    subject: "Asset QR label unreadable",
    description:
      "The QR label on the asset has faded and will not scan from any distance. The printed Asset ID underneath is still legible, so the asset was found by searching for it instead.",
    priority: "Medium",
    resolution: "Replacement label printed and fixed to the panel. Scanned clean to confirm before closing.",
    photos: ["faded-qr-label.jpg"],
  },
  {
    category: "Data/Sync",
    subject: "Inspection did not sync after signal returned",
    description:
      "The inspection was recorded in the substation with no signal. The tablet came back online in the plant office but the record stayed on the device and the bar still read Not synced.",
    priority: "High",
    resolution: "Queued record pushed from the sync service. The inspection is now on the console with its readings intact.",
  },
  {
    category: "Testing & Measurement",
    subject: "Thermal camera will not pair",
    description:
      "The thermal camera does not appear in the pairing list on the tablet. It pairs with a second tablet on the same site, so the camera itself is working.",
    priority: "Medium",
    resolution: "Bluetooth cache cleared on the tablet and the camera re-paired. Walked through the steps with the engineer.",
  },
  {
    category: "Inspection",
    subject: "Inspection cannot be submitted from the plant",
    description:
      "Every reading is entered and the photographs are attached, but Submit does nothing. The inspection has been saved so the work is not lost.",
    priority: "Critical",
    resolution: "A mandatory field was failing validation without saying so. Fixed, and the saved inspection submitted.",
  },
  {
    category: "Technical",
    subject: "Camera does not open in EVITA",
    description:
      "Tapping Add photo leaves the tile blank. The tablet's own camera app opens normally, so it is EVITA rather than the device.",
    priority: "High",
    resolution: "Camera permission had been revoked by a device policy update. Re-granted and confirmed working.",
  },
  {
    category: "Maintenance",
    subject: "Cleaning activity stuck In Progress",
    description:
      "The clean is finished and the before-and-after photographs are recorded, but the activity will not move off In Progress, so it cannot be signed off.",
    priority: "Medium",
    resolution: "The activity was waiting on a report that had not generated. Report produced and the activity closed out.",
    photos: ["after-clean.jpg"],
  },
  {
    category: "Access",
    subject: "Booked plant not visible on the tablet",
    description:
      "There is an inspection booked at a plant that does not appear in the list on this tablet, so the visit cannot be started from the booking.",
    priority: "High",
    resolution: "The posting had not been extended to the new plant. Access granted and the booking now opens.",
  },
]

/**
 * One of each state for every person, taken by position rather than by hash:
 * all three have to be populated on every account, or a tab on the screen
 * opens empty. Four per person, so Completed - the one with the fullest
 * record - appears twice.
 */
const lifecycle: WorkStatus[] = ["completed", "in_progress", "completed", "open"]

/** The hour of the day each of the four was raised at */
const hours = [9, 11, 14, 16]

const rows: TicketRow[] = []
const detailsById: Record<string, TicketDetail> = {}

/*
 * Ids run in their own block above OCC's desk, so the two seeds can never
 * collide and anything raised from the tablet now counts on from the top.
 */
let serial = 0

for (const [p, person] of elpremarRecords.entries()) {
  for (const [k, status] of lifecycle.entries()) {
    const template = fieldIssues[(p * lifecycle.length + k) % fieldIssues.length]
    const id = `TK-${4601 + serial++}`

    /* Each person's four run back over a month, the newest first */
    const raisedOn = -(3 + k * 7 + (p % 4) * 2)
    const movedOn = Math.min(raisedOn + 2, 0)
    const settledOn = Math.min(raisedOn + 5, 0)
    const hour = hours[k]

    const raisedAt = at(raisedOn, hour)
    const settled = status === "completed"
    const started = settled || status === "in_progress"

    rows.push({
      id,
      enterprise: person.enterprise,
      plant: person.plant,
      country: person.country,
      subject: template.subject,
      category: template.category,
      raised: day(raisedOn),
      raisedBy: person.name,
      source: "EVITA",
      lastUpdated: settled ? at(settledOn, hour + 1) : started ? at(movedOn, hour + 1) : raisedAt,
      priority: template.priority,
      status,
      ...(settled ? { resolution: template.resolution } : {}),
    })

    /* Every state change is on the trail, in the order it happened */
    const history: TicketDetail["history"] = [
      { at: raisedAt, by: person.name, action: "Ticket Raised", note: `${template.category} · via EVITA` },
    ]
    if (started)
      history.push({ at: at(movedOn, hour + 1), by: desk, action: "Picked Up By The Desk", note: `Assigned to ${desk}` })
    if (settled) {
      history.push({ at: at(settledOn, hour + 1), by: desk, action: "Ticket Resolved", note: template.resolution })
      history.push({ at: at(settledOn, hour + 1), by: desk, action: "Ticket Completed", note: "Confirmed with the reporter" })
    }

    detailsById[id] = {
      description: template.description,
      /* Placeholder tiles: a photograph taken on the tablet does not survive a reload */
      attachments: (template.photos ?? []).map((label, i) => ({
        id: `${id}-A${i + 1}`,
        kind: "photo" as const,
        label,
        caption: `Attached by ${person.name}`,
        meta: raisedAt,
      })),
      ...(settled ? { resolution: { by: desk, at: at(settledOn, hour + 1), summary: template.resolution } } : {}),
      history,
    }
  }
}

/** The field's own reported issues, newest first, across the whole register */
export const fieldReportedIssues: TicketRow[] = rows

/** What each of them holds beyond its row: the report, the photographs, the trail */
export const fieldReportedDetails: Record<string, TicketDetail> = detailsById
