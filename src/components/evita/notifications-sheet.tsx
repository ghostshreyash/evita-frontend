import { useNavigate } from "react-router"
import { Bell, CheckCheck } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { markAllRead, markRead, noticeTime, useNotifications, type Notice } from "@/lib/notifications"

const dot: Record<Notice["tone"], string> = {
  info: "bg-primary",
  success: "bg-healthy",
  critical: "bg-critical",
  warning: "bg-attention",
}

/** Everything the bell holds; tapping one marks it read and opens what it is about */
export function NotificationsSheet({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const { notices, unread } = useNotifications()

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Bell className="size-5 text-primary" /> Notifications
          </SheetTitle>
          <SheetDescription>{unread ? `${unread} unread` : "You're all caught up."}</SheetDescription>
          {unread ? (
            <Button variant="outline" size="sm" className="mt-1 w-fit" onClick={() => markAllRead(notices.map((n) => n.id))}>
              <CheckCheck /> Mark all as read
            </Button>
          ) : null}
        </SheetHeader>

        <ul className="flex-1 divide-y overflow-y-auto">
          {notices.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  markRead(n.id)
                  if (n.to) {
                    onOpenChange(false)
                    navigate(n.to)
                  }
                }}
                className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-muted active:bg-muted", n.unread && "bg-info-soft/40")}
              >
                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", n.unread ? dot[n.tone] : "bg-foreground/15")} />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", n.unread && "font-semibold")}>{n.title}</span>
                  <span className="block text-sm text-muted-foreground">{n.detail}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{noticeTime(n.at)}</span>
              </button>
            </li>
          ))}
          {notices.length === 0 ? <li className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications.</li> : null}
        </ul>
      </SheetContent>
    </Sheet>
  )
}
