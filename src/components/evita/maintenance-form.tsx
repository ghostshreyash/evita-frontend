import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { Activity, Camera, Droplets, Flame, NotebookPen, Plus, Send, Timer, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CaptureTile } from "@/components/evita/photo-capture"
import { Checklist, EvidenceStrip, FieldLabel, Segmented, StepCard } from "@/components/evita/field-kit"
import { TimeLog } from "@/components/evita/time-log"
import type { EvidenceItem } from "@/data/evidence"
import { fireSystems, pdMethods, products, type InstaProduct, type MaintenanceDetail } from "@/data/maintenance-detail"
import { resumeMaintenanceClock, saveMaintenanceDraft, stopMaintenanceClock, submitMaintenance, type MaintenanceDraft } from "@/data/maintenance-store"
import type { Job } from "@/lib/work"

const cleaningSteps = ["Surface cleaning completed", "Internal cleaning (as applicable)", "Post-cleaning drying completed"]

/**
 * Perform Maintenance for one job, as on EVITA mockup p.29: the real-time log,
 * the INSTA consumables used, evidence, the fire prevention and PD mitigation
 * add-ons, then Submit for Approval to OCC. Everything saves as it is entered;
 * the clock is written straight to the record by Start / Stop / Resume.
 */
export function MaintenanceForm({ job, detail }: { job: Job; detail: MaintenanceDetail }) {
  // The cleaning checklist is stored at the end of the notes; split it back out when reopening
  const [notes, setNotes] = useState((detail.execution?.notes ?? "").replace(/\s*Checklist: .*$/, ""))
  const [items, setItems] = useState<InstaProduct[]>(detail.products)
  const [cleaned, setCleaned] = useState<string[]>(() => cleaningSteps.filter((step) => detail.execution?.notes.includes(step)))
  const [evidence, setEvidence] = useState<EvidenceItem[]>(detail.evidence)
  const [fire, setFire] = useState<{ done?: "Yes" | "No"; system: string; remarks: string }>({
    done: detail.firePrevention ? "Yes" : undefined,
    system: detail.firePrevention?.system ?? "",
    remarks: detail.firePrevention?.remarks ?? "",
  })
  const [pd, setPd] = useState<{ done?: "Yes" | "No"; method: string; before: string; after: string; remarks: string }>({
    done: detail.pdMitigation ? "Yes" : undefined,
    method: detail.pdMitigation?.method ?? "",
    before: "",
    after: "",
    remarks: detail.pdMitigation?.remarks ?? "",
  })
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const timeLog = detail.timeLog ?? []
  const running = timeLog.length > 0 && !timeLog.at(-1)!.end

  const patch = useMemo<MaintenanceDraft>(
    () => ({
      notes: [notes, cleaned.length ? `Checklist: ${cleaned.join("; ")}.` : ""].filter(Boolean).join(" "),
      products: items.filter((p) => p.name && p.quantity > 0),
      evidence,
      firePrevention: fire.done === "Yes" && fire.system ? { system: fire.system, remarks: fire.remarks } : undefined,
      pdMitigation:
        pd.done === "Yes" && pd.method
          ? { method: pd.method, remarks: [pd.before && pd.after ? `PD ${pd.before} dB before, ${pd.after} dB after.` : "", pd.remarks].filter(Boolean).join(" ") }
          : undefined,
    }),
    [notes, cleaned, items, evidence, fire, pd]
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

  const before = evidence.filter((e) => e.label.startsWith("Before"))
  const after = evidence.filter((e) => e.label.startsWith("After"))
  const thermal = evidence.filter((e) => e.kind === "thermal")
  const usedProducts = items.filter((p) => p.name && p.quantity > 0)

  const checklist = [
    { label: "Work time logged", done: timeLog.length > 0 },
    { label: "INSTA consumables booked", done: usedProducts.length > 0 },
    { label: "Cleaning checklist complete", done: cleaned.length === cleaningSteps.length },
    { label: "After-maintenance photos uploaded", done: after.length > 0 },
    { label: "Fire prevention answered", done: !!fire.done && (fire.done === "No" || !!fire.system) },
    { label: "PD mitigation answered", done: !!pd.done && (pd.done === "No" || !!pd.method) },
  ]
  const ready = checklist.every((c) => c.done)

  const capture = (label: string) => (captured: EvidenceItem[]) =>
    setEvidence((ev) => [...ev, ...captured.map((c) => ({ ...c, label: c.kind === "thermal" ? "Thermal scan — after" : label }))])
  const remove = (id: string) => setEvidence((ev) => ev.filter((e) => e.id !== id))

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        {/* ---------- 1. Real-time log ---------- */}
        <StepCard step={1} title="Real Time Maintenance Log" icon={Timer} done={timeLog.length > 0 && !running}>
          <TimeLog entries={timeLog} onStop={() => stopMaintenanceClock(job.id)} onResume={() => resumeMaintenanceClock(job.id)} />
        </StepCard>

        {/* ---------- 2. Notes ---------- */}
        <StepCard step={2} title="Work Notes" icon={NotebookPen} done={!!notes.trim()}>
          <Textarea value={notes} rows={3} onChange={(e) => setNotes(e.target.value)} placeholder="What was done, e.g. Busbar chamber de-dusted, terminations re-torqued." />
        </StepCard>

        {/* ---------- 3. Consumables ---------- */}
        <StepCard step={3} title="Fluids & Consumables" icon={Droplets} done={usedProducts.length > 0 && cleaned.length === cleaningSteps.length}>
          <div className="space-y-3">
            {items.map((p, i) => (
              <div key={i} className="grid items-end gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
                <div>
                  <FieldLabel required>INSTA product</FieldLabel>
                  <Select
                    value={p.name}
                    onValueChange={(v) => setItems((rows) => rows.map((r, j) => (j === i ? { ...r, name: v, unit: products.find((x) => x.name === v)?.unit ?? r.unit } : r)))}
                  >
                    <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Choose product" /></SelectTrigger>
                    <SelectContent>
                      {products.map((x) => <SelectItem key={x.name} value={x.name}>{x.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel required>Quantity ({p.unit || "—"})</FieldLabel>
                  <Input
                    inputMode="decimal"
                    value={p.quantity ? String(p.quantity) : ""}
                    onChange={(e) => setItems((rows) => rows.map((r, j) => (j === i ? { ...r, quantity: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 } : r)))}
                    className="bg-card tabular-nums"
                  />
                </div>
                <Button variant="ghost" size="icon" className="text-critical" aria-label="Remove product" onClick={() => setItems((rows) => rows.filter((_, j) => j !== i))}>
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={() => setItems((rows) => [...rows, { name: "", quantity: 0, unit: "" }])}>
              <Plus /> Add Product
            </Button>
            <div className="space-y-1 border-t pt-3">
              {cleaningSteps.map((step) => (
                <Label key={step} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-normal">
                  <Checkbox
                    checked={cleaned.includes(step)}
                    onCheckedChange={(v) => setCleaned((c) => (v ? [...c, step] : c.filter((x) => x !== step)))}
                  />
                  {step}
                </Label>
              ))}
            </div>
          </div>
        </StepCard>

        {/* ---------- 4. Evidence ---------- */}
        <StepCard step={4} title="Maintenance Images" icon={Camera} done={after.length > 0}>
          <div className="space-y-4">
            <div>
              <FieldLabel>Before maintenance ({before.length})</FieldLabel>
              <EvidenceStrip items={before} onRemove={remove}>
                <CaptureTile kind="photo" label="Before Photo" onCapture={capture("Before — as found")} />
              </EvidenceStrip>
            </div>
            <div>
              <FieldLabel required>After maintenance ({after.length})</FieldLabel>
              <EvidenceStrip items={after} onRemove={remove}>
                <CaptureTile kind="photo" label="After Photo" onCapture={capture("After — as left")} />
              </EvidenceStrip>
            </div>
            <div>
              <FieldLabel>Thermal images ({thermal.length})</FieldLabel>
              <EvidenceStrip items={thermal} onRemove={remove}>
                <CaptureTile kind="thermal" label="Thermal Image" onCapture={capture("Thermal scan — after")} />
              </EvidenceStrip>
            </div>
          </div>
        </StepCard>

        {/* ---------- 5 & 6. Add-ons ---------- */}
        <div className="grid gap-4 lg:grid-cols-2">
          <StepCard step={5} title="Fire Prevention System" icon={Flame} done={!!fire.done && (fire.done === "No" || !!fire.system)}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Installed or serviced on this job?</FieldLabel>
                <Segmented label="Fire prevention installed" value={fire.done} options={["Yes", "No"] as const} onChange={(v) => setFire((f) => ({ ...f, done: v }))} />
              </div>
              {fire.done === "Yes" ? (
                <>
                  <div>
                    <FieldLabel required>System type</FieldLabel>
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

          <StepCard step={6} title="Partial Discharge Mitigation" icon={Activity} done={!!pd.done && (pd.done === "No" || !!pd.method)}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>PD reduction activity performed?</FieldLabel>
                <Segmented label="PD mitigation performed" value={pd.done} options={["Yes", "No"] as const} onChange={(v) => setPd((p) => ({ ...p, done: v }))} />
              </div>
              {pd.done === "Yes" ? (
                <>
                  <div>
                    <FieldLabel required>Method</FieldLabel>
                    <Select value={pd.method} onValueChange={(v) => setPd((p) => ({ ...p, method: v }))}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Choose method" /></SelectTrigger>
                      <SelectContent>{pdMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <FieldLabel>PD before (dB)</FieldLabel>
                      <Input inputMode="decimal" value={pd.before} onChange={(e) => setPd((p) => ({ ...p, before: e.target.value }))} className="tabular-nums" />
                    </div>
                    <div>
                      <FieldLabel>PD after (dB)</FieldLabel>
                      <Input inputMode="decimal" value={pd.after} onChange={(e) => setPd((p) => ({ ...p, after: e.target.value }))} className="tabular-nums" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Remarks</FieldLabel>
                    <Input value={pd.remarks} onChange={(e) => setPd((p) => ({ ...p, remarks: e.target.value }))} placeholder="e.g. All joints tightened" />
                  </div>
                </>
              ) : null}
            </div>
          </StepCard>
        </div>
      </div>

      {/* ---------- Submit for approval ---------- */}
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <section className="space-y-4 rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="text-base font-semibold">Submit for Approval</h3>
          <p className="text-sm text-muted-foreground">OCC reviews the evidence and approves the work, or sends it back with remarks. The asset's health report updates after approval.</p>
          <Checklist items={checklist} />
          <Button
            size="lg"
            className="w-full"
            disabled={!ready}
            onClick={() => {
              submitMaintenance(job.id, patch)
              toast.success("Submitted for approval", { description: `${job.id} · ${job.asset} is with OCC for review` })
            }}
          >
            <Send /> Submit for Approval
          </Button>
          <p className="text-center text-xs text-muted-foreground">{savedAt ? `Draft saved at ${savedAt}` : "Saved automatically as you work"}</p>
        </section>
      </aside>
    </div>
  )
}
