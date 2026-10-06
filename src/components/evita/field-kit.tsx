import { CircleCheck, Thermometer, X } from "lucide-react"
import { cn } from "cn"

import { CheckList } from "@/components/common/detail-list"
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
 * One section of a task form, drawn like the asset screens' panels: an icon,
 * a navy heading with its step number, and a small tick once it is filled in.
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
    <section className={cn("rounded-lg bg-card shadow-xs ring-1 ring-foreground/10", className)}>
      <header className="flex min-h-11 flex-wrap items-center gap-2 px-3 pt-2.5 pb-1.5">
        <h3 className="flex flex-1 items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
          <Icon className="size-5 shrink-0 text-primary" />
          {step !== undefined ? <span className="tabular-nums">{step}.</span> : null}
          {title}
          {done ? <CircleCheck className="size-4 text-healthy" aria-label="Done" /> : null}
        </h3>
        {actions}
      </header>
      <div className="px-3 pb-3">{children}</div>
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
        <figure key={e.id} className="relative w-40 shrink-0 overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
          <div className={cn("flex h-28 items-center justify-center", !e.src && (e.kind === "thermal" ? "bg-linear-to-br from-info via-attention to-critical" : "bg-linear-to-br from-muted to-info-soft"))}>
            {e.src ? <img src={e.src} alt={e.label} className="size-full object-cover" /> : <Thermometer className="size-7 text-white/80" />}
          </div>
          <figcaption className="px-2 py-1.5">
            <div className="truncate text-xs font-medium">{e.label}</div>
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

/** Submission checklist: every line must be ticked before the task can be submitted */
export function Checklist({ items, title = "Submission Checklist" }: { items: { label: string; done: boolean }[]; title?: string }) {
  return <CheckList title={title} items={items} />
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
