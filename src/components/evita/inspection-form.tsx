import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, Check, Flame, Gauge, Lock, NotebookPen, Plus, Save, Send, Sparkles, Thermometer, Trash2, Wind, X, Zap, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CaptureTile } from "@/components/evita/photo-capture"
import { Checklist, CountPill, EvidenceStrip, FieldLabel, HealthRing, Segmented, StepCard } from "@/components/evita/field-kit"
import type { EvidenceItem } from "@/data/evidence"
import { completeInspection, saveInspectionDraft } from "@/data/inspection-store"
import type { InspectionCapture, InspectionDetail } from "@/data/inspection-detail"
import { healthScoreWeights } from "@/data/master-data"
import {
  angleSlotsFor,
  contaminationLevel,
  deltaTLimit,
  dustThickness,
  dustTypes,
  fpsStatuses,
  hygieneChecks,
  MIN_THERMAL_POINTS,
  resultLabel,
  resultPill,
  thermalPointsFor,
} from "@/data/test-template"
import { categoryFor } from "@/lib/asset-category"
import { emptyCapture, newId, observationsFrom, resultsFrom, scoreCapture, sectionsDone, thermalReadings } from "@/lib/testing"
import type { Job } from "@/lib/work"

type Section = "images" | "parameters" | "fps" | "pd"

/** The four sections in the order the ELPREMAR works through them */
const sections: { key: Section; title: string; icon: LucideIcon; phase2?: boolean }[] = [
  { key: "images", title: "Asset Images", icon: Camera },
  { key: "parameters", title: "Parameters", icon: Gauge },
  { key: "fps", title: "Fire Prevention", icon: Flame },
  { key: "pd", title: "Partial Discharge", icon: Zap, phase2: true },
]

const levelPill = { Low: resultPill.Pass, Medium: resultPill.Attention, High: resultPill.Fail } as const

const yesNoTone = (v: "Yes" | "No") => (v === "Yes" ? "bg-healthy text-healthy-foreground ring-healthy" : "bg-attention text-attention-foreground ring-attention")

type Setter = (p: Partial<InspectionCapture>) => void

/**
 * Testing & Measurements for one inspection task, in the client's Phase-1
 * order: the asset images (the angle views and the thermal images, one per
 * point), then the parameters read from them (ambient and hotspot
 * temperatures, contamination, physical hygiene), then the fire prevention
 * system. Partial Discharge is Phase 2 and stays disabled until the measuring
 * device integration arrives.
 *
 * Everything saves to the tablet as it is entered (the offline draft); Submit
 * locks the record, scores it and queues it for sync.
 */
