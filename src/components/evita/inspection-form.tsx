import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, ClipboardCheck, Flame, Gauge, NotebookPen, Plus, Send, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CaptureTile } from "@/components/evita/photo-capture"
import { Checklist, EvidenceStrip, FieldLabel, HealthRing, Segmented, StepCard } from "@/components/evita/field-kit"
import type { EvidenceItem } from "@/data/evidence"
import { completeInspection, saveInspectionDraft } from "@/data/inspection-store"
import type { InspectionDetail, Measurement, Observation, Severity } from "@/data/inspection-detail"
import { measurementParameters, measurementUnits } from "@/data/master-data"
import { scoreInspection } from "@/lib/health"
import type { Job } from "@/lib/work"

/** The reserved reading the Fire Prevention System step writes */
const FIRE = "Fire Prevention Status"

/** Readings each activity normally records, offered as a one-tap starting sheet */
const templates: Record<string, { parameter: string; unit: string }[]> = {
  "Thermal Scan": [
    { parameter: "Thermal Hotspot Temperature", unit: "°C" },
    { parameter: "Ambient Temperature", unit: "°C" },
    { parameter: "Temperature Difference / ΔT", unit: "°C" },
    { parameter: "Load Current", unit: "A" },
  ],
  "Insulation Resistance Testing": [
    { parameter: "Insulation Resistance", unit: "MΩ" },
    { parameter: "Earth Resistance", unit: "Ω" },
    { parameter: "Humidity", unit: "%" },
  ],
  "Partial Discharge Testing": [
    { parameter: "Partial Discharge", unit: "dB" },
    { parameter: "Voltage", unit: "kV" },
  ],
  "Visual Inspection": [
    { parameter: "Contamination Level", unit: "Other" },
    { parameter: "Humidity", unit: "%" },
  ],
  "Preventive Assessment": [
    { parameter: "Thermal Hotspot Temperature", unit: "°C" },
    { parameter: "Insulation Resistance", unit: "MΩ" },
    { parameter: "Partial Discharge", unit: "dB" },
    { parameter: "Contamination Level", unit: "Other" },
  ],
  "Fire Prevention System Check": [],
}

const observationTypes = [
  "Visual / physical condition",
  "Thermal abnormality",
  "Contamination",
  "Corrosion",
  "Moisture ingress",
  "Wiring / terminations",
  "Hotspot",
  "Other",
]
const severities: Severity[] = ["Low", "Medium", "High", "Critical"]
const results: Measurement["status"][] = ["Pass", "Attention", "Fail"]

const resultTone = (r: Measurement["status"]) =>
  r === "Pass" ? "bg-healthy text-healthy-foreground ring-healthy" : r === "Attention" ? "bg-attention text-attention-foreground ring-attention" : "bg-critical text-critical-foreground ring-critical"
const severityTone = (s: Severity) =>
  s === "Low" ? "bg-neutral text-neutral-foreground ring-neutral" : s === "Medium" ? "bg-attention text-attention-foreground ring-attention" : "bg-critical text-critical-foreground ring-critical"

/**
 * Testing & Measurements for one inspection task, as on EVITA mockup p.21:
 * readings, what was seen, photos and thermal images, the fire prevention
 * question, then submit. Everything saves as it is entered, so a dropped
 * connection or a refresh loses nothing; Submit locks it and re-scores the
 * asset.
 */
