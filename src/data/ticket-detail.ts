/**
 * Everything the Support Ticket Details screen shows beyond the list row: what
 * was reported, what was attached, how it was resolved and every status change
 * it has been through.
 *
 * Derived from the row with a seeded RNG so a given ticket always reads the
 * same. Replace with GET /support-tickets/:id later — the shapes below are what
 * that endpoint should return.
 */
import type { EvidenceItem, TimelineStep } from "@/data/evidence"
import type { TicketRow } from "@/data/occ-tables"

/** How the ticket was put right, captured when it is resolved */
export type TicketResolution = {
  by: string
  at: string
  summary: string
}

/**
 * One line of the audit trail. Every raise, status change, resolution and
 * closure appends one, so the history is complete and in order.
 */
export type TicketEvent = {
  at: string
  by: string
  action: string
  note?: string
}

export type TicketDetail = {
  description: string
  /** Files the reporter attached, plus anything OCC added while working it */
  attachments: EvidenceItem[]
  resolution?: TicketResolution
  history: TicketEvent[]
}

const descriptionsByCategory: Record<string, string> = {
  System: "The console behaves differently from what the team expects. Steps to reproduce were captured and are attached.",
  Technical: "A field device is not behaving as it should. The engineer has retried on a second handset with the same outcome.",
  Assignment: "The plant needs an ELPREMAR booked against this work and cannot complete the request from their own screens.",
  Asset: "The asset record does not match what is physically on site. Photographs of the nameplate are attached for comparison.",
  Inspection: "An inspection could not be completed and submitted from the field. The engineer has saved it locally in the meantime.",
  "Testing & Measurement": "A measurement instrument is not reporting correctly, so the readings cannot be trusted or recorded.",
  Maintenance: "A maintenance activity is not progressing through its expected states, so it cannot be signed off.",
  Report: "A report is not producing the expected output. The requested period and filters are noted below.",
  Access: "A user needs access adjusted so they can carry out their role on the platform.",
  "Data/Sync": "Records captured offline have not come back to the platform, so the latest field data is missing.",
  Dashboard: "A dashboard panel is not showing what the team expects for the selected scope.",
  Other: "A general query that does not fall under the other categories. Details are captured in the description and comments.",
}

const deskOwners = ["Priya Nair (OCC)", "Rakesh Menon (OCC)", "Divya Iyer (OCC)", "Admin (OCC)"]

const resolutions = [
  "Root cause traced and corrected. Verified with the reporter before closing.",
  "Configuration corrected on the affected plant and confirmed working end to end.",
  "Fix released to production. The reporter has confirmed the original steps now work.",
  "Record corrected and re-synced. Both the console and the field app now agree.",
]

/** dd-MM-yyyy + hour → "dd-MM-yyyy HH:mm" */
const at = (date: string, hour: number, minute = 0) =>
  `${date} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`

/** `dd-MM-yyyy HH:mm` → epoch ms, for ordering the trail */
export function stampTime(mark: string) {
  const [date, time = "00:00"] = mark.split(" ")
  const [d, m, y] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  return new Date(y, m - 1, d, hh, mm).getTime()
}

/** Add whole hours to a `dd-MM-yyyy HH:mm` stamp, rolling the date as needed */
function plusHours(mark: string, hours: number) {
  const [date, time = "09:00"] = mark.split(" ")
  const [d, m, y] = date.split("-").map(Number)
  const [hh, mm] = time.split(":").map(Number)
  const next = new Date(y, m - 1, d, hh + hours, mm)
  return at(
    `${String(next.getDate()).padStart(2, "0")}-${String(next.getMonth() + 1).padStart(2, "0")}-${next.getFullYear()}`,
    next.getHours(),
    next.getMinutes()
  )
}

export function ticketDetail(row: TicketRow): TicketDetail {
  let seed = [...row.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 17)
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 2 ** 32
  }
  const pick = <T,>(pool: readonly T[]) => pool[Math.floor(random() * pool.length)]

  const raisedAt = at(row.raised, 9 + Math.floor(random() * 4), Math.floor(random() * 6) * 10)
  const owner = pick(deskOwners)
  const working = row.status === "in_progress" || row.status === "closed"
  const settled = row.status === "closed"

  /* --- the audit trail: raised, started, resolved, closed --- */
  const history: TicketEvent[] = [
    { at: raisedAt, by: row.raisedBy, action: "Ticket Raised", note: `${row.category} · via ${row.source}` },
  ]

  if (working) {
    const startedAt = plusHours(raisedAt, 1 + Math.floor(random() * 4))
    history.push({ at: startedAt, by: owner, action: "Ticket Closed" })
  }

  let resolution: TicketResolution | undefined
  if (settled) {
    const resolvedAt = plusHours(row.lastUpdated, 0)
    resolution = { by: owner, at: resolvedAt, summary: row.resolution ?? pick(resolutions) }
    history.push({ at: resolvedAt, by: owner, action: "Ticket Resolved", note: resolution.summary })

    if (row.status === "closed") {
      history.push({ at: plusHours(resolvedAt, 2), by: owner, action: "Ticket Closed", note: "Confirmed with the reporter" })
    }
  }

  /* --- what the reporter attached --- */
  const attachments: EvidenceItem[] = []
  if (random() < 0.7) {
    attachments.push({
      id: `${row.id}-A1`,
      kind: "photo",
      label: "Screenshot from the reporter",
      caption: `Captured at ${row.plant}`,
      meta: raisedAt,
    })
  }
  if (row.category === "Asset" || row.category === "Technical") {
    attachments.push({
      id: `${row.id}-A2`,
      kind: "photo",
      label: "Nameplate / device photo",
      caption: `${row.plant}, ${row.enterprise}`,
      meta: raisedAt,
    })
  }
  if (settled) {
    attachments.push({
      id: `${row.id}-A3`,
      kind: "document",
      label: "Resolution note.pdf",
      caption: "Signed off by the OCC desk",
      meta: "148 KB",
    })
  }

  return {
    description: descriptionsByCategory[row.category] ?? descriptionsByCategory.Other,
    attachments,
    // The trail is built per lifecycle stage, so order it by the clock before
    // it is read — a reassignment can land either side of work starting
    resolution,
    history: [...history].sort((a, b) => stampTime(a.at) - stampTime(b.at)),
  }
}

/**
 * The single Lifecycle / Activity History rail: the audit trail itself, with the
 * user on each line. There is no separate lifecycle card to keep in step.
 */
export function ticketTimeline(detail: TicketDetail): TimelineStep[] {
  return detail.history.map((e) => ({
    step: e.action,
    at: e.at,
    note: e.note ? `${e.by} · ${e.note}` : e.by,
  }))
}
