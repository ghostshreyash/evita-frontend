import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"
import "./index.css"
import { router } from "./router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth/auth-context"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        {/* Top-centre, clear of the sidebar and of the thumbs at the bottom corners */}
        <Toaster richColors position="top-center" />
      </TooltipProvider>
    </AuthProvider>
  </StrictMode>
)
