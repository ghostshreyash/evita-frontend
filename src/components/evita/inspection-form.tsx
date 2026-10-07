import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, Check, Flame, Gauge, Lock, NotebookPen, Save, Send, Sparkles, Thermometer, Wind, Zap, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UploadSection } from "@/components/evita/upload-section"
import { Checklist, CountPill, FieldLabel, HealthRing, Segmented, StepCard } from "@/components/evita/field-kit"
import type { EvidenceItem } from "@/data/evidence"
import { stampNow } from "@/data/persist"
import { completeInspection, saveInspectionDraft } from "@/data/inspection-store"
import type { InspectionCapture, InspectionDetail } from "@/data/inspection-detail"
import { healthScoreWeights } from "@/data/master-data"
import {
  angleSlotsFor,
  contaminationLevel,
  dustThickness,
  dustTypes,
  fpsStatuses,
  hygieneChecks,
  MIN_THERMAL_POINTS,
  resultPill,
  thermalPointsFor,
} from "@/data/test-template"
import { categoryFor } from "@/lib/asset-category"
import { urlFor } from "@/lib/object-url"
import { emptyCapture, newId, observationsFrom, resultsFrom, scoreCapture, sectionsDone } from "@/lib/testing"
import type { Job } from "@/lib/work"

type Section = "images" | "thermal" | "parameters" | "fps" | "pd"

/** The five sections in the order the ELPREMAR works through them */
const sections: { key: Section; title: string; icon: LucideIcon; phase2?: boolean }[] = [
  { key: "images", title: "Asset Images", icon: Camera },
  { key: "thermal", title: "Thermal Images", icon: Thermometer },
  { key: "parameters", title: "Parameters", icon: Gauge },
  { key: "fps", title: "Fire Prevention", icon: Flame },
  { key: "pd", title: "Partial Discharge", icon: Zap, phase2: true },
]

const levelPill = { Low: resultPill.Pass, Medium: resultPill.Attention, High: resultPill.Fail } as const

const yesNoTone = (v: "Yes" | "No") => (v === "Yes" ? "bg-healthy text-healthy-foreground ring-healthy" : "bg-attention text-attention-foreground ring-attention")

type Setter = (p: Partial<InspectionCapture>) => void

/**
 * Testing & Measurements for one inspection task, in the client's Phase-1
 * order: the asset images (angle views), the thermal images (one per point),
 * then the parameters (contamination, physical hygiene), then the fire
 * prevention system. Partial
 * Discharge is Phase 2 and stays disabled until the measuring device
 * integration arrives.
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
  const tabDone: Record<Section, boolean> = { images: done.images, thermal: done.thermal, parameters: done.contamination, fps: done.fps, pd: false }
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
      <nav aria-label="Testing sections" className="grid grid-cols-2 gap-2 rounded-2xl bg-card p-2 shadow-xs ring-1 ring-foreground/10 sm:grid-cols-3 lg:grid-cols-5">
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
            <ImagesSection category={category} capture={capture} evidence={evidence} onCapture={setCapture} onEvidence={setEvidence} onRemove={removeEvidence} />
          ) : section === "thermal" ? (
            <ThermalImagesSection category={category} capture={capture} evidence={evidence} set={set} onEvidence={setEvidence} onRemove={removeEvidence} />
          ) : section === "parameters" ? (
            <ContaminationSection capture={capture} set={set} />
          ) : (
            <FpsSection capture={capture} set={set} />
          )}

          <StepCard step={6} title="Inspection Remarks" icon={NotebookPen} done={!!remarks.trim()}>
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
                { label: "At least one asset image", done: done.images },
                { label: `${MIN_THERMAL_POINTS} or more thermal images`, done: done.thermal },
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

/* ---------- 1. Asset images ---------- */

