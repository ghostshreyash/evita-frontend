import { useMemo, useSyncExternalStore } from "react"

import { postingsFor } from "@/data/postings"
import { loadSnapshot, saveSnapshot } from "@/data/persist"
import { useCurrentElpremar } from "@/lib/me"

/**
 * Which enterprise the ELPREMAR is working for right now.
 *
 * One at a time, chosen by the engineer - see `postingsFor` for why there is
 * more than one. Everything on the tablet follows the choice: the work on the
 * book, the register, the reports, the visits.
 *
 * TODO(api): send the chosen enterprise as a header or query on every call, so
 * the server scopes the data rather than the tablet filtering it. Until then
 * everything is in memory and the filtering is done at the readers - see
 * `useMyJobs` and `useAssetRows`.
 */

/* ---------- The choice, kept between sessions ---------- */

const KEY = "scope.enterprise"
let chosen: string | undefined = loadSnapshot<string>(KEY) ?? undefined

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/** Switch enterprise. Everything scoped reads the new one on the next render */
export function chooseEnterprise(enterprise: string) {
  chosen = enterprise
  saveSnapshot(KEY, enterprise)
  listeners.forEach((listener) => listener())
}

const useChosen = () => useSyncExternalStore(subscribe, () => chosen)

/**
 * The postings open to this engineer, and the one they are working in.
 *
 * A stored choice that is no longer one of their postings falls back to the
 * first, so a reassignment can never strand the tablet on an enterprise the
 * engineer has nothing at.
 */
export function useScope() {
  const me = useCurrentElpremar()
  const picked = useChosen()

  return useMemo(() => {
    const postings = postingsFor(me.name)
    const current = postings.find((p) => p.enterprise === picked) ?? postings[0]
    return { postings, ...current }
  }, [me, picked])
}
