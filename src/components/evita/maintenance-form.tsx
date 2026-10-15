import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { Camera, Flame, NotebookPen, Send, Timer, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CaptureTile } from "@/components/evita/photo-capture"
import { Checklist, CountPill, EvidenceStrip, FieldLabel, Segmented, StepCard } from "@/components/evita/field-kit"
import { TimeLog } from "@/components/evita/time-log"
import type { EvidenceItem } from "@/data/evidence"
import { fireSystems, type MaintenanceDetail } from "@/data/maintenance-detail"
import { useInspectionDetails } from "@/data/inspection-store"
import { resumeMaintenanceClock, saveMaintenanceDraft, stopMaintenanceClock, submitMaintenance, type MaintenanceDraft } from "@/data/maintenance-store"
import type { Job } from "@/lib/work"


/**
 * Perform Maintenance for one job, as on EVITA mockup p.29: the real-time log,
 * the INSTA consumables used, evidence, the fire prevention and PD mitigation
 * add-ons, then Submit. Everything saves as it is entered;
 * the clock is written straight to the record by Start / Stop / Resume.
 */
/**
 * The inspection's images, relabelled as the state the panel was found in.
 *
 * The ids are the inspection's own, so an image can be traced back to the visit
 * it was taken on rather than looking like it was shot twice.
 */
function carriedOver(evidence: EvidenceItem[] | undefined, inspectionId?: string): EvidenceItem[] {
  if (!evidence?.length) return []
  return evidence
    .filter((e) => e.kind !== "document")
    .map((e) => ({
      ...e,
      label: e.kind === "thermal" ? `Before thermal — ${e.label}` : `Before — ${e.label}`,
      caption: inspectionId ? `From inspection ${inspectionId}` : e.caption,
    }))
}

