import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, Check, Flame, Gauge, Lock, NotebookPen, Save, Send, Thermometer, Zap, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { UploadSection } from "@/components/evita/upload-section"
import { Checklist, CountPill, FieldLabel, HealthRing, Segmented, StepCard } from "@/components/evita/field-kit"
import type { EvidenceItem } from "@/data/evidence"
import { stampNow } from "@/data/persist"
import { completeInspection, saveInspectionDraft } from "@/data/inspection-store"
import type { InspectionCapture, InspectionDetail } from "@/data/inspection-detail"
import { healthScoreWeights } from "@/data/master-data"
import {
  angleSlotsFor,
  fpsStatuses,
  inspectionReadingsFor,
  MIN_THERMAL_POINTS,
  missingReadings,
  readingKeys,
  readingPhases,
  thermalPointsFor,
  type ReadingSpec,
} from "@/data/test-template"
import { categoryFor } from "@/lib/asset-category"
import { urlFor } from "@/lib/object-url"
import { emptyCapture, newId, observationsFrom, resultsFrom, scoreCapture, sectionsDone } from "@/lib/testing"
import type { Job } from "@/lib/work"

type Section = "images" | "thermal" | "technical" | "fps" | "pd"

/** The five sections in the order the ELPREMAR works through them */
const sections: { key: Section; title: string; icon: LucideIcon; phase2?: boolean }[] = [
  { key: "images", title: "Asset Images", icon: Camera },
  { key: "thermal", title: "Thermal Images", icon: Thermometer },
  { key: "technical", title: "Technical Details", icon: Gauge },
  { key: "fps", title: "Fire Prevention", icon: Flame },
  { key: "pd", title: "Partial Discharge", icon: Zap, phase2: true },
]


const yesNoTone = (v: "Yes" | "No") => (v === "Yes" ? "bg-healthy text-healthy-foreground ring-healthy" : "bg-attention text-attention-foreground ring-attention")

type Setter = (p: Partial<InspectionCapture>) => void

/**
 * The inspection task capture, in the client's Phase-1 order: the asset images
 * (angle views), the thermal images (one per point), the electrical readings
 * the asset type calls for, then the fire prevention system. Partial Discharge
 * is Phase 2 and stays disabled until the measuring device integration arrives.
 *
 * The one free-text note sits with the Technical Details readings rather than
 * under every section: it is there to explain a reading, not to stand in for
 * one.
 *
 * Contamination and physical hygiene are not recorded by hand. The Tier I logic
 * document has the AI engine read panel hygiene off the uploaded images after
 * sync, so asking the ELPREMAR for the same judgement would only compete with
 * it. Both still reach the reports - from the AI, not from this form.
 *
 * Everything saves to the tablet as it is entered (the offline draft); Submit
 * locks the record, scores it and queues it for sync.
 */
