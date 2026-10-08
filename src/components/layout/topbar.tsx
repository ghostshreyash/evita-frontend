import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { format } from "date-fns"
import { Bell, Clock, CloudCheck, CloudOff, Factory, LogOut, Menu } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { useOnline } from "@/hooks/use-media"
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

/** Bordered chip the top bar groups its read-outs in */
const chip = "flex h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm ring-1"

/**
 * EVITA's top bar, as in the tablet design: the wordmark with its FIELD tag,
 * the posting, the 24-hour clock and the connection state as chips, then
 * notifications and an explicit Logout button (no menu to open first on a
 * touch screen).
 */
export function Topbar() {
  const now = useClock()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const me = useCurrentElpremar()
  const online = useOnline()
  const { unread } = useNotifications()
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2.5 border-b border-topbar-border bg-topbar px-3 text-topbar-foreground">
      <button
        type="button"
        aria-label="Open menu"
        onClick={toggleSidebar}
        className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-white/10"
      >
        <Menu className="size-6" />
      </button>

      <div className="flex min-w-0 items-center gap-2">
        <span className="text-2xl leading-none font-black tracking-[-0.03em]">
          EVITA<sup className="ml-0.5 align-super text-[0.6rem] font-bold text-white/80">™</sup>
        </span>
        <span className="rounded bg-primary px-1.5 py-0.5 text-[0.7rem] font-bold tracking-wide text-primary-foreground">FIELD</span>
      </div>

      <div className={cn(chip, "ml-auto min-w-0 bg-white/5 ring-white/15")}>
        <Factory className="size-4 shrink-0 text-topbar-muted-foreground" />
        <span className="max-w-56 truncate font-medium">
          {me.enterprise} / {me.plant}
        </span>
      </div>

      <div className={cn(chip, "bg-white/5 tabular-nums ring-white/15 max-sm:hidden")}>
        <Clock className="size-4 text-topbar-muted-foreground" />
        {format(now, "HH:mm")} • {format(now, "dd MMM")}
      </div>

      {/* Connection state, so the engineer knows whether records are reaching the server */}
      <div
        className={cn(
          chip,
          "font-medium max-md:px-2.5",
          online ? "bg-healthy/15 text-[#7ee2a0] ring-healthy/35" : "bg-attention/15 text-brand-gold ring-attention/40"
        )}
      >
        {online ? <CloudCheck className="size-4" /> : <CloudOff className="size-4" />}
        <span className="max-md:hidden">{online ? "All synced" : "Offline · saved on tablet"}</span>
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
        className="shrink-0 bg-white/5 text-base text-topbar-foreground ring-1 ring-white/15 hover:bg-white/10 hover:text-topbar-foreground"
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
