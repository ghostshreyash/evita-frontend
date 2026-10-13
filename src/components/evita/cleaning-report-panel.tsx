import { useMemo } from "react"
import { ArrowRight, Printer, SprayCan } from "lucide-react"
import { cn } from "cn"

import { TaskPanel } from "@/components/evita/field-kit"
import { Button } from "@/components/ui/button"
import { useAssetRows } from "@/data/asset-store"
import type { MaintenanceDetail } from "@/data/maintenance-detail"
import { cleaningComparison, cleaningReport, type CleaningSide } from "@/lib/cleaning-report"
import { printReport } from "@/lib/inspection-report"
import type { Job } from "@/lib/work"

const toneText = {
  healthy: "text-healthy",
  attention: "text-attention",
  critical: "text-critical",
} as const

const toneTint = {
  healthy: "bg-healthy-soft ring-healthy/30",
  attention: "bg-attention-soft ring-attention/30",
  critical: "bg-critical-soft ring-critical/30",
} as const

/**
 * What the clean changed, as the customer is shown it.
 *
 * The client's sheet draws this as two columns - the panel as found against the
 * panel after INSTA CLEAN, the same parameters read down both. The column it
 * sits in is narrow, so here the two sides stack and each parameter carries its
 * before and its after on one line; printed, it goes out as the two-column
 * sheet through the same window the inspection reports use.
 *
 * Only on finished work: there is nothing to compare until the job is done.
 */
export function CleaningReportPanel({ job, detail }: { job: Job; detail: MaintenanceDetail }) {
  const register = useAssetRows()

  const comparison = useMemo(() => {
    const asset = register.find((a) => a.id === detail.assetTag || a.name === job.asset)
    return cleaningComparison(job.id, detail, { health: asset?.health })
  }, [job.id, job.asset, detail, register])

  const header = {
    asset: job.asset,
    assetId: detail.assetTag,
    plant: `${job.plant}, ${job.enterprise}`,
    when: detail.execution?.endedAt ?? detail.execution?.startedAt ?? job.date,
  }

  return (
    <TaskPanel icon={SprayCan} title="Cleaning Report">
      <p className="text-sm text-muted-foreground">
        The panel as it was found, against the panel after the clean
        {comparison.product ? ` with ${comparison.product}` : ""}.
      </p>

      {/* The two scores, and the distance between them */}
      <div className="mt-3 flex items-stretch gap-2">
        <Score side={comparison.before} label="Before" />
        <span className="flex shrink-0 items-center text-muted-foreground">
          <ArrowRight className="size-5" />
        </span>
        <Score side={comparison.after} label="After" />
      </div>

      {/* Each parameter on one line, found on the left and left-behind on the right */}
      <dl className="mt-4 divide-y border-t">
        {comparison.rows.map((row) => (
          <div key={row.label} className="py-2">
            <dt className="text-sm font-semibold">{row.label}</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
              <span className="text-critical line-through decoration-critical/40">{row.before}</span>
              <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="font-semibold text-healthy">{row.after}</span>
            </dd>
            <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>
          </div>
        ))}
      </dl>

      <h4 className="mt-4 text-xs font-bold tracking-wide text-muted-foreground uppercase">After cleaning</h4>
      <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
        {comparison.benefits.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <Button
        variant="outline"
        className="mt-4 h-12 w-full bg-card"
        onClick={() => printReport(cleaningReport(comparison), header)}
      >
        <Printer /> Save as PDF
      </Button>
    </TaskPanel>
  )
}

/** One side of the comparison: the score, its band and what that means */
function Score({ side, label }: { side: CleaningSide; label: string }) {
  return (
    <div className={cn("flex-1 rounded-xl p-3 text-center ring-1", toneTint[side.tone])}>
      <div className="text-xs font-bold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className={cn("mt-1 text-3xl leading-none font-black tabular-nums", toneText[side.tone])}>{side.score}</div>
      <div className="text-xs text-muted-foreground">/ 100</div>
      <div className={cn("mt-1 text-sm font-semibold", toneText[side.tone])}>{side.band}</div>
    </div>
  )
}
