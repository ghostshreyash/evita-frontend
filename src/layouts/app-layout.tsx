import { useState } from "react"
import { Outlet } from "react-router"
import { Leaf } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useMediaQuery } from "@/hooks/use-media"

/**
 * App shell for the tablet.
 *
 * Landscape (≥1024px wide, ~1280×800 on both target tablets) opens with the full
 * sidebar; portrait (~800px wide) opens with the icon rail so the screen keeps
 * its width. The engineer can still toggle either way, and rotating the tablet
 * goes back to the default for the new orientation.
 */
export function AppLayout() {
  const landscape = useMediaQuery("(min-width: 1024px)")
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
    </SidebarProvider>
  )
}
