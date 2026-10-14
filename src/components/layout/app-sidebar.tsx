import { NavLink, useLocation } from "react-router"
import { ClipboardCheck, ClipboardList, FileText, HardDrive, Headset, LayoutDashboard, Leaf, QrCode, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { OlivineLogo } from "@/components/layout/olivine-logo"
import { openPanel } from "@/lib/ui-store"
import { actionFor, useMyJobs } from "@/lib/work"

/** One section of the app, and the route prefixes that belong to it */
type NavItem = { path: string; title: string; icon: LucideIcon; badge?: "work" | "inspection" }

/**
 * The sections, in the order the engineer works through them: their own screen,
 * the work on their book, then the plant they are standing in.
 */
const navigation: NavItem[] = [
  { path: "/", title: "Home", icon: LayoutDashboard },
  { path: "/my-tasks", title: "Tasks", icon: ClipboardList, badge: "work" },
  { path: "/inspections", title: "Inspections", icon: ClipboardCheck, badge: "inspection" },
  { path: "/assets", title: "Assets", icon: HardDrive },
  { path: "/reports", title: "Reports", icon: FileText },
  { path: "/contact", title: "Help", icon: Headset },
]

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

/**
 * EVITA's navigation, drawn as OCC draws its own: the cream logo header, navy
 * body, the active section filled in the brand blue, and the mountain artwork
 * from the mockups along the foot.
 *
 * It is a drawer rather than a docked rail. EVITA is held in two hands on a
 * tablet, and a rail that pushed the page across would take width from the
 * thing the engineer actually came to read - so it stays shut, and when it is
 * opened it comes over the screen and shuts again on the way out.
 *
 * Scanning is here too, at the top: it is the one thing started from anywhere,
 * and it opens the scanner over whatever screen is showing rather than
 * navigating away from it.
 */
export function AppSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pathname } = useLocation()
  // Work still needing the engineer's hands, counted per section
  const waiting = useMyJobs().filter((j) => actionFor(j) !== "view")
  const counts = {
    work: waiting.filter((j) => j.kind === "maintenance").length,
    inspection: waiting.filter((j) => j.kind === "inspection").length,
  }

  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="flex w-72 flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Sections</SheetTitle>
        <SheetDescription className="sr-only">Move between the screens of the field app.</SheetDescription>

        <header className="flex h-16 shrink-0 items-center justify-center bg-[#f7f4ee] p-1.5">
          <OlivineLogo className="h-full" />
        </header>

        <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const active = under(pathname, item.path)
              const badge = item.badge ? counts[item.badge] : 0
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    onClick={close}
                    className={cn(
                      "flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    {badge ? (
                      <span className="min-w-5 rounded-full bg-critical px-1.5 text-center text-xs leading-5 font-bold text-critical-foreground">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              )
            })}
          </ul>

          <button
            type="button"
            onClick={() => {
              close()
              openPanel({ kind: "scan" })
            }}
            className="mt-3 flex min-h-11 w-full items-center gap-2.5 rounded-lg border border-sidebar-border px-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <QrCode className="size-[18px] shrink-0" />
            Scan Asset QR
          </button>
        </nav>

        {/* Mountain artwork from the mockups, fading into the navy sidebar */}
        <div className="relative shrink-0 overflow-hidden">
          <img src="/brand/sidebar-mountains.jpg" alt="" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-transparent to-sidebar/80" />
          <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 text-center text-sm text-white">
            <Leaf className="size-6 fill-healthy text-healthy" />
            <span>People. Technology. Reliability.</span>
            <span>A Greener Future.</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