export function InspectionForm({ job, detail }: { job: Job; detail: InspectionDetail }) {
  const [measurements, setMeasurements] = useState<Measurement[]>(detail.measurements.filter((m) => m.parameter !== FIRE))
  const [fire, setFire] = useState<{ installed?: "Yes" | "No"; remarks: string }>(() => {
    const row = detail.measurements.find((m) => m.parameter === FIRE)
    return row ? { installed: row.value === "Installed" ? "Yes" : "No", remarks: row.source === "Manual entry" ? "" : row.source } : { remarks: "" }
  })
  const [observations, setObservations] = useState<Observation[]>(detail.observations)
  const [evidence, setEvidence] = useState<EvidenceItem[]>(detail.evidence)
  const [remarks, setRemarks] = useState(detail.execution?.remarks ?? "")
  const [savedAt, setSavedAt] = useState<string | null>(null)
  // Held from when the form opened: saving writes a new record, which must not re-trigger the save
  const [execution] = useState(detail.execution)

  const allMeasurements = useMemo<Measurement[]>(
    () => [
      ...measurements,
      ...(fire.installed
        ? [{ parameter: FIRE, value: fire.installed === "Yes" ? "Installed" : "Not installed", unit: "—", source: fire.remarks || "Manual entry", status: fire.installed === "Yes" ? "Pass" : "Attention" } as Measurement]
        : []),
    ],
    [measurements, fire]
  )
  const patch = useMemo<Partial<InspectionDetail>>(
    () => ({
      measurements: allMeasurements,
      observations,
      evidence,
      execution: execution && { ...execution, remarks },
    }),
    [allMeasurements, observations, evidence, remarks, execution]
  )

  // Autosave a moment after the last change
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const t = window.setTimeout(() => {
      saveInspectionDraft(job.id, patch)
      setSavedAt(format(new Date(), "HH:mm"))
    }, 600)
    return () => window.clearTimeout(t)
  }, [patch, job.id])

  const preview = scoreInspection(allMeasurements, observations)
  const photos = evidence.filter((e) => e.kind === "photo")
  const thermals = evidence.filter((e) => e.kind === "thermal")
  const filled = measurements.length > 0 && measurements.every((m) => m.parameter.trim() && m.value.trim())
  const checklist = [
    { label: "Readings recorded, every one with a value", done: filled || (job.activity === "Fire Prevention System Check" && measurements.length === 0) },
    { label: "Asset photographed", done: photos.length > 0 },
    { label: "Fire prevention system checked", done: !!fire.installed },
    { label: "Every observation has a finding", done: observations.every((o) => o.value.trim()) },
  ]
  const ready = checklist.every((c) => c.done)

  const setRow = (i: number, p: Partial<Measurement>) => setMeasurements((rows) => rows.map((r, j) => (j === i ? { ...r, ...p } : r)))
  const setObs = (i: number, p: Partial<Observation>) => setObservations((rows) => rows.map((r, j) => (j === i ? { ...r, ...p } : r)))

  const submit = () => {
    const result = scoreInspection(allMeasurements, observations)
    completeInspection(job.id, { ...patch, result })
    toast.success("Inspection completed", { description: `${job.asset} scored ${result.healthScore}/100` })
  }

  const template = templates[job.activity] ?? templates["Preventive Assessment"]

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        {/* ---------- 1. Readings ---------- */}
        <StepCard
          step={1}
          title="Testing & Measurements"
          icon={Gauge}
          done={filled}
          actions={
            measurements.length === 0 && template.length ? (
              <Button variant="outline" onClick={() => setMeasurements(template.map((t) => ({ ...t, value: "", source: "Manual entry", status: "Pass" })))}>
                <ClipboardCheck /> Use {job.activity} sheet
              </Button>
            ) : null
          }
        >
          <datalist id="parameters">
            {measurementParameters.map((p) => <option key={p} value={p} />)}
          </datalist>
          <div className="space-y-3">
            {measurements.map((m, i) => (
              <div key={i} className="grid gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5 md:grid-cols-[minmax(0,1.6fr)_7rem_6.5rem] lg:grid-cols-[minmax(0,1.6fr)_7rem_6.5rem_minmax(0,1fr)]">
                <div>
                  <FieldLabel required>Parameter</FieldLabel>
                  <Input list="parameters" value={m.parameter} onChange={(e) => setRow(i, { parameter: e.target.value })} className="bg-card" placeholder="e.g. Insulation Resistance" />
                </div>
                <div>
                  <FieldLabel required>Value</FieldLabel>
                  <Input value={m.value} inputMode="decimal" onChange={(e) => setRow(i, { value: e.target.value })} className="bg-card tabular-nums" />
                </div>
                <div>
                  <FieldLabel>Unit</FieldLabel>
                  <Select value={m.unit} onValueChange={(v) => setRow(i, { unit: v })}>
                    <SelectTrigger className="w-full bg-card"><SelectValue placeholder="Unit" /></SelectTrigger>
                    <SelectContent>
                      {[...new Set([m.unit, ...measurementUnits])].filter(Boolean).map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 lg:col-span-1">
                  <FieldLabel>Instrument</FieldLabel>
                  <Input value={m.source} onChange={(e) => setRow(i, { source: e.target.value })} className="bg-card" placeholder="e.g. Megger MIT525 or Manual entry" />
                </div>
                <div className="flex flex-wrap items-end justify-between gap-2 md:col-span-3 lg:col-span-4">
                  <div>
                    <FieldLabel>Result</FieldLabel>
                    <Segmented label="Result" value={m.status} options={results} tone={resultTone} onChange={(v) => setRow(i, { status: v })} />
                  </div>
                  <Button variant="ghost" className="text-critical" onClick={() => setMeasurements((rows) => rows.filter((_, j) => j !== i))}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            ))}
            {measurements.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No readings yet. Add each reading with the instrument it came from.</p> : null}
            <Button variant="outline" onClick={() => setMeasurements((rows) => [...rows, { parameter: "", value: "", unit: "", source: "Manual entry", status: "Pass" }])}>
              <Plus /> Add Reading
            </Button>
          </div>
        </StepCard>

        {/* ---------- 2. Observations ---------- */}
        <StepCard step={2} title="Observations" icon={TriangleAlert} done={observations.length > 0 && observations.every((o) => o.value.trim())}>
          <div className="space-y-3">
            {observations.map((o, i) => (
              <div key={i} className="grid gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-foreground/5 md:grid-cols-2">
                <div>
                  <FieldLabel>Type</FieldLabel>
                  <Select value={o.type} onValueChange={(v) => setObs(i, { type: v })}>
                    <SelectTrigger className="w-full bg-card"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[...new Set([o.type, ...observationTypes])].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel required>Finding</FieldLabel>
                  <Input value={o.value} onChange={(e) => setObs(i, { value: e.target.value })} className="bg-card" placeholder="What you saw, e.g. Dust in busbar chamber" />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Severity</FieldLabel>
                  <Segmented label="Severity" value={o.severity} options={severities} tone={severityTone} onChange={(v) => setObs(i, { severity: v })} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Remarks</FieldLabel>
                  <Textarea value={o.remarks} rows={2} onChange={(e) => setObs(i, { remarks: e.target.value })} className="bg-card" />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button variant="ghost" className="text-critical" onClick={() => setObservations((rows) => rows.filter((_, j) => j !== i))}>
                    <Trash2 /> Remove
                  </Button>
                </div>
              </div>
            ))}
            {observations.length === 0 ? <p className="py-2 text-sm text-muted-foreground">Nothing abnormal recorded. Add an observation for anything you see that needs attention.</p> : null}
            <Button variant="outline" onClick={() => setObservations((rows) => [...rows, { type: observationTypes[0], value: "", severity: "Low", remarks: "" }])}>
              <Plus /> Add Observation
            </Button>
          </div>
        </StepCard>

        {/* ---------- 3. Evidence ---------- */}
        <StepCard step={3} title="Asset & Thermal Images" icon={Camera} done={photos.length > 0}>
          <div className="space-y-4">
            <div>
              <FieldLabel required>Asset images ({photos.length})</FieldLabel>
              <EvidenceStrip items={photos} onRemove={(id) => setEvidence((ev) => ev.filter((e) => e.id !== id))}>
                <CaptureTile kind="photo" label="Add Image" onCapture={(items) => setEvidence((ev) => [...ev, ...items])} />
              </EvidenceStrip>
            </div>
            <div>
              <FieldLabel>Thermal images ({thermals.length})</FieldLabel>
              <EvidenceStrip items={thermals} onRemove={(id) => setEvidence((ev) => ev.filter((e) => e.id !== id))}>
                <CaptureTile kind="thermal" label="Add Thermal Image" onCapture={(items) => setEvidence((ev) => [...ev, ...items])} />
              </EvidenceStrip>
            </div>
            <p className="rounded-md bg-info-soft px-3 py-2 text-sm text-info-soft-foreground">
              No network on site? Images and readings stay on this tablet and sync once you are back online.
            </p>
          </div>
        </StepCard>

        {/* ---------- 4. Fire prevention ---------- */}
        <StepCard step={4} title="Fire Prevention System" icon={Flame} done={!!fire.installed}>
          <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)]">
            <div>
              <FieldLabel required>Is a fire prevention system installed?</FieldLabel>
              <Segmented
                label="Fire prevention system installed"
                value={fire.installed}
                options={["Yes", "No"] as const}
                tone={(v) => (v === "Yes" ? "bg-healthy text-healthy-foreground ring-healthy" : "bg-attention text-attention-foreground ring-attention")}
                onChange={(v) => setFire((f) => ({ ...f, installed: v }))}
              />
            </div>
            <div>
              <FieldLabel>Remarks</FieldLabel>
              <Input value={fire.remarks} onChange={(e) => setFire((f) => ({ ...f, remarks: e.target.value }))} placeholder="e.g. FM200 suppression installed" />
            </div>
          </div>
        </StepCard>

        {/* ---------- 5. Remarks ---------- */}
        <StepCard step={5} title="Inspection Remarks" icon={NotebookPen} done={!!remarks.trim()}>
          <Textarea value={remarks} rows={3} onChange={(e) => setRemarks(e.target.value)} placeholder="Overall condition, anything OCC should know." />
        </StepCard>
      </div>

      {/* ---------- Result and submit ---------- */}
      <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-3 text-base font-semibold">Health Score (estimate)</h3>
          <HealthRing score={preview.healthScore} caption="Updates as you record" />
        </section>
        <section className="space-y-4 rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="text-base font-semibold">Before you submit</h3>
          <Checklist items={checklist} />
          <Button size="lg" className="w-full" disabled={!ready} onClick={submit}>
            <Send /> Submit Testing & Measurements
          </Button>
          <p className="text-center text-xs text-muted-foreground">{savedAt ? `Draft saved at ${savedAt}` : "Saved automatically as you work"}</p>
        </section>
      </aside>
    </div>
  )
}
