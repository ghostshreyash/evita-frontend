import { useState } from "react"
import { BookOpen, CircleCheck, HardHat, ShieldCheck, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { instructions } from "@/data/inspection-detail"
import { openPanel } from "@/lib/ui-store"

/** Steps that apply before any job, whatever the activity */
const beforeYouStart = [
  "Confirm the permit to work is issued and valid for this asset.",
  "Isolate, lock out and tag out where the activity needs the asset de-energised.",
  "Prove the absence of voltage with a tested detector before touching anything.",
  "Wear the PPE the job calls for: arc-rated clothing, insulated gloves, helmet and safety shoes.",
  "Keep the approach distance to live parts; barricade the work area.",
]

/** The maintenance programmes, worded as on the EMMS-E assignment */
const maintenanceSops: Record<string, string> = {
  "Preventive Maintenance":
    "De-dust the panel, clean contact surfaces with the specified INSTA CLEAN grade, verify terminations to torque and record post-work readings and photos.",
  "Condition-Based Maintenance":
    "Act on the finding that raised the job: clean, re-torque and treat the affected compartment, then re-scan under load to confirm the reading has settled.",
  "Fire Preventive Maintenance":
    "Inspect suppression readiness, install or service the fire prevention system, apply retardant treatment where specified and log the outcome.",
}

const library = [
  ...Object.entries(instructions).map(([title, body]) => ({ title, body, group: "Inspection & testing" })),
  ...Object.entries(maintenanceSops).map(([title, body]) => ({ title, body, group: "Maintenance (INSTA CLEAN)" })),
]

/**
 * SOP / Manual: the instruction for each activity an ELPREMAR is assigned,
 * plus the steps that come before every job. Opened from a task, it lands on
 * that task's activity.
 */
export function SopDialog({ activity, onOpenChange }: { activity?: string; onOpenChange: (o: boolean) => void }) {
  const initial = library.find((s) => s.title === activity || activity?.startsWith(s.title.split(" ")[0]))?.title ?? library[0].title
  const [selected, setSelected] = useState(initial)
  const sop = library.find((s) => s.title === selected) ?? library[0]

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="size-5 text-primary" /> SOP / Manual
          </DialogTitle>
          <DialogDescription className="text-sm">Standard operating procedure for each activity you may be assigned.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[15rem_minmax(0,1fr)]">
          <nav className="space-y-3">
            {["Inspection & testing", "Maintenance (INSTA CLEAN)"].map((group) => (
              <div key={group}>
                <div className="mb-1 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group}</div>
                <ul className="space-y-1">
                  {library
                    .filter((s) => s.group === group)
                    .map((s) => (
                      <li key={s.title}>
                        <button
                          type="button"
                          onClick={() => setSelected(s.title)}
                          className={cn(
                            "flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm",
                            s.title === selected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                        >
                          {s.title}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>

          <article className="space-y-4 rounded-lg bg-muted/40 p-4">
            <h3 className="text-lg font-semibold">{sop.title}</h3>
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><HardHat className="size-4 text-attention" /> Before you start</h4>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                {beforeYouStart.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </section>
            <section>
              <h4 className="mb-2 text-sm font-semibold">Procedure</h4>
              <p className="text-sm leading-relaxed">{sop.body}</p>
            </section>
            <section>
              <h4 className="mb-2 text-sm font-semibold">Record in EVITA</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Readings with their instrument, anything abnormal as an observation with its severity, and photos or thermal
                images of the asset as found and as left. Submit only when the checklist on the task is complete.
              </p>
            </section>
          </article>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const safetyRules = [
  { title: "Permit to work", body: "No work starts without a valid permit for the asset and the activity." },
  { title: "Isolate and lock out", body: "Isolate every source, apply your own lock and tag, and keep the key with you." },
  { title: "Test before touch", body: "Prove dead with a tested voltage detector; re-prove after any break in the work." },
  { title: "Right PPE", body: "Arc-rated clothing, insulated gloves, helmet with face shield, safety shoes." },
  { title: "Approach distance", body: "Stay outside the limits for live parts; barricade and sign the work area." },
  { title: "Stop and report", body: "If anything is unsafe, stop, make the area safe and report it at once." },
]

/** Safety First: the rules behind the dashboard card, with a direct route to report a hazard */
export function SafetyDialog({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldCheck className="size-5 text-healthy" /> Safety First
          </DialogTitle>
          <DialogDescription className="text-sm">Follow all safety procedures. Report any unsafe condition immediately.</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3 sm:grid-cols-2">
          {safetyRules.map((r) => (
            <li key={r.title} className="flex gap-3 rounded-lg bg-healthy-soft/60 p-3 ring-1 ring-healthy/15">
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-healthy" />
              <span>
                <span className="block text-sm font-semibold">{r.title}</span>
                <span className="text-sm text-muted-foreground">{r.body}</span>
              </span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" className="text-critical" onClick={() => openPanel({ kind: "issue" })}>
            <TriangleAlert /> Report unsafe condition
          </Button>
          <Button onClick={() => onOpenChange(false)}>Understood</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
