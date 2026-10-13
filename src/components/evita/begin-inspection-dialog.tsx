import { useNavigate } from "react-router"
import { ChevronRight, ClipboardCheck, Plus, QrCode, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { openPanel } from "@/lib/ui-store"
import { actionFor, jobPath, useMyJobs } from "@/lib/work"

/**
 * How an inspection begins.
 *
 * An inspection is not an assigned task — the ELPREMAR starts one by standing
 * at an asset, so the question is only which asset. Either it is already on
 * the register, in which case its label is scanned, or it is not, in which
 * case it is onboarded first. The client's own order on 12-10-2026: "asset
 * onboarding, to ek scan code generate ho… next step ELPREMAR us scan code ko
 * scan karega, to automatically uske parameters load ho jayenge."
 *
 * Anything already booked for today is offered underneath, because an
 * assignment is still the usual reason to be at the plant.
 */
export function BeginInspectionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const booked = useMyJobs().filter((j) => j.kind === "inspection" && actionFor(j) !== "view")

  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ClipboardCheck className="size-5 text-primary" /> Start an inspection
          </DialogTitle>
          <DialogDescription className="text-sm">Which asset are you standing at?</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <Route
            icon={QrCode}
            title="Scan its QR label"
            detail="The asset is already on the register. Scanning loads its parameters."
            onClick={() => {
              onOpenChange(false)
              openPanel({ kind: "scan" })
            }}
          />
          <Route
            icon={Plus}
            title="Onboard it first"
            detail="The asset is not on the register yet. Onboard it, then inspect it."
            onClick={() => go("/assets/onboarding")}
          />
        </div>

        {booked.length ? (
          <div className="border-t pt-3">
            <p className="mb-2 text-sm font-semibold">Or an inspection already on your book</p>
            <ul className="space-y-1.5">
              {booked.slice(0, 4).map((job) => (
                <li key={job.id}>
                  <button
                    type="button"
                    onClick={() => go(jobPath(job))}
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-muted/40 px-3 text-left hover:bg-muted"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{job.area || job.plant}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {job.plant} · <span className="tabular-nums">{job.id}</span> · {job.date}
                      </span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button variant="outline" className="h-12" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  )
}

/** One of the two ways in, sized for a thumb */
function Route({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: LucideIcon
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-32 flex-col items-start gap-2 rounded-xl p-3 text-left ring-1 ring-foreground/15 transition-colors hover:bg-accent"
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-info-soft text-primary">
        <Icon className="size-6" />
      </span>
      <span className="text-base font-bold text-brand-navy dark:text-foreground">{title}</span>
      <span className="text-xs leading-snug text-muted-foreground">{detail}</span>
    </button>
  )
}
