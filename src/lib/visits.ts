import { useMemo } from "react"

import { useInspectionDetails } from "@/data/inspection-store"
import { assetsInArea, scheduledVisits, visitProgress, type ScheduledVisit } from "@/data/visits"
import { useAssetRows } from "@/data/asset-store"
import { useCurrentElpremar } from "@/lib/me"
import { useScope } from "@/lib/scope"
import { parseDay } from "@/lib/work"

/**
 * The visits booked to this engineer at the enterprise they are working in.
 *
 * Soonest first, which is the order they will be walked. Scoped like everything
 * else on the tablet - a visit at another customer's plant is not this week's
 * problem even though the same engineer is going there on Thursday.
 */
export function useMyVisits(): ScheduledVisit[] {
  const me = useCurrentElpremar()
  const { enterprise } = useScope()

  return useMemo(
    () =>
      scheduledVisits
        .filter((v) => v.elpremar === me.name && v.enterprise === enterprise)
        .sort((a, b) => parseDay(a.date).getTime() - parseDay(b.date).getTime() || a.slot - b.slot),
    [me, enterprise]
  )
}

/**
 * Which assets have been inspected, by asset id.
 *
 * An inspection carries the asset it was taken against in `assetTag`, so the
 * set is read off the records rather than written onto the visit - nothing has
 * to be kept in step, and an inspection taken off the back of a scan counts
 * towards the visit it happened to fall inside.
 */
export function useInspectedAssets(): Set<string> {
  const details = useInspectionDetails()
  return useMemo(
    () =>
      new Set(
        Object.values(details)
          .filter((d) => d.assetTag && (d.result || d.execution?.completedAt))
          .map((d) => d.assetTag)
      ),
    [details]
  )
}

/**
 * One visit, the assets the register holds for its area, and how far through it
 * the engineer is.
 *
 * The assets are resolved on every read. Onboarding during the visit is the
 * normal case - at an area EVITA has not been to, the list starts empty and the
 * engineer builds it - so anything registered a minute ago is already part of
 * the visit.
 */
export function useVisit(id?: string) {
  const visits = useMyVisits()
  const register = useAssetRows()
  const inspected = useInspectedAssets()

  return useMemo(() => {
    const visit = visits.find((v) => v.id === id)
    if (!visit) return undefined
    const assets = assetsInArea(visit, register)
    return { visit, assets, progress: visitProgress(visit, assets.map((a) => a.id), inspected) }
  }, [visits, id, register, inspected])
}

/** One visit with how far through it the engineer is */
export type OpenVisit = { visit: ScheduledVisit; progress: ReturnType<typeof visitProgress> }

/** Every visit still to finish, soonest first - what the home card pages through */
export function useOpenVisits(): OpenVisit[] {
  const visits = useMyVisits()
  const register = useAssetRows()
  const inspected = useInspectedAssets()

  return useMemo(
    () =>
      visits
        .map((visit) => {
          const assets = assetsInArea(visit, register)
          return { visit, progress: visitProgress(visit, assets.map((a) => a.id), inspected) }
        })
        .filter((v) => v.progress.status !== "completed"),
    [visits, register, inspected]
  )
}
