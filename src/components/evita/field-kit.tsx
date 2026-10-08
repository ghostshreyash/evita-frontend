import { Check, CircleCheck, CircleDashed, Thermometer, X } from "lucide-react"
import { cn } from "cn"

import type { EvidenceItem } from "@/data/evidence"
import { bandLook } from "@/lib/health"

/**
 * Small pieces the task screens share, sized for a finger rather than a mouse.
 */

/** A row of large toggle buttons for a short list of choices (Yes/No, Pass/Fail…) */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  tone,
  className,
  label,
}: {
  value?: T
  options: readonly T[]
  onChange: (v: T) => void
  /** Colour for the selected option, e.g. Fail in red */
  tone?: (v: T) => string | undefined
  className?: string
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap gap-1.5", className)}>
      {options.map((o) => {
        const on = o === value
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={cn(
              "h-11 min-w-16 rounded-md px-3.5 text-sm font-medium ring-1 transition-colors",
              on ? (tone?.(o) ?? "bg-primary text-primary-foreground ring-primary") : "bg-card ring-foreground/15 hover:bg-muted"
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

/** Field label in the same weight as the form fields */
export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-1.5 text-sm font-medium">
      {children}
      {required ? <span className="ml-0.5 text-critical">*</span> : null}
    </div>
  )
}

/**
 * One section of a task form, as the EVITA tablet design draws it: a green
 * tick disc once the section is complete (the section's icon until then), a
 * numbered title, and a slot on the right for a count pill or an action.
 */
export function StepCard({
  step,
  title,
  icon: Icon,
  done,
  actions,
  children,
  className,
}: {
  step?: number
  title: string
  icon: React.ComponentType<{ className?: string }>
  done?: boolean
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10", className)}>
      <header className="flex min-h-16 flex-wrap items-center gap-3 border-b px-5 py-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", done ? "bg-healthy-soft text-healthy" : "bg-info-soft text-primary")}>
          {done ? <Check className="size-5" strokeWidth={3} aria-label="Done" /> : <Icon className="size-5" />}
        </span>
        <h3 className="flex-1 text-lg font-semibold text-brand-navy dark:text-foreground">
          {step !== undefined ? <span className="tabular-nums">{step}. </span> : null}
          {title}
        </h3>
        {actions}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

/** Small rounded count shown at the right of a section header, e.g. "5 / 6 Captured" */
export function CountPill({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <span className={cn("rounded-full px-3 py-1 text-sm font-semibold ring-1", done ? "bg-healthy-soft text-healthy-soft-foreground ring-healthy/25" : "bg-info-soft text-info-soft-foreground ring-info/20")}>
      {children}
    </span>
  )
}

/** White panel with a navy icon tile and title, as the task screen's panels are drawn */
export function TaskPanel({
  icon: Icon,
  title,
  action,
  className,
  contentClassName,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10", className)}>
      <header className="flex min-h-16 items-center gap-3 border-b px-5 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-brand-navy-foreground">
          <Icon className="size-5" />
        </span>
        <h3 className="flex-1 text-lg font-semibold text-brand-navy dark:text-foreground">{title}</h3>
        {action}
      </header>
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  )
}

/** Captured photos and thermal images, each removable while the task is open */
export function EvidenceStrip({
  items,
  onRemove,
  children,
}: {
  items: EvidenceItem[]
  onRemove?: (id: string) => void
  /** Capture tiles at the end of the strip */
  children?: React.ReactNode
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {items.map((e) => (
        <figure key={e.id} className="relative w-44 shrink-0 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className={cn("flex h-32 items-center justify-center", !e.src && (e.kind === "thermal" ? "bg-linear-to-br from-info via-attention to-critical" : "bg-linear-to-br from-muted to-info-soft"))}>
            {e.src ? <img src={e.src} alt={e.label} className="size-full object-cover" /> : <Thermometer className="size-7 text-white/80" />}
          </div>
          <figcaption className="px-2.5 py-2">
            <div className="truncate text-sm font-semibold">{e.label}</div>
            <div className="truncate text-xs text-muted-foreground tabular-nums">{e.meta}</div>
          </figcaption>
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${e.label}`}
              onClick={() => onRemove(e.id)}
              className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </figure>
      ))}
      {children}
    </div>
  )
}

/** Submission checklist: one tinted row per requirement — green when met, amber while outstanding */
export function Checklist({ items, title = "Submission Checklist" }: { items: { label: string; done: boolean }[]; title?: string }) {
  return (
    <div>
      <h4 className="mb-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">{title}</h4>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={i.label}
            className={cn(
              "flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2 text-sm ring-1",
              i.done ? "bg-healthy-soft/50 ring-healthy/25" : "bg-attention-soft/50 ring-attention/30"
            )}
          >
            {i.done ? <CircleCheck className="size-4 shrink-0 text-healthy" /> : <CircleDashed className="size-4 shrink-0 text-attention" />}
            <span className="min-w-0 flex-1">{i.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Health score ring with its band, as on the EVITA asset screens */
export function HealthRing({ score, size = 112, caption }: { score: number; size?: number; caption?: string }) {
  const look = bandLook(score)
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="10" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={look.stroke} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl leading-none font-bold tabular-nums">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <span className={cn("rounded-full px-3 py-1 text-sm font-semibold", look.soft)}>{look.label}</span>
      {caption ? <span className="text-xs text-muted-foreground">{caption}</span> : null}
    </div>
  )
}
