import { NavLink, useNavigate } from "react-router"
import { Bell, CloudCheck, CloudOff, CloudUpload, LogOut, Menu, ShieldCheck } from "lucide-react"
import { cn } from "cn"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { OlivineEmblem } from "@/components/layout/olivine-logo"
import { SystemName } from "@/components/common/system-name"
import { Wordmark } from "@/components/common/wordmark"
import { useOnline } from "@/hooks/use-media"
import { useAuth } from "@/lib/auth/context"
import { useInspectionDetails } from "@/data/inspection-store"
import { useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"

/**
 * EVITA's top bar: the Olivine emblem with the EVITA-AI FIELD wordmark, whether
 * what was recorded has reached OCC, notifications, and their own avatar.
 *
 * Light rather than the navy of the desk consoles — the field app is used at
 * arm's length in daylight, and a white bar keeps the contrast with the cards
 * below it.
 *
 * The safety reminder rides here too, so it is on screen on every page rather
 * than only at the top of the home screen.
 *
 * The sections are behind the menu button on the left - see `AppSidebar`.
 */
export function AppBar({ onMenu }: { onMenu: () => void }) {
  const online = useOnline()
  const details = useInspectionDetails()
  const { unread } = useNotifications()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const waiting = Object.values(details).filter((d) => d.sync?.state === "pending").length
  const sync = !online
    ? { label: "Offline", icon: CloudOff, tint: "bg-muted text-muted-foreground ring-foreground/10" }
    : waiting
      ? { label: `Not synced (${waiting})`, icon: CloudUpload, tint: "bg-attention-soft text-attention ring-attention/30" }
      : { label: "Synced", icon: CloudCheck, tint: "bg-healthy-soft text-healthy ring-healthy/30" }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-card px-2.5 sm:px-3">
      <button
        type="button"
        aria-label="Open the sections menu"
        onClick={onMenu}
        className="flex size-11 shrink-0 items-center justify-center rounded-full text-foreground/70 hover:bg-muted sm:hidden"
      >
        <Menu className="size-6" />
      </button>

      <NavLink to="/" className="flex min-w-0 items-center gap-2">
        <OlivineEmblem className="size-9 shrink-0" />
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="text-xl leading-none font-black tracking-[-0.03em] text-brand-navy dark:text-foreground">
              <Wordmark tmClassName="ml-0.5 text-[0.55rem] font-bold text-muted-foreground" />
            </span>
            <span className="rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-bold tracking-wide text-primary-foreground">
              FIELD
            </span>
          </span>
          {/* What the wordmark stands for, under it. Dropped once the bar needs
              the width for the controls on its right. */}
          <SystemName className="mt-0.5 text-[0.6rem] text-muted-foreground max-xl:hidden" />
        </span>
      </NavLink>

      {/*
        * Whether what was recorded has reached OCC. On a plant floor the signal
        * comes and goes, and the one thing the engineer needs to know at a
        * glance is whether their work is still only on this tablet.
        */}
      <span
        className={cn(
          "ml-auto flex h-10 min-w-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ring-1",
          sync.tint
        )}
      >
        <sync.icon className="size-4 shrink-0" />
        <span className="truncate">{sync.label}</span>
      </span>

      {/*
        * The safety reminder. It used to sit on the home page, where it was read
        * once and then scrolled past; on the bar it is in front of the engineer
        * on every screen, which is the point of it.
        */}
      <button
        type="button"
        aria-label="Safety first"
        onClick={() => openPanel({ kind: "safety" })}
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-healthy-soft text-healthy ring-1 ring-healthy/35 hover:bg-healthy-soft/80"
      >
        <ShieldCheck className="size-5" />
      </button>

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

      <Button
        variant="ghost"
        size="icon"
        aria-label="Log out"
        className="size-11 shrink-0 rounded-full text-foreground/70 hover:bg-muted max-sm:hidden"
        onClick={() => {
          // TODO: warn before signing out while records are still waiting to sync
          void signOut()
          navigate("/login?reason=signed-out", { replace: true })
        }}
      >
        <LogOut className="size-5" />
      </Button>

      <NavLink to="/more" aria-label="Profile and more" className="shrink-0">
        <Avatar className="size-10">
          <AvatarFallback className="bg-primary text-sm font-bold text-primary-foreground">
            {user?.initials ?? "EL"}
          </AvatarFallback>
        </Avatar>
      </NavLink>
    </header>
  )
}
