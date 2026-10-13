import { Outlet } from "react-router"

import { AppBar } from "@/components/layout/app-bar"
import { TabBar } from "@/components/layout/tab-bar"
import { Panels } from "@/components/evita/panels"
import { HelpBot } from "@/components/evita/help-bot"

/**
 * App shell for the tablet: a light bar at the top and the sections along the
 * bottom, where a thumb already rests.
 *
 * No docked sidebar. EVITA is held, not sat at, so the page gets the full
 * width at every size and the same list of sections lives both on the bottom
 * bar and behind the menu button.
 *
 * The bottom bar is fixed, so the page reserves room for it rather than
 * letting the last card disappear behind it.
 *
 * The help assistant is docked here rather than on a screen, so the same
 * conversation is in reach from every one of them.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <AppBar />
      <main className="mx-auto w-full max-w-[112rem] flex-1 px-3 pt-4 pb-28 sm:px-4">
        <Outlet />
      </main>
      <TabBar />
      <HelpBot />
      <Panels />
    </div>
  )
}
