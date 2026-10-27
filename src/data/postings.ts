/**
 * Where one ELPREMAR works.
 *
 * An ELPREMAR is not posted to one customer. The maintenance contractor sends
 * them wherever a visit is booked, and the same engineer can be carrying work
 * for three enterprises in the same week - so EVITA shows one enterprise at a
 * time and the engineer says which. `lib/scope` holds that choice; this module
 * only answers which enterprises are open to them.
 *
 * TODO(api): postings come from GET /me as `postings: { enterpriseId, plantId }[]`.
 */
import { elpremarRecords } from "@/data/elpremar-data"
import { inspectionActivities, maintenanceActivities } from "@/data/occ-tables"

export type Posting = {
  enterprise: string
  plant: string
  country: string
}

/**
 * Where one ELPREMAR works, read off the work actually booked to them.
 *
 * Derived rather than declared: a posting exists because there is a visit or a
 * cleaning booked at it, which is exactly what the contractor's schedule says.
 * Their own registered plant is included whether or not it currently has work,
 * since it is still their posting.
 */
export function postingsFor(name: string): Posting[] {
  const person = elpremarRecords.find((e) => e.name === name) ?? elpremarRecords[0]
  const out = new Map<string, Posting>()

  const add = (p: Posting) => {
    // The engineer's own country only: EVITA is not a global console
    if (p.country !== person.country) return
    if (!out.has(p.enterprise)) out.set(p.enterprise, p)
  }

  add({ enterprise: person.enterprise, plant: person.plant, country: person.country })
  for (const t of inspectionActivities)
    if (t.elpremar === person.name) add({ enterprise: t.enterprise, plant: t.plant, country: t.country })
  for (const m of maintenanceActivities)
    if (m.elpremar === person.name) add({ enterprise: m.enterprise, plant: m.plant, country: m.country })

  return [...out.values()]
}
