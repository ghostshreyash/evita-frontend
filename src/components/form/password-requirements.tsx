import { CheckCircle2, Circle } from "lucide-react"
import { cn } from "cn"

import { passwordRules } from "@/lib/validation"

/**
 * Live checklist + strength bar shown next to password fields.
 *
 * `tone="dark"` is for the navy auth screens; the default keeps the light
 * styling used by the onboarding wizards unchanged.
 */
export function PasswordRequirements({ value, tone = "light" }: { value: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark"
  return (
    <div className={cn("rounded-lg p-3 text-xs", dark ? "border border-brand-gold/25 bg-white/5" : "bg-muted/60")}>
      <div className={cn("mb-2 font-semibold", dark && "text-brand-navy-foreground")}>Password Requirements</div>
      <ul className="space-y-1.5">
        {passwordRules.map((r) => {
          const ok = r.test(value)
          return (
            <li
              key={r.label}
              className={cn(
                "flex items-center gap-2",
                dark
                  ? ok
                    ? "text-brand-navy-foreground"
                    : "text-brand-navy-foreground/60"
                  : ok
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
            >
              {ok ? <CheckCircle2 className="size-4 shrink-0 text-healthy" /> : <Circle className="size-4 shrink-0" />}
              {r.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function PasswordStrength({ value, tone = "light" }: { value: string; tone?: "light" | "dark" }) {
  const passed = passwordRules.filter((r) => r.test(value)).length
  const levels = ["", "Weak", "Fair", "Good", "Strong"]
  const color = passed <= 1 ? "bg-critical" : passed === 2 ? "bg-attention" : passed === 3 ? "bg-info" : "bg-healthy"
  if (!value) return null
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-1.5 flex-1 overflow-hidden rounded-full", tone === "dark" ? "bg-white/10" : "bg-muted")}>
        <div className={cn("h-full transition-all", color)} style={{ width: `${(passed / 4) * 100}%` }} />
      </div>
      <span
        className={cn(
          "text-xs font-medium",
          tone === "dark" ? "text-brand-navy-foreground/80" : "text-muted-foreground"
        )}
      >
        {levels[passed]}
      </span>
    </div>
  )
}
