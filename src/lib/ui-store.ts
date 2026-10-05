import { useSyncExternalStore } from "react"

/**
 * The app-wide panels any screen can open: QR scanner, Report an Issue, SOP,
 * Safety and Notifications. They are mounted once in the app shell, so the
 * dashboard, the top bar and a task screen all open the same dialog with the
 * context they have (an asset, a task, an activity).
 */
export type Panel =
  | { kind: "scan" }
  | { kind: "issue"; assetId?: string; jobId?: string; jobKind?: "inspection" | "maintenance"; asset?: string; plant?: string; enterprise?: string }
  | { kind: "sop"; activity?: string }
  | { kind: "safety" }
  | { kind: "notifications" }

let panel: Panel | null = null
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export const usePanel = () => useSyncExternalStore(subscribe, () => panel)

export function openPanel(next: Panel) {
  panel = next
  listeners.forEach((l) => l())
}

export function closePanel() {
  panel = null
  listeners.forEach((l) => l())
}
