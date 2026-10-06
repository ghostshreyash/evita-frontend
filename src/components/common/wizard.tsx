import { Check, Lightbulb } from "lucide-react"
import { cn } from "cn"

/**
 * The horizontal step indicator across the top of an onboarding flow, and the
 * tip box beside it.
 *
 * Ported from occ-frontend `src/components/common/wizard.tsx`, trimmed to the
 * pieces the EVITA mockups actually show — there is no vertical progress panel
 * here — and resized for the tablets.
 */

export type WizardStep = { title: string; description?: string }

const stateOf = (i: number, current: number) => (i < current ? "done" : i === current ? "current" : "upcoming")

function StepCircle({ index, state }: { index: number; state: "done" | "current" | "upcoming" }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        state === "done" && "bg-healthy text-healthy-foreground",
        state === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/15",
        state === "upcoming" && "bg-neutral text-neutral-foreground"
      )}
    >
      {state === "done" ? <Check className="size-4" strokeWidth={3} /> : index + 1}
    </span>
  )
}

/**
 * Completed steps are tappable so an earlier answer can be changed; upcoming
 * steps are not, because their data has not been entered yet.
 */
export function StepperBar({
  steps,
  current,
  furthest,
  onSelect,
}: {
  steps: WizardStep[]
  current: number
  /** Highest step reached, so completed steps stay reachable in both directions */
  furthest?: number
  onSelect?: (i: number) => void
}) {
  const reachable = furthest ?? current
  return (
    <ol className="mb-4 flex items-center gap-2 overflow-x-auto rounded-lg bg-card px-3 py-2.5 shadow-xs ring-1 ring-foreground/10">
      {steps.map((step, i) => {
        const state = stateOf(i, current)
        const clickable = onSelect !== undefined && i !== current && i <= reachable
        const Item = clickable ? "button" : "div"
        return (
          <li key={step.title} className="flex min-w-fit flex-1 items-center gap-2 last:flex-none">
            <Item
              {...(clickable ? { type: "button" as const, onClick: () => onSelect(i), title: `Go back to ${step.title}` } : {})}
              className={cn(
                "group flex min-h-11 items-center gap-2 rounded px-1 transition-colors",
                clickable && "cursor-pointer hover:bg-muted"
              )}
            >
              <StepCircle index={i} state={state} />
              <span
                className={cn(
                  "text-sm whitespace-nowrap",
                  state === "current" ? "font-semibold text-primary" : "text-foreground",
                  clickable && "group-hover:text-primary"
                )}
              >
                <span className="tabular-nums">{i + 1}.</span> {step.title}
              </span>
            </Item>
            {i < steps.length - 1 ? (
              <span className={cn("mx-1 h-px min-w-4 flex-1", i < current ? "bg-healthy" : "bg-border")} />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

/** White card holding one step of a wizard. The footer is shared by every step,
 * so it lives on the wizard page rather than in here. */
export function StepCard({
  title,
  description,
  className,
  children,
}: {
  title: string
  description?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10", className)}>
      <h3 className="text-lg font-bold text-brand-navy dark:text-foreground">{title}</h3>
      {description ? <p className="mt-0.5 mb-3 text-sm text-muted-foreground">{description}</p> : <div className="mb-3" />}
      {children}
    </section>
  )
}

/** The green tips box the mockups put beside the form */
export function TipBox({ title = "Tip", items }: { title?: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-healthy-soft p-3 ring-1 ring-healthy/20">
      <h4 className="mb-1.5 flex items-center gap-2 text-base font-semibold">
        <Lightbulb className="size-5 text-healthy" /> {title}
      </h4>
      <ul className="ml-4 list-disc space-y-1 text-sm text-foreground/80">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
