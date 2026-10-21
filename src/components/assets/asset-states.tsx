import { Link } from "react-router"
import { CloudOff, RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { loadAssets } from "@/data/asset-store"

/**
 * What the asset screens show while the register is on its way, and when it
 * does not arrive.
 *
 * Shared because the register reads the same on the list and on one asset: the
 * engineer is standing in a plant room on patchy wifi, and the useful thing to
 * say is whether the tablet is still trying and how to try again.
 */

/** The register is being read */
export function AssetsLoading({ label = "Loading the asset register…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
      <Spinner className="size-7 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

/**
 * The register could not be read.
 *
 * Retrying is offered rather than only reported: the usual cause on site is the
 * connection dropping for a moment, and asking again is the whole fix.
 */
export function AssetsUnreachable({ message, backTo }: { message?: string; backTo?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
      <CloudOff className="size-8 text-attention" />
      <p className="max-w-md text-sm text-muted-foreground">
        {message ?? "The asset register could not be reached."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => void loadAssets(true)}>
          <RotateCw /> Try again
        </Button>
        {backTo ? (
          <Button asChild variant="outline">
            <Link to={backTo}>Back to Assets</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
