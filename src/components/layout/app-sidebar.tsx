import { NavLink, useLocation } from "react-router"
import { ClipboardCheck, ClipboardList, FileText, HardDrive, Headset, LayoutDashboard, QrCode, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { OlivineEmblem } from "@/components/layout/olivine-logo"
import { openPanel } from "@/lib/ui-store"
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
  { path: "/contact", title: "Help", icon: Headset },
]

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

/**
 * EVITA's navigation, drawn as OCC draws its collapsed sidebar: the emblem on
 * cream at the top, a navy rail of icons under it, and the section you are on
 * filled in the brand blue.
 *
 * A rail rather than a list of names. It is also a drawer rather than a docked
 * column: EVITA is held in two hands on a tablet, and anything permanently down
 * the left takes width from the thing the engineer came to read - so it stays
 * shut, comes over the screen when it is opened, and shuts again on the way
 * out. Each icon carries its name as its label, which is what a tooltip and a
 * screen reader both read.
 *
 * Scanning closes the rail: it is the one thing started from anywhere, and it
 * opens the scanner over whatever screen is showing.
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
        className="flex w-16 flex-col gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">Sections</SheetTitle>
        <SheetDescription className="sr-only">Move between the screens of the field app.</SheetDescription>

        <header className="flex h-16 shrink-0 items-center justify-center bg-[#f7f4ee]">
          <OlivineEmblem className="size-9" />
        </header>

        <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col items-center gap-2">
            {navigation.map((item) => {
              const active = under(pathname, item.path)
              const badge = item.badge ? counts[item.badge] : 0
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    onClick={close}
                    title={item.title}
                    aria-label={item.title}
                    className={cn(
                      "relative flex size-11 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="size-5" />
                    {badge ? (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-critical px-1 text-center text-[0.6rem] leading-4 font-bold text-critical-foreground">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              )
            })}

            <li className="mt-1 border-t border-sidebar-border pt-3">
              <button
                type="button"
                title="Scan Asset QR"
                aria-label="Scan an asset QR code"
                onClick={() => {
                  close()
                  openPanel({ kind: "scan" })
                }}
                className="flex size-11 items-center justify-center rounded-xl hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <QrCode className="size-5" />
              </button>
            </li>
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
