import { NavLink, useLocation } from "react-router"
import { ClipboardCheck, ClipboardList, FileText, HardDrive, LayoutDashboard, QrCode, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { openPanel } from "@/lib/ui-store"
import { actionFor, useMyJobs } from "@/lib/work"

/**
 * The sections, as the tablet design puts them: a bar along the bottom where a
 * thumb already rests, with the QR scanner raised in the middle.
 *
 * Scanning is the one action an ELPREMAR starts from anywhere — they walk up to
 * a panel and point the tablet at its label — so it takes the centre slot and
 * opens the scanner over whatever screen is showing rather than navigating
 * away from it.
 */
type Tab = { path: string; title: string; icon: LucideIcon; covers?: string[] }

const tabs: Tab[] = [
  { path: "/", title: "Home", icon: LayoutDashboard },
  { path: "/assets", title: "Assets", icon: HardDrive },
  { path: "/my-tasks", title: "Tasks", icon: ClipboardList },
  /* The inspection half of the book on its own tab: it is what an ELPREMAR is
     sent out to do most days, and My Tasks still carries it as well */
  { path: "/inspections", title: "Inspection", icon: ClipboardCheck },
  { path: "/reports", title: "Reports", icon: FileText },
]

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

export function TabBar() {
  const { pathname } = useLocation()
  // Work still needing the engineer's hands, as a count on Tasks and on Inspection
  const waiting = useMyJobs().filter((j) => actionFor(j) !== "view")
  const open = waiting.length
  const openInspections = waiting.filter((j) => j.kind === "inspection").length
  // Fewer on the left, so the raised scanner sits just before the work tabs
  const split = Math.floor(tabs.length / 2)
  const [left, right] = [tabs.slice(0, split), tabs.slice(split)]

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgb(0_0_0/0.06)]"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {left.map((tab) => (
          <Item key={tab.path} tab={tab} active={under(pathname, tab.path)} />
        ))}

        <li className="flex w-20 shrink-0 justify-center">
          <button
            type="button"
            aria-label="Scan an asset QR code"
            onClick={() => openPanel({ kind: "scan" })}
            className="-mt-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-card transition-transform active:scale-95"
          >
            <QrCode className="size-7" />
          </button>
        </li>

        {right.map((tab) => (
          <Item
            key={tab.path}
            tab={tab}
            active={under(pathname, tab.path)}
            badge={tab.path === "/my-tasks" ? open : tab.path === "/inspections" ? openInspections : 0}
          />
        ))}
      </ul>
    </nav>
  )
}

function Item({ tab, active, badge = 0 }: { tab: Tab; active: boolean; badge?: number }) {
  return (
    <li className="min-w-0 flex-1">
      <NavLink
        to={tab.path}
        end={tab.path === "/"}
        className={cn(
          "relative flex min-h-16 flex-col items-center justify-center gap-0.5 px-0.5 text-[0.7rem] font-medium sm:text-xs",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        <span className={cn("flex size-8 items-center justify-center rounded-lg", active && "bg-info-soft")}>
          <tab.icon className="size-5" />
        </span>
        <span className="truncate">{tab.title}</span>
        {badge ? (
          <span className="absolute top-1.5 right-1/2 ml-4 translate-x-6 rounded-full bg-critical px-1.5 text-[0.65rem] leading-4 font-bold text-critical-foreground">
            {badge}
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}
