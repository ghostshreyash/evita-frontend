import { Link } from "react-router"
import { ArrowRight, Clock } from "lucide-react"
import { cn } from "cn"

/**
 * White panel with a title row and optional "View All →" link, as used throughout the mockups.
 *
 * `disabled` renders the panel as unavailable: a translucent overlay carrying an
 * "Available in Phase 2" note. The content underneath keeps its real colours and just stops
 * responding to pointer input, so the layout still reads as the finished panel will.
 */
export function SectionCard({
  title,
  icon,
  viewAllTo,
  actions,
  disabled = false,
  disabledNote = "Available in Phase 2",
  hoverable = true,
  className,
  contentClassName,
  children,
}: {
  title: React.ReactNode
  icon?: React.ReactNode
  viewAllTo?: string
  actions?: React.ReactNode
  disabled?: boolean
  /** Text shown on the overlay that covers a disabled panel */
  disabledNote?: string
  /** Set false for large table panels, where a lift on hover is distracting */
  hoverable?: boolean
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-disabled={disabled || undefined}
      className={cn(
        "group/card flex flex-col rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10",
        "transition-[transform,box-shadow,--tw-ring-color] duration-200 ease-out",
        // Live panels lift on hover; disabled ones stay put so they read as inert
        disabled
          ? "ring-foreground/5"
          : hoverable && "hover:shadow-md hover:ring-foreground/20 motion-safe:hover:-translate-y-0.5",
        className
      )}
    >
      <header className="flex min-h-12 items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h3 className={cn("flex min-w-0 items-center gap-1.5 text-base font-semibold", disabled && "text-muted-foreground")}>
          {icon}
          <span className="truncate">{title}</span>
        </h3>
        {disabled ? null : (
          <div className="flex shrink-0 items-center gap-1.5">
            {actions}
            {viewAllTo ? (
              <Link
                to={viewAllTo}
                className="group/link -my-2 flex min-h-11 items-center gap-1 px-1 text-sm font-medium whitespace-nowrap text-primary hover:underline"
              >
                View All
                <ArrowRight className="size-4 transition-transform duration-200 ease-out motion-safe:group-hover/link:translate-x-0.5 motion-safe:group-hover/card:translate-x-0.5" />
              </Link>
            ) : null}
          </div>
        )}
      </header>
      <div className="relative flex flex-1 flex-col">
        <div
          className={cn("flex-1 px-4 pb-4", disabled && "pointer-events-none select-none", contentClassName)}
          inert={disabled || undefined}
        >
          {children}
        </div>
        {disabled ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-b-lg bg-background/55 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm ring-1 ring-foreground/10">
              <Clock className="size-3.5 text-muted-foreground" />
              {disabledNote}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
