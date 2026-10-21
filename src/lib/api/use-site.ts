import { useEffect, useState } from "react"

import { fetchSite, fetchSites, type EnterpriseSummary, type SiteResponse } from "@/lib/api/assets"

/**
 * The organisation tree onboarding step 1 picks an asset's place out of.
 *
 * Four levels, each narrowing the next: an enterprise has plants, a plant has
 * departments, a department has sub-departments. The first two arrive together
 * - an enterprise carries its own plants - so choosing an enterprise filters
 * the plant list without another request. Departments belong to a plant and are
 * read once one is chosen, which keeps the first response small however many
 * plants an enterprise has.
 *
 * TODO(aws): an engineer posted to one plant should have it chosen for them
 * from the Cognito token claims rather than picking it. `DEFAULT_PLANT` stands
 * in until sign-in is wired to them.
 */

/** Pre-selected on a fresh form, when it names a plant that exists */
export const DEFAULT_PLANT = import.meta.env.VITE_EVITA_PLANT ?? ""

type Status = "loading" | "ready" | "error"

/** Every enterprise, with the plants under each */
export function useEnterprises() {
  const [state, setState] = useState<{
    enterprises: EnterpriseSummary[]
    status: Status
    error?: string
  }>({ enterprises: [], status: "loading" })

  useEffect(() => {
    let cancelled = false

    void fetchSites()
      .then((enterprises) => {
        if (!cancelled) setState({ enterprises, status: "ready" })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          enterprises: [],
          status: "error",
          error: cause instanceof Error ? cause.message : "Could not read the enterprise list",
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/**
 * One plant's departments, read when a plant is chosen.
 *
 * Cached for the life of the tab: stepping back and forth between plants while
 * filling the form would otherwise re-read the same tree each time.
 */
const cache = new Map<string, SiteResponse>()

const NO_DEPARTMENTS: SiteResponse["departments"] = []

export function usePlantDepartments(plantId?: string) {
  const [done, setDone] = useState<{ plantId: string; site: SiteResponse }>()
  const [failed, setFailed] = useState<{ plantId: string; message: string }>()

  useEffect(() => {
    if (!plantId || cache.has(plantId)) return

    let cancelled = false
    void fetchSite(plantId)
      .then((site) => {
        cache.set(plantId, site)
        if (!cancelled) setDone({ plantId, site })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setFailed({
          plantId,
          message: cause instanceof Error ? cause.message : "Could not read this plant's departments",
        })
      })

    return () => {
      cancelled = true
    }
  }, [plantId])

  if (!plantId) return { departments: NO_DEPARTMENTS, status: "idle" as const, error: undefined }

  const site = cache.get(plantId) ?? (done?.plantId === plantId ? done.site : undefined)
  if (site) return { departments: site.departments, status: "ready" as const, error: undefined }

  if (failed?.plantId === plantId) {
    return { departments: NO_DEPARTMENTS, status: "error" as const, error: failed.message }
  }

  return { departments: NO_DEPARTMENTS, status: "loading" as const, error: undefined }
}
