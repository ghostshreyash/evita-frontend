import { useState } from "react"
import { NavLink, useNavigate } from "react-router"
import { Bell, CloudCheck, CloudOff, LogOut, Menu, MapPin } from "lucide-react"
import { cn } from "cn"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { OlivineEmblem, OlivineLogo } from "@/components/layout/olivine-logo"
import { navigation } from "@/config/navigation"
import { useOnline } from "@/hooks/use-media"
import { useAuth } from "@/lib/auth/context"
import { useCurrentElpremar } from "@/lib/me"
import { useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"
import { actionFor, useMyJobs } from "@/lib/work"

/**
 * EVITA's top bar, as the tablet design draws it: the menu, the Olivine
 * emblem with the EVITA FIELD wordmark, the posting the engineer is working
 * at, and their own avatar.
 *
 * Light rather than the navy of the desk consoles — the field app is used at
 * arm's length in daylight, and a white bar keeps the contrast with the cards
 * below it. The sections live on the bottom tab bar; the menu here carries the
 * same list for a thumb that is already at the top of the screen, plus who is
 * signed in and the way out.
 */
export function AppBar() {
  const [menu, setMenu] = useState(false)
  const me = useCurrentElpremar()
  const online = useOnline()
  const { unread } = useNotifications()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-card px-2.5 sm:px-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenu(true)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-foreground/70 hover:bg-muted"
        >
          <Menu className="size-6" />
        </button>

        <NavLink to="/" className="flex min-w-0 items-center gap-2">
          <OlivineEmblem className="size-9 max-sm:hidden" />
          <span className="text-xl leading-none font-black tracking-[-0.03em] text-brand-navy dark:text-foreground">
            EVITA<sup className="ml-0.5 align-super text-[0.55rem] font-bold text-muted-foreground">™</sup>
          </span>
          <span className="rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-primary-foreground">
            FIELD
          </span>
        </NavLink>

        {/* The posting, not a chooser: EVITA works one plant at a time */}
        <span className="ml-auto flex h-10 min-w-0 items-center gap-1.5 rounded-full bg-muted px-3 text-sm font-medium">
          <MapPin className="size-4 shrink-0 text-primary" />
          <span className="truncate max-sm:max-w-24">{me.plant}</span>
        </span>

        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          onClick={() => openPanel({ kind: "notifications" })}
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-muted"
        >
          <Bell className="size-5" />
          {unread ? (
            <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[0.65rem] leading-4 font-bold text-critical-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </button>

        <NavLink to="/more" aria-label="Profile and more" className="relative shrink-0">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
              {user?.initials ?? "EL"}
            </AvatarFallback>
          </Avatar>
          {/* The connection state rides the avatar, so it is on screen at all times */}
          <span className={cn("absolute right-0 bottom-0 size-3 rounded-full ring-2 ring-card", online ? "bg-healthy" : "bg-offline")} />
        </NavLink>
      </header>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-80 gap-0 bg-card p-0">
          <SheetHeader className="border-b bg-[#f7f4ee] p-3">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <OlivineLogo className="h-11" />
          </SheetHeader>

          <div className="flex items-center gap-3 border-b p-4">
            <div className="relative shrink-0">
              <Avatar className="size-12">
                <AvatarFallback className="bg-primary text-base font-bold text-primary-foreground">
                  {user?.initials ?? "EL"}
                </AvatarFallback>
              </Avatar>
              <span className={cn("absolute right-0 bottom-0 size-3.5 rounded-full ring-2 ring-card", online ? "bg-healthy" : "bg-offline")} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-base font-semibold">{me.name}</div>
              <div className="mt-0.5 truncate text-sm text-muted-foreground">ELPREMAR · {me.id}</div>
              <div className={cn("mt-1 flex items-center gap-1.5 text-xs font-medium", online ? "text-healthy" : "text-muted-foreground")}>
                {online ? <CloudCheck className="size-3.5" /> : <CloudOff className="size-3.5" />}
                {online ? "All synced" : "Offline · saved on tablet"}
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.path}>
                  <MenuLink path={item.path} title={item.title} icon={item.icon} onNavigate={() => setMenu(false)} />
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t p-3">
            <Button
              variant="outline"
              className="h-12 w-full justify-start text-critical"
              onClick={() => {
                // TODO: warn before signing out while records are still waiting to sync
                setMenu(false)
                signOut()
                navigate("/login?reason=signed-out", { replace: true })
              }}
            >
              <LogOut /> Logout
            </Button>
            <p className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>EVITA PWA Client</span>
              <span className="tabular-nums">v1.0.0</span>
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/** One section in the menu, carrying the open-work count against My Tasks */
function MenuLink({
  path,
  title,
  icon: Icon,
  onNavigate,
}: {
  path: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  onNavigate: () => void
}) {
  const open = useMyJobs().filter((j) => actionFor(j) !== "view").length
  const badge = path === "/my-tasks" ? open : 0

  return (
    <NavLink
      to={path}
      end={path === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex min-h-12 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium",
          isActive ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted"
        )
      }
    >
      <Icon className="size-5" />
      <span className="flex-1">{title}</span>
      {badge ? (
        <span className="min-w-6 rounded-full bg-critical px-1.5 text-center text-xs font-bold text-critical-foreground">{badge}</span>
      ) : null}
    </NavLink>
  )
}
