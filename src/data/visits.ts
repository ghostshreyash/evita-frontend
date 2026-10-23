/**
 * A scheduled visit: the unit of work EMMS-E actually books.
 *
 * An enterprise does not book an inspection of one panel. It books a visit -
 * this plant, this area, this day - and the ELPREMAR arrives to find whatever
 * is standing there, five or six assets or twenty. Which assets are inspected
 * is settled on site, by walking the area and scanning labels, not in an office
 * beforehand; a panel may be live, or locked, or not there at all any more.
 *
 * So a visit names a place and a day, and carries the assets the register says
 * stand in that area. The engineer works down them, and an inspection is raised
 * against each as it is taken (see `addInspectionForAsset`). A visit is done
 * when its assets are done, which is a count rather than a verdict.
 *
 * TODO(api):
 *   GET  /visits?elpremar=&enterprise=   → the book of visits for the tablet
 *   GET  /visits/{id}                    → the visit with its assets and their
 *                                          last inspection, so progress survives
 *                                          a reinstall
 *   POST /visits/{id}/start              → stamps the arrival
 * The asset list is the server's to decide - it knows what was onboarded since
 * the visit was booked - so the tablet must not cache it beyond the visit.
 */
import { assetRegister, parseDmy, type AssetRecord } from "@/data/asset-data"
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
  /** The assets the register says stand in that area, in asset-id order */
  assetIds: string[]
}

/** `dd-MM-yyyy` for a date this many days from today */
function dayOffset(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/* ---------- The book, generated last: it reads the register above ---------- */

/*
 * One visit per area that has assets, at each of the engineer's postings,
 * spread over the days around today so the book is never empty and never all
 * on one day. Deterministic: the offsets come from the position in the list,
 * not from a hash and not from the clock beyond today's date.
 */
export const scheduledVisits: ScheduledVisit[] = (() => {
  const me = elpremarRecords[0]
  const out: ScheduledVisit[] = []
  const offsets = [0, 0, 1, 2, -1, 3, 5, -2, 7, 4]

  for (const posting of postingsFor(me.name)) {
    const here = assetRegister.filter((a) => a.enterprise === posting.enterprise && a.plant === posting.plant)
    const areas = [...new Set(here.map((a) => a.area))]

    areas.forEach((area, i) => {
      const assets = here.filter((a) => a.area === area)
      if (!assets.length) return
      out.push({
        id: `VIS-${7000 + out.length}`,
        enterprise: posting.enterprise,
        plant: posting.plant,
        area,
        elpremar: me.name,
        date: dayOffset(offsets[(i + out.length) % offsets.length]),
        slot: 9 + ((i * 2) % 8),
        assetIds: assets.map((a) => a.id).sort((x, y) => x.localeCompare(y, undefined, { numeric: true })),
      })
    })
  }

  return out.sort((a, b) => parseDmy(a.date).getTime() - parseDmy(b.date).getTime() || a.slot - b.slot)
})()

/** The assets a visit covers, as the register holds them now */
export const assetsOnVisit = (visit: ScheduledVisit, register: readonly AssetRecord[]): AssetRecord[] =>
  visit.assetIds.map((id) => register.find((a) => a.id === id)).filter((a): a is AssetRecord => !!a)

/**
 * How far through a visit the engineer is.
 *
 * Counted from the inspections actually taken rather than stored on the visit,
 * so re-inspecting an asset cannot double-count it and a visit reopened after
 * the fact still reads correctly.
 */
export function visitProgress(visit: ScheduledVisit, inspectedAssetIds: ReadonlySet<string>) {
  const done = visit.assetIds.filter((id) => inspectedAssetIds.has(id)).length
  return {
    done,
    total: visit.assetIds.length,
    status: (done === 0 ? "scheduled" : done < visit.assetIds.length ? "in_progress" : "completed") as VisitStatus,
  }
}

export const visitStatusLook: Record<VisitStatus, { label: string; badge: "info" | "warning" | "success" }> = {
  scheduled: { label: "Scheduled", badge: "info" },
  in_progress: { label: "In Progress", badge: "warning" },
  completed: { label: "Completed", badge: "success" },
}
