import { NavLink, useLocation } from "react-router"
import { ClipboardCheck, ClipboardList, FileText, HardDrive, Headset, LayoutDashboard, Leaf, Menu, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { OlivineLogo } from "@/components/layout/olivine-logo"
import { actionFor, useMyJobs } from "@/lib/work"

/** One section of the app, and the badge it carries */
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
  /* What the engineer has reported, next to Help: both are the way back to OCC */
  { path: "/issues", title: "Reported Issues", icon: TriangleAlert },
  { path: "/contact", title: "Help", icon: Headset },
]

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

/** Work still needing the engineer's hands, counted per section */
function useCounts() {
  const waiting = useMyJobs().filter((j) => actionFor(j) !== "view")
  return {
    work: waiting.filter((j) => j.kind === "maintenance").length,
    inspection: waiting.filter((j) => j.kind === "inspection").length,
  }
}

/**
 * The rail that is always there: the button that opens it, then one icon per
 * section with the one you are on filled in the brand blue, as OCC draws its
 * collapsed sidebar.
 *
 * Narrow enough to cost the page almost nothing, which is why it can stay. The
 * names are on each icon as its label, so a hover and a screen reader both get
 * them; the button at its head opens the full list over the page.
 *
 * Sections only. Scanning is an action rather than a place, and it is on the
 * home screen's quick actions where the other things an ELPREMAR starts live.
 *
 * Hidden on a phone, where sixty-four pixels is a column the page needs.
 */
export function AppRail({ onMenu }: { onMenu: () => void }) {
  const { pathname } = useLocation()
  const counts = useCounts()

  return (
    <aside className="sticky top-0 z-30 hidden h-svh w-16 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground sm:flex">
      {/* The rail's own head opens it: the emblem is already on the bar beside it */}
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border">
        <button
          type="button"
          aria-label="Open the sections menu"
          onClick={onMenu}
          className="flex size-11 items-center justify-center rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Menu className="size-5" />
        </button>
      </div>

      <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col items-center gap-2">
          {navigation.map((item) => (
            <li key={item.path}>
              <RailLink item={item} active={under(pathname, item.path)} badge={item.badge ? counts[item.badge] : 0} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

/** One icon on the rail, with its count riding the corner */
function RailLink({ item, active, badge }: { item: NavItem; active: boolean; badge: number }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      title={item.title}
      aria-label={item.title}
      className={cn(
        "relative flex size-11 items-center justify-center rounded-xl transition-colors",
        active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <item.icon className="size-5" />
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-critical px-1 text-center text-[0.6rem] leading-4 font-bold text-critical-foreground">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </NavLink>
  )
}

/**
 * The same sections with their names, opened from the menu button.
 *
 * It comes over the page rather than pushing it across: EVITA is held in two
 * hands on a tablet, and widening the rail in place would reflow whatever the
 * engineer was reading. It shuts again on the way out.
 */
export function AppSidebar({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { pathname } = useLocation()
  const counts = useCounts()
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        showCloseButton={false}
        /* Narrow: it is a list of seven short names, and it covers the page while it is open */
        className="flex w-50 flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
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