export function InspectionForm({ job, detail }: { job: Job; detail: InspectionDetail }) {
  const category = categoryFor(job.asset)
  const [section, setSection] = useState<Section>("images")
  const [capture, setCapture] = useState<InspectionCapture>(() => detail.capture ?? emptyCapture())
  const [evidence, setEvidence] = useState<EvidenceItem[]>(detail.evidence)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  // Held from when the form opened: saving writes a new record, which must not re-trigger the save
  const [remarks, setRemarks] = useState(detail.execution?.remarks ?? "")
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

  const readings = inspectionReadingsFor(category)
  const done = sectionsDone(capture, category, ids)
  const tabDone: Record<Section, boolean> = { images: done.images, thermal: done.thermal, technical: done.readings, fps: done.fps, pd: false }
  const preview = scoreCapture(capture)
  const ready = done.images && done.thermal && done.readings && done.fps
  const set: Setter = (p) => setCapture((c) => ({ ...c, ...p }))
  const removeEvidence = (id: string) => setEvidence((ev) => ev.filter((e) => e.id !== id))

  const submit = () => {
    const result = scoreCapture(capture)
    completeInspection(job.id, { ...patch, result })
    toast.success("Inspection submitted", {
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
          ) : section === "technical" ? (
            <>
              <ReadingsSection category={category} capture={capture} set={set} />
              {/* The one free-text note on the inspection, kept with the readings it explains */}
              <StepCard step={4} title="Inspection Remarks" icon={NotebookPen} done={!!remarks.trim()}>
                <Textarea
                  value={remarks}
                  rows={3}
                  maxLength={500}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Anything the readings do not say on their own."
                />
              </StepCard>
            </>
          ) : (
            <FpsSection capture={capture} set={set} />
          )}
        </div>

        {/* ---------- Score estimate and submit ---------- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="space-y-4 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
            <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Inspection Health Summary</h3>
            <div className="rounded-xl bg-muted/50 p-3">
              {/* Contamination and hygiene are read off the images by AI after sync, so the
                  field estimate stands on the thermal scan and the fire prevention system */}
              <HealthRing score={preview.healthScore} caption="Estimate · updates as you record" />
            </div>
            <p className="rounded-lg bg-info-soft/50 px-3 py-2 text-xs text-muted-foreground">
              Contamination and physical hygiene are scored by AI from the images after sync. The estimate here covers
              what you record on site.
            </p>
            <ScoreBreakdown breakdown={preview.breakdown} />
            <Checklist
              items={[
                { label: "At least one asset image", done: done.images },
                { label: `${MIN_THERMAL_POINTS} or more thermal images`, done: done.thermal },
                {
                  label: readings.length ? "Electrical readings recorded" : "Electrical readings not applicable",
                  done: done.readings,
                },
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
      {/* Every point is judged on its rise over ambient, so the reading is taken once for the whole scan */}
      <label className="mb-4 flex max-w-xs items-center gap-3">
        <span className="shrink-0 text-sm font-medium">Ambient temperature (°C)</span>
        <Input
          value={capture.ambient}
          inputMode="decimal"
          onChange={(e) => set({ ambient: e.target.value })}
          className="h-12 bg-card text-base tabular-nums"
          placeholder="32"
        />
      </label>
      <UploadSection icon={Thermometer} title="Thermal Images" noun="thermal image" thermal items={items} suggestions={thermalPointsFor(category)} onAdd={add} onRemove={remove} />
      <OfflineNote thermal />
    </div>
  )
}

/**
 * The electrical readings for this asset type.
 *
 * Which readings apply, and which of them are mandatory, come from the client's
 * inspection parameter sheet: a Network Switch is read for voltage alone, a
 * transformer for voltage, per-phase load current, frequency and neutral
 * current. Nothing not applicable to the type is asked for, so the ELPREMAR is
 * never shown a box there is no meter reading for.
 */
function ReadingsSection({ category, capture, set }: { category: string; capture: InspectionCapture; set: Setter }) {
  const specs = inspectionReadingsFor(category)
  const missing = missingReadings(category, capture.readings)
  const write = (key: string, value: string) => set({ readings: { ...capture.readings, [key]: value } })

  return (
    <StepCard
      step={3}
      title="Electrical Readings"
      icon={Gauge}
      done={missing.length === 0}
      actions={
        specs.length ? (
          <CountPill done={missing.length === 0}>
            {specs.length - missing.length} / {specs.length}
          </CountPill>
        ) : null
      }
    >
{specs.length === 0 ? (
        <p className="rounded-xl bg-info-soft p-3 text-sm text-info-soft-foreground">
          A {category} is inspected without electrical readings: they cannot be measured reliably with the asset
          energised, and the instruments for them are not held. Images, the thermal scan and the fire prevention system
          are the whole inspection — carry on to the next section.
        </p>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            The readings a {category} is inspected for. Take them at the asset, under load where the asset is live.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {specs.map((spec) => (
              <Reading key={spec.key} spec={spec} readings={capture.readings} onChange={write} />
            ))}
          </div>
        </>
      )}
    </StepCard>
  )
}

/** One reading: a single box, or three side by side when it is taken per phase */
function Reading({
  spec,
  readings,
  onChange,
}: {
  spec: ReadingSpec
  readings: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <div className={cn(spec.phases && "sm:col-span-2")}>
      <FieldLabel required={spec.required}>
        {spec.label} <span className="font-normal text-muted-foreground">({spec.unit})</span>
      </FieldLabel>
      <div className={cn("gap-2", spec.phases ? "grid grid-cols-3" : "flex")}>
        {readingKeys(spec).map((key, i) => (
          <label key={key} className="flex min-w-0 flex-1 items-center gap-2">
            {spec.phases ? (
              <span className="w-5 shrink-0 text-center text-sm font-semibold text-muted-foreground">{readingPhases[i]}</span>
            ) : null}
            <span className="sr-only">
              {spec.label}
              {spec.phases ? ` ${readingPhases[i]} phase` : ""} in {spec.unit}
            </span>
            <Input
              value={readings[key] ?? ""}
              inputMode="decimal"
              onChange={(e) => onChange(key, e.target.value)}
              className="h-12 min-w-0 bg-card text-base tabular-nums"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

/* ---------- 6. Fire prevention ---------- */

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
