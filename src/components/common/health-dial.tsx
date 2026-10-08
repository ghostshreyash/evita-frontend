import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { healthStatus } from "@/lib/status"

/**
 * A health score as a ring, in its band's own colour. Shared by the asset detail
 * screen and the report panel so one score never looks like two different things.
 */
export function HealthDial({
  score,
  label,
  tone,
  className,
}: {
  score: number
  label: string
  tone: "healthy" | "attention" | "critical"
  className?: string
}) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 100 100"
        className={cn("size-28", className)}
        role="img"
        aria-label={`Health score ${score} out of 100, ${label}`}
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-foreground/10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={healthStatus[tone].color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" className="fill-foreground text-2xl font-bold tabular-nums">
          {score}
        </text>
        <text x="50" y="66" textAnchor="middle" className="fill-muted-foreground text-xs">
          / 100
        </text>
      </svg>
      <Badge variant={healthStatus[tone].badge} className="mt-1 h-auto rounded px-2.5 py-1 text-sm">
        {label}
      </Badge>
    </div>
  )
}
