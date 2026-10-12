import { cn } from "cn"

/**
 * The one-row chooser the field screens filter and switch views with.
 *
 * Two looks for the same control, because the tablet design uses both: filled
 * pills where the row narrows a list (the asset categories, the task statuses)
 * and an underline where it switches between views of the same thing (a
 * report's tabs, an asset's record). Either way the row scrolls sideways rather
 * than wrapping, so the list below it never jumps down a line as the counts
 * change.
 */
export type ChipTab = { value: string; label: string; count?: number }

export function ChipTabs({
  tabs,
  value,
  onChange,
  variant = "pill",
  label,
  className,
}: {
  tabs: readonly ChipTab[]
  value: string
  onChange: (value: string) => void
  variant?: "pill" | "underline"
  /** What the row chooses between, for a screen reader */
  label: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0",
        variant === "underline" && "gap-0 border-b",
        className
      )}
    >
      {tabs.map((tab) => {
        const on = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
              variant === "pill"
                ? on
                  ? "rounded-full bg-primary px-4 text-primary-foreground shadow-sm shadow-primary/30"
                  : "rounded-full bg-card px-4 text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
                : on
                  ? "-mb-px border-b-2 border-primary px-4 text-primary"
                  : "-mb-px border-b-2 border-transparent px-4 text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  variant === "pill"
                    ? on
                      ? "bg-white/20"
                      : "bg-muted"
                    : on
                      ? "bg-info-soft text-primary"
                      : "bg-muted"
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
