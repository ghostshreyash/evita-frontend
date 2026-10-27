import { useSyncExternalStore } from "react"

import { loadSnapshot, saveSnapshot, stampNow } from "@/data/persist"

/**
 * Visits the engineer has closed out themselves.
 *
 * A visit cannot be finished by counting. The number on the booking is the
 * enterprise's estimate of what is in the area, and the engineer routinely
 * finds fewer - a panel was decommissioned, two turned out to be one, the room
 * is half what the handover said. Nothing on the tablet can tell the difference
 * between "four of six done" and "there were only four", so the engineer says
 * which, and this is where that is kept.
 *
 * Reopening is allowed: closing a visit is a statement about an area, not a
 * submission, and a mis-tap on a tablet in a plant room should not cost a
 * second trip.
 *
 * TODO(api): POST /visits/{id}/complete { assetsFound, note } and
 * POST /visits/{id}/reopen. The count found is worth sending - it is the
 * correction to the enterprise's own estimate, and EMMS-E wants it.
 */
type Closed = Record<string, { at: string; found: number }>

const KEY = "visits.closed"
let closed: Closed = loadSnapshot<Closed>(KEY) ?? {}

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
const emit = () => {
  saveSnapshot(KEY, closed)
  listeners.forEach((listener) => listener())
}

export const useClosedVisits = () => useSyncExternalStore(subscribe, () => closed)

/** The engineer says the area is done, and how many assets were actually there */
export function completeVisit(id: string, found: number) {
  closed = { ...closed, [id]: { at: stampNow(), found } }
  emit()
}

/** Back onto the book: more was found, or it was closed by mistake */
export function reopenVisit(id: string) {
  const { [id]: _gone, ...rest } = closed
  closed = rest
  emit()
}
