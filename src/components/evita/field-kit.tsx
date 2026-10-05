import { CircleCheck, CircleDashed, Thermometer, X } from "lucide-react"
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

/** A white card with a numbered heading, like the steps on the EVITA mockups */
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
      <header className="flex min-h-14 flex-wrap items-center gap-2.5 border-b px-4 py-2.5">
        {step !== undefined ? (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold", done ? "bg-healthy text-healthy-foreground" : "bg-primary/10 text-primary")}>
            {done ? <CircleCheck className="size-4" /> : step}
          </span>
        ) : null}
        <h3 className="flex flex-1 items-center gap-2 text-base font-semibold">
          <Icon className="size-5 text-primary" />
          {title}
        </h3>
        {actions}
      </header>
      <div className="p-4">{children}</div>
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
export function Checklist({ items }: { items: { label: string; done: boolean }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className={cn("flex items-start gap-2 text-sm", !i.done && "text-muted-foreground")}>
          {i.done ? <CircleCheck className="mt-0.5 size-4 shrink-0 text-healthy" /> : <CircleDashed className="mt-0.5 size-4 shrink-0" />}
          {i.label}
        </li>
      ))}
    </ul>
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
