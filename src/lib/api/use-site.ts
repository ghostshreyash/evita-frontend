import { useEffect, useState } from "react"

import { fetchSite, type SiteResponse } from "@/lib/api/assets"

/**
 * The plant this engineer is posted to.
 *
 * EVITA shows one engineer's own site - the register never shows another
 * plant's equipment - so onboarding reads the enterprise and plant rather than
 * offering them, and only the department tree is a choice.
 *
 * TODO(aws): the posting belongs in the Cognito token claims. Until sign-in is
 * wired to it there is nothing on the tablet that says which plant this is, so
 * it is named by configuration - see `SITE_PLANT`.
 */

/** Which plant this build is posted to. Accepts the plant code, name or UUID. */
export const SITE_PLANT = import.meta.env.VITE_EVITA_PLANT ?? "JSR-01"

export function useSite() {
  /*
   * One state rather than three, so there is no moment where the site has
   * arrived but the status still says it has not. It starts as loading because
   * the fetch below runs on mount - saying so from inside the effect would only
   * cost a second render.
   */
  const [state, setState] = useState<{
    site?: SiteResponse
    status: "loading" | "ready" | "error"
    error?: string
  }>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    void fetchSite(SITE_PLANT)
      .then((site) => {
        if (!cancelled) setState({ site, status: "ready" })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setState({
          status: "error",
          error: cause instanceof Error ? cause.message : `Could not read the plant "${SITE_PLANT}"`,
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
