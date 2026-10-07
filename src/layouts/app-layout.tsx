import { Outlet } from "react-router"
import { Leaf } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Panels } from "@/components/evita/panels"

/**
 * App shell for the tablet.
 *
 * On the tablets and phones the page gets the full width: the sidebar stays
 * closed and opens as a drawer from the menu button in the top bar, closing
 * again once a section is chosen. Only a desktop-wide screen (1440px+, see
 * use-mobile) docks it as a column, with the icon rail as its collapsed form.
 */
export function AppLayout() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-background">
        <Topbar />
        <main className="flex-1 p-4">
          <Outlet />
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t bg-card px-4 py-2.5 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Olivine Global Systems. All rights reserved.</span>
          <nav className="flex items-center gap-1">
            <a href="#" className="px-2 py-1 hover:text-foreground">Terms of Use</a>|
            <a href="#" className="px-2 py-1 hover:text-foreground">Privacy Policy</a>|
            <a href="#" className="px-2 py-1 hover:text-foreground">Support</a>
          </nav>
          <span className="flex items-center gap-1.5 italic">
            <Leaf className="size-3.5 text-healthy" /> People. Technology. Reliability. A Greener Future.
          </span>
        </footer>
      </SidebarInset>
      <Panels />
    </SidebarProvider>
  )
}
