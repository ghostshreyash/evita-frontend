import { useEffect, useState } from "react"

import { fetchCategoryParameters, type ServerParamSpec } from "@/lib/api/assets"

/**
 * What the chosen asset type is asked for, read from the server.
 *
 * The specification is not a fixed form: an ACB is asked for a breaking
 * capacity and a pole configuration, a battery bank for its cell count and Ah
 * rating. The client's onboarding sheet is held in the database and the server
 * validates answers against it, so the wizard reads the same rows rather than
 * carrying its own copy that could drift out of step with what will be accepted.
 */

export type { ServerParamSpec }

/** Where a parameter's chosen unit sits in the answers map */
export const unitKeyOf = (key: string) => `${key}Unit`

/** The unit in force: what was picked, or the first the sheet offers */
export const unitFor = (spec: ServerParamSpec, answers: Record<string, string | undefined>) =>
  spec.units.length ? (answers[unitKeyOf(spec.key)] ?? spec.units[0]) : undefined

/** What the engineer still owes on step 2; empty once the step can be left */
export const missingParameters = (
  specs: ServerParamSpec[],
  answers: Record<string, string | undefined>,
) => specs.filter((spec) => spec.required && !answers[spec.key]?.trim())

/** The key an answer is stored under, from the label the record holds it by */
export const keyForLabel = (specs: ServerParamSpec[], label: string) =>
  specs.find((spec) => spec.label === label)?.key

/**
 * One fetch per asset type for the life of the tab.
 *
 * The sheet does not change while an engineer is onboarding, and stepping back
 * and forth through the wizard would otherwise re-read it every time.
 */
const cache = new Map<string, ServerParamSpec[]>()

const NONE: ServerParamSpec[] = []

export function useCategoryParameters(category?: string) {
  /*
   * What has come back, and what has failed, each tagged with the category it
   * belongs to. Everything else is worked out while rendering: a category
   * already in the cache is ready immediately, and setting that from an effect
   * would only cause a second render to say so.
   */
  const [done, setDone] = useState<{ category: string; specs: ServerParamSpec[] }>()
  const [failed, setFailed] = useState<{ category: string; message: string }>()

  useEffect(() => {
    if (!category || cache.has(category)) return

    let cancelled = false
    void fetchCategoryParameters(category)
      .then((result) => {
        cache.set(category, result.parameters)
        if (!cancelled) setDone({ category, specs: result.parameters })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        setFailed({
          category,
          message:
            cause instanceof Error ? cause.message : "Could not read what this asset type is asked for",
        })
      })

    return () => {
      cancelled = true
    }
  }, [category])

  if (!category) return { specs: NONE, status: "idle" as const, error: undefined }

  const specs = cache.get(category) ?? (done?.category === category ? done.specs : undefined)
  if (specs) return { specs, status: "ready" as const, error: undefined }

  if (failed?.category === category) {
    return { specs: NONE, status: "error" as const, error: failed.message }
  }

  return { specs: NONE, status: "loading" as const, error: undefined }
}
