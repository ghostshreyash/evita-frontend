import { useSyncExternalStore } from "react"

/** Live result of a CSS media query, e.g. `(min-width: 1024px)` — re-renders on rotation. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    () => window.matchMedia(query).matches
  )
}

/**
 * Whether the tablet has a network connection right now. Field sites such as
 * substations and basements often do not, so the shell shows it at all times.
 */
export function useOnline() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange)
      window.addEventListener("offline", onChange)
      return () => {
        window.removeEventListener("online", onChange)
        window.removeEventListener("offline", onChange)
      }
    },
    () => navigator.onLine
  )
}
