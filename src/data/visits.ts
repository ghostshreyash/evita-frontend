/**
 * A scheduled visit: the unit of work EMMS-E actually books.
 *
 * An enterprise does not book an inspection of one panel, and it usually cannot:
 * at a site EVITA has not been to before, **the assets are not on the register
 * yet**. What is booked is a visit - this plant, this area, this day, and
 * roughly how many assets the enterprise believes are standing there. The
 * ELPREMAR arrives, onboards what they find, and inspects what they onboarded.
 *
 * So a visit holds **no asset list**. Its assets are whatever the register
 * holds for that plant and area at the moment it is opened, which is a number
 * that grows as the engineer works. `expected` is the enterprise's own count
 * and is a guide, not a target: finding seven where six were expected is the
 * normal case, and the visit is not wrong for it.
 *
 * TODO(api):
 *   GET  /visits?elpremar=&enterprise=  → the book of visits for the tablet
 *   GET  /visits/{id}                   → the visit and its area; the assets
 *                                         come from the register, scoped to
 *                                         that plant and area
 *   POST /visits/{id}/start             → stamps the arrival
 * The asset list is never sent with the visit and never cached: it is the
 * register's answer to "what stands here", and onboarding changes it.
 */
import { areaPool, parseDmy } from "@/data/asset-data"
import { elpremarRecords } from "@/data/elpremar-data"
import { postingsFor } from "@/data/postings"

export type VisitStatus = "scheduled" | "in_progress" | "completed"

export type ScheduledVisit = {
  id: string
  enterprise: string
  plant: string
  /** The part of the plant the visit covers - one area per visit */
  area: string
  elpremar: string
  /** dd-MM-yyyy */
  date: string
  /** Hour the visit is booked for, as the rest of the book counts slots */
  slot: number
  /**
   * How many assets the enterprise says are in that area.
   *
   * A guide for the engineer, not a gate: what is actually registered is what
   * the visit works on, and that is read off the register rather than stored.
   */
  expected: number
  /** What EMMS-E wrote on the booking */
  note?: string
}

/** `dd-MM-yyyy` for a date this many days from today */
function dayOffset(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/* ---------- The book ---------- */

/*
 * Two or three visits per posting, deliberately mixed:
 *
 *  - areas the register already knows, where the engineer inspects what is
 *    there and onboards anything new they come across;
 *  - areas nothing has been onboarded in yet, which is the case the client
 *    described - the engineer arrives to an empty list and builds it.
 *
 * By position rather than by hash, so both cases are always on the book and
 * neither can be squeezed out by a divisor. Deterministic but for today's date.
 */
/*
 * Areas deliberately outside `areaPool`, so nothing has ever been onboarded in
 * them: these are the first visits, where the engineer arrives to an empty list.
 */
const newAreas = ["Effluent Treatment Plant", "Workshop Bay", "Boiler House"]

export const scheduledVisits: ScheduledVisit[] = (() => {
  const me = elpremarRecords[0]
  const out: ScheduledVisit[] = []
  const offsets = [0, 1, 3, 0, 2, 5, 1, 4, 7]

  postingsFor(me.name).forEach((posting, p) => {
    /* Two in areas the register knows, and one in an area it does not */
    const known = [areaPool[p % areaPool.length], areaPool[(p + 3) % areaPool.length]]
    const fresh = newAreas[p % newAreas.length]

    for (const [i, area] of [...known, fresh].entries()) {
      const n = out.length
      out.push({
        id: `VIS-${7000 + n}`,
        enterprise: posting.enterprise,
        plant: posting.plant,
        area,
        elpremar: me.name,
        date: dayOffset(offsets[n % offsets.length]),
        slot: 9 + ((i * 3) % 8),
        expected: [6, 8, 5, 11, 7][n % 5],
        note:
          area === fresh
            ? "First visit to this area - onboard the assets you find, then inspect them."
            : undefined,
      })
    }
  })

  return out.sort((a, b) => parseDmy(a.date).getTime() - parseDmy(b.date).getTime() || a.slot - b.slot)
})()

/**
 * The assets a visit covers: whatever the register holds for that plant and
 * area right now.
 *
 * Read live rather than stored, because onboarding during the visit is the
 * point - an asset registered five minutes ago is part of the visit, and a
 * frozen list taken at booking time could never say so.
 */
export const assetsInArea = <T extends { plant: string; area: string; enterprise: string }>(
  visit: Pick<ScheduledVisit, "enterprise" | "plant" | "area">,
  register: readonly T[]
): T[] =>
  register.filter((a) => a.enterprise === visit.enterprise && a.plant === visit.plant && a.area === visit.area)

/**
 * How far through a visit the engineer is.
 *
 * Two counts, because there are two jobs: what has been onboarded against what
 * the enterprise expected, and what has been inspected against what is actually
 * on the register. Both are read off other records, so nothing has to be kept
 * in step and a re-inspection cannot double-count.
 *
 * A visit with nothing registered yet is Scheduled, however many are expected -
 * the engineer has not started. It is Completed once something is registered
 * and all of it is inspected.
 */
export function visitProgress(
  visit: ScheduledVisit,
  assetIds: readonly string[],
  inspectedAssetIds: ReadonlySet<string>
) {
  const onboarded = assetIds.length
  const done = assetIds.filter((id) => inspectedAssetIds.has(id)).length
  return {
    onboarded,
    expected: visit.expected,
    done,
    total: onboarded,
    status: (onboarded === 0 || done === 0
      ? "scheduled"
      : done < onboarded
        ? "in_progress"
        : "completed") as VisitStatus,
  }
}

export const visitStatusLook: Record<VisitStatus, { label: string; badge: "info" | "warning" | "success" }> = {
  scheduled: { label: "Scheduled", badge: "info" },
  in_progress: { label: "In Progress", badge: "warning" },
  completed: { label: "Completed", badge: "success" },
}
