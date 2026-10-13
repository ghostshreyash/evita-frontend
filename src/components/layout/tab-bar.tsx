import { NavLink, useLocation } from "react-router"
import {
  ClipboardCheck,
  ClipboardList,
  FileText,
  HardDrive,
  LayoutDashboard,
  Headset,
  QrCode,
  type LucideIcon,
} from "lucide-react"
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
 *
 * Three a side, which is what a six-slot bar needs to look like a bar rather
 * than a list that ran out of room. The order puts the engineer's own work to
 * the left of the scanner and the plant to its right, so scanning a label
 * leads straight into the half of the bar the asset lives in.
 *
 * The profile is not on the bar: it is behind the avatar in the top bar, where
 * a profile is looked for. The sixth slot is Contact & Help instead.
 */
type Tab = { path: string; title: string; icon: LucideIcon; badge?: "work" | "inspection" }

const left: Tab[] = [
  { path: "/", title: "Home", icon: LayoutDashboard },
  { path: "/my-tasks", title: "Tasks", icon: ClipboardList, badge: "work" },
  { path: "/inspections", title: "Inspect", icon: ClipboardCheck, badge: "inspection" },
]

const right: Tab[] = [
  { path: "/assets", title: "Assets", icon: HardDrive },
  { path: "/reports", title: "Reports", icon: FileText },
  { path: "/contact", title: "Contact", icon: Headset },
]

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

export function TabBar() {
  const { pathname } = useLocation()
  // Work still needing the engineer's hands, counted for Tasks and for Inspect
  const waiting = useMyJobs().filter((j) => actionFor(j) !== "view")
  const counts = { work: waiting.length, inspection: waiting.filter((j) => j.kind === "inspection").length }

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_16px_rgb(0_0_0/0.08)]"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {left.map((tab) => (
          <Item key={tab.path} tab={tab} active={under(pathname, tab.path)} badge={tab.badge ? counts[tab.badge] : 0} />
        ))}

        <li className="flex w-16 shrink-0 justify-center sm:w-20">
          <button
            type="button"
            aria-label="Scan an asset QR code"
            onClick={() => openPanel({ kind: "scan" })}
            className="-mt-6 flex size-15 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-card transition-transform active:scale-95"
          >
            <QrCode className="size-7" />
          </button>
        </li>

        {right.map((tab) => (
          <Item key={tab.path} tab={tab} active={under(pathname, tab.path)} badge={tab.badge ? counts[tab.badge] : 0} />
        ))}
      </ul>
    </nav>
  )
}

/**
 * One section. The active one is marked twice over — a bar along the top edge
 * and a tinted tile behind its icon — because on a bright site the colour
 * change alone is easy to miss.
 */
function Item({ tab, active, badge }: { tab: Tab; active: boolean; badge: number }) {
  return (
    <li className="min-w-0 flex-1">
      <NavLink
        to={tab.path}
        end={tab.path === "/"}
        className={cn(
          "relative flex min-h-16 flex-col items-center justify-center gap-1 px-0.5 pt-1 text-[0.65rem] leading-none font-semibold sm:text-[0.7rem]",
          active ? "text-primary" : "text-muted-foreground"
        )}
      >
        {active ? <span aria-hidden className="absolute inset-x-2 top-0 h-0.5 rounded-full bg-primary" /> : null}

        <span className="relative">
          <span className={cn("flex size-9 items-center justify-center rounded-xl transition-colors", active && "bg-info-soft")}>
            <tab.icon className="size-5" />
          </span>
          {badge ? (
            <span className="absolute -top-0.5 -right-1 min-w-4 rounded-full bg-critical px-1 text-center text-[0.6rem] leading-4 font-bold text-critical-foreground">
              {badge > 9 ? "9+" : badge}
            </span>
          ) : null}
        </span>

        <span className="w-full truncate text-center">{tab.title}</span>
      </NavLink>
    </li>
  )
}
