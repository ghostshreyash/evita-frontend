import { useSyncExternalStore } from "react"

/**
 * The app-wide panels any screen can open: QR scanner, Start an inspection,
 * Report an Issue, SOP, Safety, Notifications and the document reader. They are
 * mounted once in the app shell, so the dashboard, the top bar and a task
 * screen all open the same dialog with the context they have (an asset, a
 * task, an activity).
 */
export type Panel =
  | { kind: "scan" }
  /** Which asset is being inspected: scan one, or onboard it first */
  | { kind: "begin-inspection" }
  /** A PDF read where it was opened from, rather than in a tab of its own */
  | { kind: "document"; title: string; file: string; detail?: string }
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
