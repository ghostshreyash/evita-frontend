import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { format } from "date-fns"
import { Bell, Leaf, LogOut, MapPin } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/context"
import { useCurrentElpremar } from "@/lib/me"
import { useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"

/** Minute precision is all the bar shows, so there is no need to wake every second */
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])
  return now
}

/**
 * EVITA's top bar, as in the mockup: the wordmark, where the engineer is posted,
 * the date and time, notifications and an explicit Logout button (no menu to
 * open first on a touch screen).
 */
export function Topbar() {
  const now = useClock()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const me = useCurrentElpremar()
  const { unread } = useNotifications()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-topbar-border bg-topbar px-3 text-topbar-foreground">
      <SidebarTrigger className="size-11 text-topbar-foreground hover:bg-white/10 hover:text-topbar-foreground" />

      <div className="min-w-0">
        <div className="bg-gradient-to-r from-white via-white to-[#7cc35a] bg-clip-text text-2xl leading-none font-black tracking-[-0.04em] text-transparent">
          EVITA<sup className="ml-0.5 align-super text-[0.6rem] font-bold text-white/80">™</sup>
        </div>
        <p className="mt-0.5 truncate text-xs text-topbar-muted-foreground max-lg:hidden">
          Enterprise Electrical Maintenance &amp; Reliability Management System
        </p>
      </div>

      {/* Only on wide screens: on the tablets this space belongs to the posting and clock */}
      <div className="ml-auto hidden items-center gap-2 text-sm leading-tight text-topbar-muted-foreground italic 2xl:flex">
        <Leaf className="size-5 shrink-0 text-healthy" />
        <span>
          People. Technology. Reliability.
          <br />A Greener Future.
        </span>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-2 border-topbar-border text-sm leading-tight 2xl:ml-0 2xl:border-l 2xl:pl-4">
        <MapPin className="size-5 shrink-0 text-topbar-foreground" />
        <div className="min-w-0 max-w-44">
          <div className="truncate font-semibold">{me.enterprise}</div>
          <div className="truncate text-topbar-muted-foreground">{me.plant}</div>
        </div>
      </div>

      <div className="shrink-0 border-l border-topbar-border pl-3 text-sm leading-tight whitespace-nowrap max-sm:hidden">
        <div className="text-topbar-muted-foreground">{format(now, "EEE, d MMM yyyy")}</div>
        <div className="font-semibold">{format(now, "hh:mm a")}</div>
      </div>

      <button
        type="button"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => openPanel({ kind: "notifications" })}
        className="relative flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
      >
        <Bell className="size-6" />
        {unread ? (
          <span className="absolute top-1 right-1 flex min-w-5 items-center justify-center rounded-full bg-critical px-1 text-[0.7rem] leading-5 font-bold text-critical-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      <Button
        variant="ghost"
        className="shrink-0 border-l border-topbar-border pl-3 text-base text-topbar-foreground hover:bg-white/10 hover:text-topbar-foreground"
        onClick={() => {
          // TODO: warn before signing out while records are still waiting to sync
          signOut()
          navigate("/login?reason=signed-out", { replace: true })
        }}
      >
        <LogOut className="size-5" />
        <span className="max-md:hidden">Logout</span>
      </Button>
    </header>
  )
}
