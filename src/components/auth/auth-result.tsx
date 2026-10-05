import { CheckCircle2, Clock, type LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * Closing panel for the auth flows: password updated, access request submitted,
 * recovery ticket raised. One component so all three read alike.
 */
export function AuthResult({
  tone = "success",
  icon,
  title,
  description,
  reference,
  referenceLabel = "Reference number",
  notes,
  children,
}: {
  tone?: "success" | "pending"
  icon?: LucideIcon
  title: string
  description: string
  reference?: string
  referenceLabel?: string
  notes?: string[]
  children?: React.ReactNode
}) {
  const Icon = icon ?? (tone === "success" ? CheckCircle2 : Clock)
  return (
    <div className="text-center">
      <span className="relative mx-auto mb-4 flex size-16 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 rounded-full animate-pulse-ring",
            tone === "success" ? "bg-healthy/25" : "bg-brand-gold/25"
          )}
        />
        <span
          className={cn(
            "relative flex size-14 items-center justify-center rounded-full animate-in zoom-in duration-500",
            tone === "success" ? "bg-healthy/15 text-healthy" : "bg-brand-gold/15 text-brand-gold"
          )}
        >
          <Icon className="size-7" />
        </span>
      </span>

      <h2 className="text-lg font-bold text-current">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-current opacity-70">{description}</p>

      {reference ? (
        <div className="mt-4 rounded-xl border border-brand-gold/40 bg-brand-gold-soft px-4 py-3">
          <div className="text-xs tracking-wider text-current uppercase opacity-70">{referenceLabel}</div>
          <div className="font-mono text-lg font-bold tracking-wide text-brand-gold-soft-foreground">{reference}</div>
        </div>
      ) : null}

      {notes?.length ? (
        <ul className="mt-4 space-y-2 text-left text-sm text-current opacity-80">
          {notes.map((note) => (
            <li key={note} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-healthy" />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {children ? <div className="mt-6 space-y-2">{children}</div> : null}
    </div>
  )
}
