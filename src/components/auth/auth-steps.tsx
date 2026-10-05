import { Check } from "lucide-react"
import { cn } from "cn"

/** Compact step indicator for the multi-step auth flows. */
export function AuthSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-1.5">
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[0.7rem] font-semibold transition-all duration-300",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/10 text-primary ring-2 ring-primary",
                !done && !active && "bg-current/10 text-current opacity-70"
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs whitespace-nowrap transition-colors",
                active ? "font-semibold text-current" : "text-current opacity-60"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 ? (
              <span
                className={cn("mx-0.5 h-px w-3 transition-colors sm:w-5", done ? "bg-primary" : "bg-border")}
              />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