export function MaintenanceForm({ job, detail }: { job: Job; detail: MaintenanceDetail }) {
  /* The inspection this cleaning came out of, and what it asked for */
  const inspections = useInspectionDetails()
  const source = job.inspectionId ? inspections[job.inspectionId] : undefined

  const [notes, setNotes] = useState(detail.execution?.notes ?? "")
  /*
   * The before set is the inspection's own images, carried over.
   *
   * The point of the pair is to show what the clean changed, and the state the
   * panel was found in was already photographed on the visit that raised the
   * job - re-shooting it would be both wasted work and a different moment. They
   * arrive as ordinary evidence: the engineer can drop one that is not useful,
   * or add more of their own.
   */
  const [evidence, setEvidence] = useState<EvidenceItem[]>(() =>
    detail.evidence.length ? detail.evidence : carriedOver(source?.evidence, job.inspectionId)
  )
  const [fire, setFire] = useState<{ done?: "Yes" | "No"; system: string; remarks: string }>({
    done: detail.firePrevention ? "Yes" : undefined,
    system: detail.firePrevention?.system ?? "",
    remarks: detail.firePrevention?.remarks ?? "",
  })

  const [savedAt, setSavedAt] = useState<string | null>(null)
  const timeLog = detail.timeLog ?? []
  const running = timeLog.length > 0 && !timeLog.at(-1)!.end

  const patch = useMemo<MaintenanceDraft>(
    () => ({
      notes,
      products: detail.products,
      evidence,
      // The type is optional: answering Yes is what the record needs
      firePrevention: fire.done === "Yes" ? { system: fire.system, remarks: fire.remarks } : undefined,

    }),
    [notes, detail.products, evidence, fire]
  )

  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = window.setTimeout(() => {
      saveMaintenanceDraft(job.id, patch)
      setSavedAt(format(new Date(), "HH:mm"))
    }, 600)
    return () => window.clearTimeout(t)
  }, [patch, job.id])

  const isBefore = (e: EvidenceItem) => e.label.startsWith("Before")
  const before = evidence.filter((e) => e.kind === "photo" && isBefore(e))
  const after = evidence.filter((e) => e.kind === "photo" && !isBefore(e))
  const thermalBefore = evidence.filter((e) => e.kind === "thermal" && isBefore(e))
  const thermalAfter = evidence.filter((e) => e.kind === "thermal" && !isBefore(e))


  const checklist = [
    { label: "Work time logged", done: timeLog.length > 0 },
    { label: "After-cleaning photos uploaded", done: after.length > 0 },
  ]
  const ready = checklist.every((c) => c.done)

  const capture = (label: string) => (captured: EvidenceItem[]) =>
    setEvidence((ev) => [...ev, ...captured.map((c) => ({ ...c, label }))])
  /*
   * Removing a picture asks first.
   *
   * The before set is carried over from the inspection and cannot be shot
   * again - the panel has been cleaned since - and the remove control sits in
   * the corner of a thumbnail on a touch screen, which is where an accidental
   * tap lands. So the tap stages it and the dialog does the deleting.
   */
  const [dropping, setDropping] = useState<EvidenceItem>()
  const remove = (id: string) => setDropping(evidence.find((e) => e.id === id))
  const confirmRemove = () => {
    if (dropping) setEvidence((ev) => ev.filter((e) => e.id !== dropping.id))
    setDropping(undefined)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="min-w-0 space-y-5">
        {/* ---------- 1. Real-time log ---------- */}
        <StepCard title="Real Time Cleaning Log" icon={Timer} done={timeLog.length > 0 && !running}>
          <TimeLog entries={timeLog} onStop={() => stopMaintenanceClock(job.id)} onResume={() => resumeMaintenanceClock(job.id)} />
        </StepCard>

        {/* ---------- 2. Notes ---------- */}
        <StepCard title="Work Notes" icon={NotebookPen} done={!!notes.trim()}>
          <Textarea value={notes} rows={3} onChange={(e) => setNotes(e.target.value)} placeholder="What was done, e.g. Busbar chamber de-dusted, terminations re-torqued." />
        </StepCard>


        {/* ---------- 4. Evidence ---------- */}
        <StepCard title="Cleaning Images" icon={Camera} done={after.length > 0} actions={<CountPill done={after.length > 0}>{evidence.length} Captured</CountPill>}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Before cleaning ({before.length})</FieldLabel>
              {job.inspectionId ? (
                <p className="mb-1.5 text-xs text-muted-foreground">
                  Carried over from inspection {job.inspectionId}. Drop any that are not useful, or add your own.
                </p>
              ) : null}
              <EvidenceStrip items={before} onRemove={remove}>
                <CaptureTile kind="photo" label="Before Photo" onCapture={capture("Before — as found")} />
              </EvidenceStrip>
            </div>
            <div>
              <FieldLabel required>After cleaning ({after.length})</FieldLabel>
              <EvidenceStrip items={after} onRemove={remove}>
                <CaptureTile kind="photo" label="After Photo" onCapture={capture("After — as left")} />
              </EvidenceStrip>
            </div>
            <div>
              <FieldLabel>Thermal before ({thermalBefore.length})</FieldLabel>
              <EvidenceStrip items={thermalBefore} onRemove={remove}>
                <CaptureTile kind="thermal" label="Thermal Before" onCapture={capture("Before thermal — as found")} />
              </EvidenceStrip>
            </div>
            <div>
              <FieldLabel>Thermal after ({thermalAfter.length})</FieldLabel>
              <EvidenceStrip items={thermalAfter} onRemove={remove}>
                <CaptureTile kind="thermal" label="Thermal After" onCapture={capture("Thermal scan — after")} />
              </EvidenceStrip>
            </div>
          </div>
        </StepCard>

        {/* ---------- 5. Fire prevention ---------- */}
        <div className="grid gap-4">
          <StepCard title="Fire Prevention System" icon={Flame} done={!!fire.done}>
            <div className="space-y-3">
              <div>
                {/* Optional throughout: a cleaning job does not always touch the system */}
                <FieldLabel>Installed or serviced on this job?</FieldLabel>
                <Segmented label="Fire prevention installed" value={fire.done} options={["Yes", "No"] as const} onChange={(v) => setFire((f) => ({ ...f, done: v }))} />
              </div>
              {fire.done === "Yes" ? (
                <>
                  <div>
                    {/* Optional: the crew does not always know which system is fitted */}
                    <FieldLabel>System type</FieldLabel>
                    <Select value={fire.system} onValueChange={(v) => setFire((f) => ({ ...f, system: v }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choose system" /></SelectTrigger>
                      <SelectContent>{fireSystems.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Remarks</FieldLabel>
                    <Input value={fire.remarks} onChange={(e) => setFire((f) => ({ ...f, remarks: e.target.value }))} placeholder="e.g. Function-tested, tamper seal intact" />
                  </div>
                </>
              ) : null}
            </div>
          </StepCard>

        </div>
      </div>

      <AlertDialog open={!!dropping} onOpenChange={(open) => !open && setDropping(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {dropping?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the image from the record permanently - it is not kept anywhere else, and a before image
              cannot be taken again once the panel has been cleaned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-critical text-critical-foreground hover:bg-critical/90"
            >
              <Trash2 /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ---------- Submit ---------- */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <section className="space-y-4 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Cleaning Summary</h3>
          <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">Submitting closes the job out and records it against the asset. The asset's health report is updated from what was captured here.</p>
          <Checklist items={checklist} />
          <Button
            size="lg"
            className="h-14 w-full text-base font-semibold shadow-lg shadow-primary/30"
            disabled={!ready}
            onClick={() => {
              submitMaintenance(job.id, patch)
              toast.success("Cleaning submitted", { description: `${job.id} · ${job.asset} is closed out` })
            }}
          >
            <Send /> Submit
          </Button>
          <p className="text-center text-xs text-muted-foreground">{savedAt ? `Draft saved at ${savedAt}` : "Saved automatically as you work"}</p>
        </section>
      </aside>
    </div>
  )
}
