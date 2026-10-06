import { useState } from "react"
import { Outlet } from "react-router"
import { Leaf } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Panels } from "@/components/evita/panels"
import { useMediaQuery } from "@/hooks/use-media"

/**
 * App shell for the tablet.
 *
 * The full sidebar opens by default only from 1200px wide (Lenovo ThinkTab X11
 * landscape, ~1280px). Narrower screens open with the icon rail so the content
 * keeps its width: Galaxy Tab S9 FE landscape (1111px) and both tablets in
 * portrait (~712–800px). The engineer can still toggle either way, and crossing
 * the breakpoint (rotating the tablet) goes back to the default.
 */
export function AppLayout() {
  const landscape = useMediaQuery("(min-width: 1200px)")
  // A manual toggle only holds for the orientation it was made in
  const [choice, setChoice] = useState<{ landscape: boolean; open: boolean } | null>(null)
  const open = choice?.landscape === landscape ? choice.open : landscape

  return (
    <SidebarProvider
      open={open}
      onOpenChange={(next) => setChoice({ landscape, open: next })}
      style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
    >
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
