import { useState } from "react"
import { Outlet } from "react-router"

import { AppBar } from "@/components/layout/app-bar"
import { AppRail, AppSidebar } from "@/components/layout/app-sidebar"
import { Panels } from "@/components/evita/panels"
import { HelpBot } from "@/components/evita/help-bot"

/**
 * App shell for the tablet: a narrow rail of section icons down the left, a
 * light bar across the top of what is left, and the page under it.
 *
 * The rail is permanent but costs the page sixty-four pixels; the menu button
 * opens the same sections with their names, over the page rather than widening
 * the rail in place - EVITA is held in two hands, and reflowing what is being
 * read to make room for a navigation list is the wrong trade.
 *
 * The help assistant is docked here rather than on a screen, so the same
 * conversation is in reach from every one of them.
 */
export function AppLayout() {
  const [menu, setMenu] = useState(false)

  return (
    <div className="flex min-h-svh bg-background">
      {/* Always there, icon-wide; the menu button opens the same list named */}
      <AppRail onMenu={() => setMenu(true)} />
      <AppSidebar open={menu} onOpenChange={setMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppBar onMenu={() => setMenu(true)} />
        <main className="mx-auto w-full max-w-[112rem] flex-1 px-3 pt-4 pb-10 sm:px-4">
          <Outlet />
        </main>
      </div>

      <HelpBot />
      <Panels />
    </div>
  )
}