/**
 * As many photographs as the asset needs, each named as it is added, the same
 * way asset onboarding takes them. The angle views for the asset type are the
 * suggestions; a name that matches one also fills that view.
 */
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
  const ids = new Set(Object.values(capture.angles))
  const items = evidence.filter((e) => ids.has(e.id)).map((e) => ({ id: e.id, name: e.label, fileName: e.caption, src: e.src }))

  const add = (named: { name: string; file: File }[]) => {
    const at = stampNow()
    const made: EvidenceItem[] = named.map(({ name, file }) => {
      const slot = slots.find((s) => s.label.toLowerCase() === name.toLowerCase())
      return { id: newId(), kind: "photo", label: name, caption: file.name, meta: at, src: urlFor(file), slot: slot?.key }
    })
    onEvidence((ev) => [...ev, ...made])
    // A named view fills its slot; anything else is kept under its own id
    onCapture((c) => ({ ...c, angles: { ...c.angles, ...Object.fromEntries(made.map((m) => [m.slot && !c.angles[m.slot] ? m.slot : m.id, m.id])) } }))
  }
  const remove = (id: string) => {
    onRemove(id)
    onCapture((c) => ({ ...c, angles: Object.fromEntries(Object.entries(c.angles).filter(([, v]) => v !== id)) }))
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
      <UploadSection icon={Camera} title="Asset Images" noun="photograph" items={items} suggestions={slots.map((s) => s.label)} onAdd={add} onRemove={remove} />
      <OfflineNote />
    </div>
  )
}

/* ---------- 2. Thermal images, one per point ---------- */

/**
 * Each thermal image is one measurement point, named as it is added. The
 * points usual for the asset type are the suggestions.
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
  const items = capture.thermal.map((t) => {
    const image = evidence.find((e) => e.slot === t.id)
    return { id: t.id, name: t.point, fileName: image?.caption, src: image?.src }
  })

  const add = (named: { name: string; file: File }[]) => {
    const at = stampNow()
    const points = named.map(({ name }) => ({ id: newId(), point: name, maxTemp: "" }))
    set({ thermal: [...capture.thermal, ...points] })
    onEvidence((ev) => [
      ...ev,
      ...named.map(({ name, file }, i) => ({ id: newId(), kind: "thermal" as const, label: `${name} (thermal)`, caption: file.name, meta: at, src: urlFor(file), slot: points[i].id })),
    ])
  }
  /** Removing the image removes its point */
  const remove = (pointId: string) => {
    const image = evidence.find((e) => e.slot === pointId)
    if (image) onRemove(image.id)
    set({ thermal: capture.thermal.filter((t) => t.id !== pointId) })
  }

  return (
    <div className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
      <p className="mb-3 text-sm text-muted-foreground">Add a thermal image for each joint or termination you scan, at least {MIN_THERMAL_POINTS}.</p>
      <UploadSection icon={Thermometer} title="Thermal Images" noun="thermal image" thermal items={items} suggestions={thermalPointsFor(category)} onAdd={add} onRemove={remove} />
      <OfflineNote thermal />
    </div>
  )
}

/* ---------- 3–4. Parameters: contamination & hygiene ---------- */

function ContaminationSection({ capture, set }: { capture: InspectionCapture; set: Setter }) {
  const level = contaminationLevel(capture.thickness, capture.dustTypes)
  const checked = hygieneChecks.filter((c) => capture.hygiene[c.key]).length
  return (
    <>
      <StepCard step={3} title="Contamination Assessment" icon={Wind} done={!!capture.thickness} actions={level ? <span className={cn("rounded-full px-3 py-1 text-sm font-bold", levelPill[level])}>{level}</span> : null}>
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

      <StepCard step={4} title="Physical Hygiene Checks" icon={Check} done={checked === hygieneChecks.length} actions={<CountPill done={checked === hygieneChecks.length}>{checked} / {hygieneChecks.length}</CountPill>}>
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

/* ---------- 5. Fire prevention ---------- */

function FpsSection({ capture, set }: { capture: InspectionCapture; set: Setter }) {
  const fps = capture.fps
  return (
    <StepCard step={5} title="Fire Prevention System" icon={Flame} done={fps.installed === "No" || (fps.installed === "Yes" && !!fps.status)}>
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
