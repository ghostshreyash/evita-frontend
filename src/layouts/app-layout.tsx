import { useState } from "react"
import { Outlet } from "react-router"

import { AppBar } from "@/components/layout/app-bar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Panels } from "@/components/evita/panels"
import { HelpBot } from "@/components/evita/help-bot"

/**
 * App shell for the tablet: a light bar at the top, and the sections behind the
 * menu button at its left.
 *
 * No docked rail. EVITA is held, not sat at, so the page keeps the full width
 * at every size and the navigation comes over it when it is asked for rather
 * than taking a column of its own.
 *
 * The help assistant is docked here rather than on a screen, so the same
 * conversation is in reach from every one of them.
 */
export function AppLayout() {
  const [menu, setMenu] = useState(false)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppBar onMenu={() => setMenu(true)} />
      <AppSidebar open={menu} onOpenChange={setMenu} />
      <main className="mx-auto w-full max-w-[112rem] flex-1 px-3 pt-4 pb-10 sm:px-4">
        <Outlet />
      </main>
      <HelpBot />
      <Panels />
    </div>
  )
}