export function InspectionForm({ job, detail }: { job: Job; detail: InspectionDetail }) {
  const category = categoryFor(job.asset)
  const [section, setSection] = useState<Section>("images")
  const [capture, setCapture] = useState<InspectionCapture>(() => detail.capture ?? emptyCapture())
  const [evidence, setEvidence] = useState<EvidenceItem[]>(detail.evidence)
  const [remarks, setRemarks] = useState(detail.execution?.remarks ?? "")
  const [savedAt, setSavedAt] = useState<string | null>(null)
  // Held from when the form opened: saving writes a new record, which must not re-trigger the save
  const [execution] = useState(detail.execution)

  const ids = useMemo(() => new Set(evidence.map((e) => e.id)), [evidence])
  const patch = useMemo<Partial<InspectionDetail>>(
    () => ({
      capture,
      evidence,
      measurements: resultsFrom(capture, category, ids),
      observations: observationsFrom(capture),
      execution: execution && { ...execution, remarks },
    }),
    [capture, evidence, ids, category, remarks, execution]
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

  const done = sectionsDone(capture, category, ids)
  const tabDone: Record<Section, boolean> = { images: done.images, parameters: done.thermal && done.contamination, fps: done.fps, pd: false }
  const preview = scoreCapture(capture)
  const ready = done.images && done.thermal && done.contamination && done.fps
  const set: Setter = (p) => setCapture((c) => ({ ...c, ...p }))
  const removeEvidence = (id: string) => setEvidence((ev) => ev.filter((e) => e.id !== id))

  const submit = () => {
    const result = scoreCapture(capture)
    completeInspection(job.id, { ...patch, result })
    toast.success("Testing & Measurements submitted", {
      description: navigator.onLine ? `${job.asset} scored ${result.healthScore}/100` : "Saved on this tablet; it will sync when you are back online",
    })
  }

  return (
    <div className="space-y-5">
      {/* ---------- Section tabs ---------- */}
      <nav aria-label="Testing sections" className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-2 shadow-xs ring-1 ring-foreground/10 md:grid-cols-4">
        {sections.map((s, i) => {
          const on = section === s.key
          const complete = tabDone[s.key]
          return (
            <button
              key={s.key}
              type="button"
              disabled={s.phase2}
              aria-current={on ? "step" : undefined}
              title={s.phase2 ? "Available in Phase 2, with the measuring device" : undefined}
              onClick={() => setSection(s.key)}
              className={cn(
                "flex min-h-14 items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold transition-colors",
                on ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : "hover:bg-muted",
                s.phase2 && "cursor-not-allowed text-muted-foreground hover:bg-transparent"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs",
                  on ? "bg-white/20" : complete ? "bg-healthy text-healthy-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {complete && !on ? <Check className="size-4" strokeWidth={3} /> : s.phase2 ? <Lock className="size-4" /> : i + 1}
              </span>
              <span className="leading-tight">
                {s.title}
                {s.phase2 ? <span className="block text-xs font-medium text-muted-foreground/80">Phase 2</span> : null}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          {section === "images" ? (
            <>
              <ImagesSection category={category} capture={capture} evidence={evidence} onCapture={setCapture} onEvidence={setEvidence} onRemove={removeEvidence} />
              <ThermalImagesSection category={category} capture={capture} evidence={evidence} set={set} onEvidence={setEvidence} onRemove={removeEvidence} />
            </>
          ) : section === "parameters" ? (
            <>
              <ThermalReadingsSection capture={capture} evidence={evidence} set={set} onImages={() => setSection("images")} />
              <ContaminationSection capture={capture} set={set} />
            </>
          ) : (
            <FpsSection capture={capture} set={set} />
          )}

          <StepCard step={7} title="Inspection Remarks" icon={NotebookPen} done={!!remarks.trim()}>
            <Textarea value={remarks} rows={3} maxLength={500} onChange={(e) => setRemarks(e.target.value)} placeholder="Overall condition, anything OCC should know." />
          </StepCard>
        </div>

        {/* ---------- Score estimate and submit ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="space-y-4 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
            <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Inspection Health Summary</h3>
            <div className="rounded-xl bg-muted/50 p-3">
              {/* Visual contamination carries 70% of the score, so there is no fair estimate without it */}
              {preview.breakdown?.visual !== undefined ? (
                <HealthRing score={preview.healthScore} caption="Estimate · updates as you record" />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">Record the contamination assessment to see the score estimate. It carries 70% of the score.</p>
              )}
            </div>
            <ScoreBreakdown breakdown={preview.breakdown} />
            <Checklist
              items={[
                { label: "Required angles photographed", done: done.images },
                { label: `Ambient + ${MIN_THERMAL_POINTS} or more thermal points`, done: done.thermal },
                { label: "Contamination and hygiene assessed", done: done.contamination },
                { label: "Fire prevention system checked", done: done.fps },
              ]}
            />
            <Button size="lg" className="h-14 w-full text-base font-semibold shadow-lg shadow-primary/30" disabled={!ready} onClick={submit}>
              <Send /> Submit
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full"
              onClick={() => {
                saveInspectionDraft(job.id, patch)
                setSavedAt(format(new Date(), "HH:mm"))
                toast.success("Draft saved on this tablet")
              }}
            >
              <Save /> Save as Draft
            </Button>
            <p className="text-center text-xs text-muted-foreground">{savedAt ? `Draft saved at ${savedAt}` : "Saved automatically as you work"}</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

/** The three weighted inputs behind the score, as bars */
export function ScoreBreakdown({ breakdown }: { breakdown?: { visual?: number; thermal?: number; fps?: number } }) {
  const rows = [
    { label: "Visual Contamination", value: breakdown?.visual },
    { label: "Thermal Condition", value: breakdown?.thermal },
    { label: "Fire Prevention Status", value: breakdown?.fps },
  ]
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => {
        const weight = healthScoreWeights.find((w) => w.input === r.label)?.weight
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {r.label} <span className="text-xs text-muted-foreground">· {weight}%</span>
              </span>
              <span className="tabular-nums font-semibold">{r.value ?? "—"}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", r.value === undefined ? "" : r.value >= 70 ? "bg-healthy" : r.value >= 50 ? "bg-attention" : "bg-critical")}
                style={{ width: `${r.value ?? 0}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ---------- 1. Asset images: the angle views ---------- */

function ImagesSection({
  category,
  capture,
  evidence,
  onCapture,
  onEvidence,
  onRemove,
}: {
  category: string
  capture: InspectionCapture
  evidence: EvidenceItem[]
  onCapture: React.Dispatch<React.SetStateAction<InspectionCapture>>
  onEvidence: React.Dispatch<React.SetStateAction<EvidenceItem[]>>
  onRemove: (id: string) => void
}) {
  const slots = angleSlotsFor(category)
  const shot = slots.filter((s) => evidence.some((e) => e.id === capture.angles[s.key])).length
  const slotIds = new Set(Object.values(capture.angles))
  const extra = evidence.filter((e) => e.kind === "photo" && !slotIds.has(e.id))
  return (
    <StepCard step={1} title="Asset Images (Multiple Angles)" icon={Camera} done={slots.filter((s) => s.required).every((s) => evidence.some((e) => e.id === capture.angles[s.key]))} actions={<CountPill done={shot > 0}>{shot} of {slots.length} Views</CountPill>}>
      <p className="mb-4 text-sm text-muted-foreground">Capture clear images of the asset from each angle. Views marked * are required.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {slots.map((s) => {
          const item = evidence.find((e) => e.id === capture.angles[s.key])
          return item ? (
            <Shot key={s.key} item={item} label={s.label} onRemove={() => onRemove(item.id)} />
          ) : (
            <CaptureTile
              key={s.key}
              kind="photo"
              label={`${s.label}${s.required ? " *" : ""}`}
              className="w-full"
              onCapture={(items) => {
                const [first] = items
                onEvidence((ev) => [...ev, { ...first, label: s.label, slot: s.key }])
                onCapture((c) => ({ ...c, angles: { ...c.angles, [s.key]: first.id } }))
              }}
            />
          )
        })}
      </div>
      <div className="mt-5">
        <FieldLabel>Additional images ({extra.length})</FieldLabel>
        <EvidenceStrip items={extra} onRemove={onRemove}>
          <CaptureTile kind="photo" label="Add More Images" onCapture={(items) => onEvidence((ev) => [...ev, ...items])} />
        </EvidenceStrip>
      </div>
      <OfflineNote />
    </StepCard>
  )
}

/** One captured image in a slot, with its label and a remove button */
function Shot({ item, label, onRemove, badge }: { item: EvidenceItem; label: string; onRemove: () => void; badge?: React.ReactNode }) {
  return (
    <figure className="relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className={cn("flex h-32 items-center justify-center", !item.src && (item.kind === "thermal" ? "bg-linear-to-br from-info via-attention to-critical" : "bg-linear-to-br from-muted to-info-soft"))}>
        {item.src ? <img src={item.src} alt={label} className="size-full object-cover" /> : item.kind === "thermal" ? <Thermometer className="size-7 text-white/80" /> : <Camera className="size-7 text-primary/60" />}
      </div>
      {badge ? <span className="absolute top-2 left-2">{badge}</span> : null}
      <figcaption className="flex items-center gap-1.5 px-2.5 py-2">
        <Check className="size-4 shrink-0 text-healthy" strokeWidth={3} />
        <span className="truncate text-sm font-semibold">{label}</span>
      </figcaption>
      <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-black/60 text-white">
        <X className="size-4" />
      </button>
    </figure>
  )
}

/* ---------- 2. Asset images: the thermal images, one per point ---------- */

/**
 * Each thermal image is one measurement point. The points usual for the asset
 * type are offered as empty tiles; any other point gets a tile of its own.
 * The temperatures are read off the images in the Parameters section.
 */
function ThermalImagesSection({
  category,
  capture,
  evidence,
  set,
  onEvidence,
  onRemove,
}: {
  category: string
  capture: InspectionCapture
  evidence: EvidenceItem[]
  set: Setter
  onEvidence: React.Dispatch<React.SetStateAction<EvidenceItem[]>>
  onRemove: (id: string) => void
}) {
  const readings = thermalReadings(capture)
  const suggested = thermalPointsFor(category).filter((p) => !capture.thermal.some((t) => t.point === p))
  const shot = readings.filter((r) => evidence.some((e) => e.slot === r.id)).length

  /** A new point from its first thermal image */
  const addPoint = (point: string, item: EvidenceItem) => {
    const id = newId()
    set({ thermal: [...capture.thermal, { id, point, maxTemp: "" }] })
    onEvidence((ev) => [...ev, { ...item, label: `${point} (thermal)`, slot: id }])
  }
  /** Removing the image removes the point unless a temperature was already read off it */
  const removePoint = (r: (typeof readings)[number], image?: EvidenceItem) => {
    if (image) onRemove(image.id)
    if (r.max === undefined) set({ thermal: capture.thermal.filter((t) => t.id !== r.id) })
  }

  return (
    <StepCard step={2} title="Thermal Images (Multiple Points)" icon={Thermometer} done={shot >= MIN_THERMAL_POINTS} actions={<CountPill done={shot >= MIN_THERMAL_POINTS}>{shot} {shot === 1 ? "Point" : "Points"}</CountPill>}>
      <p className="mb-4 text-sm text-muted-foreground">
        Capture a thermal image at each joint or termination you scan, at least {MIN_THERMAL_POINTS}. Each image is one point; its temperature goes in under Parameters.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {readings.map((r) => {
          const image = evidence.find((e) => e.slot === r.id)
          return image ? (
            <Shot
              key={r.id}
              item={image}
              label={r.point}
              onRemove={() => removePoint(r, image)}
              badge={r.max !== undefined ? <span className="rounded-md bg-black/70 px-2 py-0.5 tabular-nums text-xs font-semibold text-white">Max {r.max} °C</span> : null}
            />
          ) : (
            <CaptureTile key={r.id} kind="thermal" label={r.point} className="w-full" onCapture={(items) => onEvidence((ev) => [...ev, { ...items[0], label: `${r.point} (thermal)`, slot: r.id }])} />
          )
        })}
        {suggested.map((p) => (
          <CaptureTile key={p} kind="thermal" label={p} className="w-full" onCapture={(items) => addPoint(p, items[0])} />
        ))}
        <CaptureTile kind="thermal" label="Other Point" className="w-full" onCapture={(items) => addPoint(`Point ${capture.thermal.length + 1}`, items[0])} />
      </div>
      <OfflineNote thermal />
    </StepCard>
  )
}

/* ---------- 3. Parameters: the temperatures read off the thermal images ---------- */

function ThermalReadingsSection({ capture, evidence, set, onImages }: { capture: InspectionCapture; evidence: EvidenceItem[]; set: Setter; onImages: () => void }) {
  const readings = thermalReadings(capture)
  const read = readings.filter((r) => r.max !== undefined).length
  const setPoint = (id: string, p: Partial<InspectionCapture["thermal"][number]>) => set({ thermal: capture.thermal.map((t) => (t.id === id ? { ...t, ...p } : t)) })

  return (
    <StepCard
      step={3}
      title="Thermal Readings"
      icon={Thermometer}
      done={capture.ambient.trim() !== "" && readings.length >= MIN_THERMAL_POINTS && read === readings.length}
      actions={<CountPill done={read >= MIN_THERMAL_POINTS}>{read} of {readings.length} Read</CountPill>}
    >
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl bg-muted/50 p-4">
        <div className="w-40">
          <FieldLabel required>Ambient temperature</FieldLabel>
          <div className="relative">
            <Input inputMode="decimal" value={capture.ambient} onChange={(e) => set({ ambient: e.target.value.replace(/[^\d.-]/g, "") })} className="bg-card pr-10 tabular-nums" placeholder="e.g. 34" />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">°C</span>
          </div>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          Each point is judged on its rise over ambient (ΔT). Limit: <span className="font-semibold text-foreground">{deltaTLimit.text}</span> pass, up to {deltaTLimit.critical} °C warning, above that critical.
        </p>
      </div>

      {readings.length ? (
        <ul className="divide-y">
          {readings.map((r) => {
            const image = evidence.find((e) => e.slot === r.id)
            return (
              <li key={r.id} className="grid items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[4.5rem_minmax(0,1fr)_9rem_auto]">
                <div className={cn("hidden h-12 w-[4.5rem] overflow-hidden rounded-lg sm:flex items-center justify-center", !image?.src && "bg-linear-to-br from-info via-attention to-critical")}>
                  {image?.src ? <img src={image.src} alt="" className="size-full object-cover" /> : <Thermometer className="size-5 text-white/80" />}
                </div>
                <div>
                  <FieldLabel required>Point</FieldLabel>
                  <Input value={r.point} onChange={(e) => setPoint(r.id, { point: e.target.value })} className="bg-card" />
                </div>
                <div>
                  <FieldLabel required>Max temperature</FieldLabel>
                  <div className="relative">
                    <Input inputMode="decimal" value={r.maxTemp} onChange={(e) => setPoint(r.id, { maxTemp: e.target.value.replace(/[^\d.-]/g, "") })} className="bg-card pr-10 tabular-nums" />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">°C</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:w-44 sm:flex-col sm:items-end">
                  {r.status ? (
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", resultPill[r.status])}>
                      <span className="size-1.5 rounded-full bg-current" /> ΔT {r.dt} °C · {resultLabel[r.status]}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Awaiting temperatures</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-critical"
                    aria-label={`Remove ${r.point}`}
                    onClick={() => set({ thermal: capture.thermal.filter((t) => t.id !== r.id) })}
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
          <span>No thermal points yet. Add a thermal image for each point first.</span>
          <Button variant="outline" className="h-11" onClick={onImages}>
            <Plus /> Add Thermal Images
          </Button>
        </div>
      )}
    </StepCard>
  )
}

/* ---------- 4–5. Parameters: contamination & hygiene ---------- */

function ContaminationSection({ capture, set }: { capture: InspectionCapture; set: Setter }) {
  const level = contaminationLevel(capture.thickness, capture.dustTypes)
  const checked = hygieneChecks.filter((c) => capture.hygiene[c.key]).length
  return (
    <>
      <StepCard step={4} title="Contamination Assessment" icon={Wind} done={!!capture.thickness} actions={level ? <span className={cn("rounded-full px-3 py-1 text-sm font-bold", levelPill[level])}>{level}</span> : null}>
        <div className="space-y-4">
          <div>
            <FieldLabel required>Dust accumulation thickness</FieldLabel>
            <Segmented label="Dust thickness" value={capture.thickness} options={dustThickness} onChange={(v) => set({ thickness: v })} />
          </div>
          <div>
            <FieldLabel>Type of deposit (select all that apply)</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {dustTypes.map((t) => {
                const on = capture.dustTypes.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={on}
                    onClick={() => set({ dustTypes: on ? capture.dustTypes.filter((x) => x !== t) : [...capture.dustTypes, t] })}
                    className={cn("flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium ring-1 transition-colors", on ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-foreground/15 hover:bg-muted")}
                  >
                    {on ? <Check className="size-4" strokeWidth={3} /> : null}
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-info-soft/50 p-3 text-sm ring-1 ring-info/15">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Level is set by thickness; a conductive, damp or corrosive deposit raises it one step. After sync, AI reviews the images and may suggest a different level for review. It never changes what you record.
            </span>
          </div>
        </div>
      </StepCard>

      <StepCard step={5} title="Physical Hygiene Checks" icon={Check} done={checked === hygieneChecks.length} actions={<CountPill done={checked === hygieneChecks.length}>{checked} / {hygieneChecks.length}</CountPill>}>
        <ul className="divide-y">
          {hygieneChecks.map((c) => {
            const h = capture.hygiene[c.key]
            return (
              <li key={c.key} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-medium">{c.label}</span>
                  <Segmented
                    label={c.label}
                    value={h ? (h.ok ? "OK" : "Issue") : undefined}
                    options={["OK", "Issue"] as const}
                    tone={(v) => (v === "OK" ? "bg-healthy text-healthy-foreground ring-healthy" : "bg-attention text-attention-foreground ring-attention")}
                    onChange={(v) => set({ hygiene: { ...capture.hygiene, [c.key]: { ok: v === "OK", note: h?.note ?? "" } } })}
                  />
                </div>
                {h && !h.ok ? (
                  <Input
                    value={h.note}
                    onChange={(e) => set({ hygiene: { ...capture.hygiene, [c.key]: { ...h, note: e.target.value } } })}
                    className="mt-2 bg-card"
                    placeholder="What is wrong, e.g. two loose lugs on the outgoing feeder"
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
      </StepCard>
    </>
  )
}

/* ---------- 6. Fire prevention ---------- */

function FpsSection({ capture, set }: { capture: InspectionCapture; set: Setter }) {
  const fps = capture.fps
  return (
    <StepCard step={6} title="Fire Prevention System" icon={Flame} done={fps.installed === "No" || (fps.installed === "Yes" && !!fps.status)}>
      <div className="space-y-4">
        <div>
          <FieldLabel required>Is a fire prevention system installed in the panel?</FieldLabel>
          <Segmented label="Fire prevention system installed" value={fps.installed} options={["Yes", "No"] as const} tone={yesNoTone} onChange={(v) => set({ fps: { ...fps, installed: v, status: v === "No" ? undefined : fps.status } })} />
        </div>
        {fps.installed === "Yes" ? (
          <div>
            <FieldLabel required>Status of the system</FieldLabel>
            <Segmented
              label="Fire prevention status"
              value={fps.status}
              options={fpsStatuses}
              tone={(v) => (v === "Healthy / Normal" ? "bg-healthy text-healthy-foreground ring-healthy" : v === "At Risk" ? "bg-critical text-critical-foreground ring-critical" : "bg-attention text-attention-foreground ring-attention")}
              onChange={(v) => set({ fps: { ...fps, status: v } })}
            />
          </div>
        ) : null}
        <div>
          <FieldLabel>Remarks (optional)</FieldLabel>
          <Input value={fps.remarks} maxLength={200} onChange={(e) => set({ fps: { ...fps, remarks: e.target.value } })} placeholder="e.g. FM200 suppression system installed" />
          <div className="mt-1 text-right text-xs text-muted-foreground tabular-nums">{fps.remarks.length}/200</div>
        </div>
      </div>
    </StepCard>
  )
}

function OfflineNote({ thermal }: { thermal?: boolean }) {
  return (
    <p className="mt-4 rounded-md bg-info-soft px-3 py-2 text-sm text-info-soft-foreground">
      No network on site? {thermal ? "Thermal images" : "Images"} stay on this tablet and sync once you are back online.
    </p>
  )
}
