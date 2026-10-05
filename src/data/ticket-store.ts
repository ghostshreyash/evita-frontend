import { useSyncExternalStore } from "react"

import { allSupportTickets, type TicketCategory, type TicketRow, type TicketSource } from "@/data/occ-tables"
import { ticketDetail, type TicketDetail } from "@/data/ticket-detail"
import type { Priority } from "@/data/occ-tables"
import type { WorkStatus } from "@/lib/status"
import { loadSnapshot, saveSnapshot } from "@/data/persist"

/**
 * One copy of the support desk plus the record behind each ticket, shared by the
 * list and the details screen so a status change in either place shows up in the
 * other. Stands in for the query cache until these rows come from the API.
 *
 * Assignment is out of scope for Phase 1, so nothing here hands a ticket to an
 * owner — the lifecycle is Open → In Progress → Closed.
 *
 * Every mutation appends to `history`, so the audit trail is complete by
 * construction rather than by each caller remembering to log.
 */
// EVITA keeps tickets raised from the tablet across a refresh (see data/persist.ts)
const saved = loadSnapshot<{ rows: TicketRow[]; details: Record<string, TicketDetail> }>("tickets")
let rows: TicketRow[] = saved?.rows ?? allSupportTickets
let details: Record<string, TicketDetail> = saved?.details ?? Object.fromEntries(rows.map((r) => [r.id, ticketDetail(r)]))

const listeners = new Set<() => void>()
const emit = () => {
  saveSnapshot("tickets", { rows, details })
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useTicketRows = () => useSyncExternalStore(subscribe, () => rows)

export const useTicketDetails = () => useSyncExternalStore(subscribe, () => details)

export const findTicket = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/** `dd-MM-yyyy HH:mm` for right now — the stamp every mutation records */
function now() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Apply a row patch and an audit entry together, so the two can never drift */
function commit(id: string, patch: Partial<TicketRow>, event: { by: string; action: string; note?: string }) {
  const at = now()
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch, lastUpdated: at } : r))
  const detail = details[id]
  if (detail) {
    details = { ...details, [id]: { ...detail, history: [...detail.history, { at, ...event }] } }
  }
  emit()
}

/** Move the ticket along its workflow, recording who moved it */
export function setTicketStatus(id: string, status: WorkStatus, by: string, note?: string) {
  const label = status === "closed" ? "Ticket Closed" : `Status changed to ${statusWord(status)}`
  commit(id, { status }, { by, action: label, note })
}

const statusWord = (s: WorkStatus) =>
  s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)

/**
 * Keep the ticket open and on the desk. Moving it out of Open is logged as a
 * status change; once it is already In Progress, any text typed is logged as a
 * progress note so the trail shows the work continuing.
 */
export function keepTicketInProgress(id: string, note: string, by: string) {
  const current = rows.find((r) => r.id === id)
  if (!current) return
  const already = current.status === "in_progress"
  if (already && !note.trim()) return
  commit(
    id,
    { status: "in_progress" },
    { by, action: already ? "Progress Note Added" : "Status changed to In Progress", note: note.trim() || undefined }
  )
}

/**
 * Record what was done and close the ticket out in one step — the shape the
 * Resolve dialog works in. Both events are written, so the trail still shows the
 * ticket being resolved on its way to Closed.
 */
export function resolveAndCloseTicket(id: string, summary: string, by: string) {
  const at = now()
  rows = rows.map((r) => (r.id === id ? { ...r, status: "closed" as WorkStatus, resolution: summary, lastUpdated: at } : r))
  const detail = details[id]
  if (detail) {
    details = {
      ...details,
      [id]: {
        ...detail,
        resolution: { by, at, summary },
        history: [
          ...detail.history,
          { at, by, action: "Ticket Resolved", note: summary },
          { at, by, action: "Ticket Closed", note: "Resolved and closed out" },
        ],
      },
    }
  }
  emit()
}

/** Files added while the ticket is being worked, each one recorded on the trail */
export function addTicketAttachment(id: string, names: string[], by: string) {
  const detail = details[id]
  if (!detail || !names.length) return
  const at = now()

  const added = names.map((name, i) => ({
    id: `${id}-A${detail.attachments.length + i + 1}`,
    kind: name.toLowerCase().endsWith(".pdf") ? ("document" as const) : ("photo" as const),
    label: name,
    caption: `Added by ${by}`,
    meta: at,
  }))

  rows = rows.map((r) => (r.id === id ? { ...r, lastUpdated: at } : r))
  details = {
    ...details,
    [id]: {
      ...detail,
      attachments: [...detail.attachments, ...added],
      history: [
        ...detail.history,
        { at, by, action: "Attachment Added", note: names.join(", ") },
      ],
    },
  }
  emit()
}

/** What the Raise Support Ticket form collects; everything else is generated */
export type NewTicket = {
  enterprise: string
  plant: string
  country: string
  subject: string
  description: string
  category: TicketCategory
  priority: Priority
  source: TicketSource
  assetId?: string
  inspectionId?: string
  maintenanceId?: string
  reportId?: string
  attachments?: string[]
}

/**
 * Raise a ticket. The id, reporter, raised date and Open status are set here
 * rather than collected, and any module context passed in is carried across.
 * Returns the new ticket id so the caller can navigate straight to it.
 */
export function raiseTicket(input: NewTicket, raisedBy: string) {
  const at = now()
  const [date] = at.split(" ")
  // Ids count up from the highest TK- already on the desk
  const highest = rows.reduce((max, r) => Math.max(max, Number(r.id.replace("TK-", "")) || 0), 0)
  const id = `TK-${highest + 1}`

  const row: TicketRow = {
    id,
    enterprise: input.enterprise,
    plant: input.plant,
    country: input.country,
    subject: input.subject,
    category: input.category,
    raised: date,
    raisedBy,
    source: input.source,
    lastUpdated: at,
    priority: input.priority,
    status: "open",
    ...(input.assetId ? { assetId: input.assetId } : {}),
    ...(input.inspectionId ? { inspectionId: input.inspectionId } : {}),
    ...(input.maintenanceId ? { maintenanceId: input.maintenanceId } : {}),
    ...(input.reportId ? { reportId: input.reportId } : {}),
  }

  rows = [row, ...rows]
  details = {
    ...details,
    [id]: {
      description: input.description,
      attachments: (input.attachments ?? []).map((name, i) => ({
        id: `${id}-A${i + 1}`,
        kind: name.toLowerCase().endsWith(".pdf") ? ("document" as const) : ("photo" as const),
        label: name,
        caption: `Attached by ${raisedBy}`,
        meta: at,
      })),
      history: [{ at, by: raisedBy, action: "Ticket Raised", note: `${input.category} · via ${input.source}` }],
    },
  }
  emit()
  return id
}
