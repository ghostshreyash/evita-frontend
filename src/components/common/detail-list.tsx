import { CircleDashed, type LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * The `Label : Value` blocks the asset screens are made of.
 *
 * The mockups render every read-only panel the same way — an icon, a blue title
 * and a colon-aligned list — so the review step, the Asset ID screen and the
 * asset detail screen all draw from here rather than each laying out its own.
 */

export type DetailRow = {
  label: string
  value?: React.ReactNode
  /** Smaller note under the label, e.g. "(Primary/Secondary)" */
  note?: string
  /** Keep the row even when it has no value, showing a dash */
  always?: boolean
}

/**
 * Colon-aligned label/value list. Empty rows drop out unless marked `always`.
 *
 * The label column is sized to the longest label rather than to a fixed width:
 * a fixed 10rem left almost nothing for the value inside a narrow panel, and
 * values broke one character per line.
 */
export function DetailList({ rows, className }: { rows: DetailRow[]; className?: string }) {
  const shown = rows.filter((r) => r.always || (r.value !== undefined && r.value !== null && r.value !== ""))

  if (!shown.length) {
    return (
      <p className="flex items-center gap-1.5 py-1 text-sm text-muted-foreground">
        <CircleDashed className="size-4" />
        Nothing entered — this section is optional.
      </p>
    )
  }

  return (
    <dl className={cn("space-y-1.5 text-sm", className)}>
      {shown.map((r) => (
        <div key={r.label} className="grid grid-cols-[max-content_0.5rem_minmax(0,1fr)] items-baseline gap-x-1">
          <dt className="text-muted-foreground">
            {r.label}
            {r.note ? <span className="block text-xs leading-tight">{r.note}</span> : null}
          </dt>
          <span aria-hidden="true" className="text-muted-foreground">
            :
          </span>
          <dd className="min-w-0 font-medium break-words">{r.value === "" || r.value == null ? "—" : r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * White panel with an icon and a blue heading, as every read-only block in the
 * mockups is drawn. `action` takes the Edit button the review step puts there.
 */
export function DetailPanel({
  icon: Icon,
  title,
  action,
  className,
  contentClassName,
  children,
}: {
  icon?: LucideIcon
  title: React.ReactNode
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("flex flex-col rounded-lg bg-card shadow-xs ring-1 ring-foreground/10", className)}>
      <header className="flex min-h-11 items-center justify-between gap-2 px-3 pt-2.5 pb-1.5">
        <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
          {Icon ? <Icon className="size-5 shrink-0 text-primary" /> : null}
          <span className="truncate">{title}</span>
        </h3>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("flex-1 px-3 pb-3", contentClassName)}>{children}</div>
    </section>
  )
}

/**
 * The green tick-list the mockups use for the submission checklist and the
 * image/document checklist. An unmet item stays grey rather than turning red —
 * it is a progress list, not an error summary.
 */
export function CheckList({
  title,
  items,
  className,
}: {
  title: React.ReactNode
  items: { label: React.ReactNode; done: boolean }[]
  className?: string
}) {
  const complete = items.every((i) => i.done)
  return (
    <div className={cn("rounded-lg p-3 ring-1", complete ? "bg-healthy-soft ring-healthy/20" : "bg-muted/50 ring-foreground/10", className)}>
      <h4 className="mb-2 flex items-center gap-2 text-base font-semibold">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            complete ? "bg-healthy text-healthy-foreground" : "bg-neutral text-neutral-foreground"
          )}
        >
          {items.filter((i) => i.done).length}
        </span>
        {title}
      </h4>
      <ul className="space-y-1.5 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Tick done={item.done} />
            <span className={cn("min-w-0 flex-1", !item.done && "text-muted-foreground")}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tick({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
        done ? "bg-healthy text-healthy-foreground" : "bg-foreground/15"
      )}
    >
      {done ? (
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 6.5 4.6 9 10 3.2" />
        </svg>
      ) : null}
    </span>
  )
}
