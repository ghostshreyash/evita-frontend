import {
  ClipboardList,
  FileText,
  HardDrive,
  LayoutDashboard,
  SquareCheckBig,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  path: string
  icon: LucideIcon
  badge?: number
  /**
   * Other route prefixes that belong to this section, so a details screen keeps
   * its sidebar entry highlighted even though it sits on its own path.
   */
  covers?: string[]
}

/**
 * EVITA sidebar — the field engineer's app, not the command centre.
 *
 * Same sections, in the same order, as `evitaNavigation` in occ-frontend's
 * `src/config/navigation.ts`. There they sit under `/evita` because OCC and EVITA
 * share one deployment; here EVITA is the whole app, so they sit at the root.
 */
export const navigation: NavItem[] = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Assets", path: "/assets", icon: HardDrive },
  { title: "My Tasks", path: "/my-tasks", icon: ClipboardList },
  { title: "Testing & Measurements", path: "/testing-measurements", icon: SquareCheckBig },
  { title: "Maintenance Activities", path: "/maintenance-activities", icon: Wrench },
  { title: "Reports", path: "/reports", icon: FileText },
]
