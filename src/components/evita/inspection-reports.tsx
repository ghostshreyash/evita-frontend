import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Download, FileText, Printer, Sparkles, SprayCan } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { TaskPanel } from "@/components/evita/field-kit"
import { Button } from "@/components/ui/button"
import { recommendInsta } from "@/data/insta"
import { useAssetRows } from "@/data/asset-store"
import { profileOf } from "@/data/asset-store"
import { markReportGenerated } from "@/data/inspection-store"
import { addMaintenanceFromInspection } from "@/data/maintenance-store"
import type { InspectionDetail } from "@/data/inspection-detail"
import { contaminationReport, hygieneReport, printReport, type InspectionReport } from "@/lib/inspection-report"
import { categoryFor, type Job } from "@/lib/work"

const toneClass = {
  healthy: "text-healthy",
  attention: "text-attention",
  critical: "text-critical",
} as const

/**
 * The two reports a finished inspection produces, and what to do about them.
 *
 * The client asked for a Generate Report button that gives a Contamination
 * report and a Hygiene report, each downloadable (12-10-2026). Download here
 * means the browser's print dialogue, which is where a PDF comes from on a
 * tablet — the report is built from the record rather than mocked up.
 *
 * The contamination report's recommendation names an INSTA product, and the
 * cleaning it recommends can be raised straight from here. The client was
 * clear that this happens on site: "wahin ke wahin task banna chahiye, aur wo
 * log ho jana chahiye ki is inspection se generate hua tha."
 */
export function InspectionReports({ job, detail }: { job: Job; detail: InspectionDetail }) {
  const navigate = useNavigate()
  const register = useAssetRows()
  /*
   * Whether the reports have been produced is on the record, not in local
   * state: until they are, the work reads as Report Due on the lists, and a
   * reload must not quietly turn that back into Completed.
   */
  const generated = !!detail.reportedAt
  const [raised, setRaised] = useState<string>()

  /*
   * The asset's registered category, not a guess at it from the job's asset
   * name: which readings the sheet asks for depends on the type, so an
   * inspection started at a scanned asset must ask for that asset's own
   * parameters. `categoryFor` is the fallback for an older seeded row that
   * carries no category of its own.
   */
  const category = detail.assetCategory || categoryFor(job.asset)

  /*
   * The ratings to compare the readings against, off the asset register.
   * TODO: a task carries no asset id yet, so the register is matched on plant
   * and category — see `inspectionFor` in lib/work for the same limitation.
   */
  const rated = useMemo(() => {
    const asset = register.find((a) => a.plant === job.plant && a.category === category)
    return (asset && profileOf(asset)?.parameters) || []
  }, [register, job.plant, category])

  const reports = useMemo(() => {
    if (!detail.capture) return []
    return [
      contaminationReport(detail.capture, category, rated, detail.result?.healthScore),
      hygieneReport(detail.capture),
    ]
  }, [detail.capture, detail.result, category, rated])

  const advice = recommendInsta(detail.capture)

  if (!detail.capture) return null

  const header = {
    asset: job.asset,
    assetId: detail.assetTag,
    plant: `${job.plant}, ${job.enterprise}`,
    when: detail.execution?.completedAt ?? detail.execution?.startedAt ?? job.date,
  }

  const raiseCleaning = () => {
    const id = addMaintenanceFromInspection({
      inspectionId: job.id,
      activity: job.activity,
      enterprise: job.enterprise,
      plant: job.plant,
      country: job.country,
      asset: job.asset,
      elpremar: detail.execution?.performedBy ?? "",
      scheduled: job.date,
      slot: job.slot,
      recommendation: advice ? `Clean with ${advice.product} — ${advice.because}.` : "Cleaning recommended from the inspection.",
    })
    setRaised(id)
    toast.success(`${id} raised`, { description: `Cleaning for ${job.asset}, from inspection ${job.id}` })
  }

  return (
    <TaskPanel icon={FileText} title="Reports">
      {generated ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.kind} report={report} onPrint={() => printReport(report, header)} />
          ))}
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Two reports come out of this inspection: the contamination the cleaning is sold on, and the physical hygiene
            of the panel. Both are built from what was recorded.
          </p>
          <Button className="mt-3 h-12 w-full sm:w-auto" onClick={() => markReportGenerated(job.id)}>
            <FileText /> Generate Report
          </Button>
        </>
      )}

      {/* ---------- The cleaning the report asks for ---------- */}
      {generated && advice ? (
        <div className="mt-4 rounded-xl bg-info-soft p-3 ring-1 ring-primary/20">
          <p className="flex items-start gap-2 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Recommended: <strong className="font-semibold">{advice.product}</strong> — {advice.because}.
            </span>
          </p>
          {raised ? (
            <Button variant="outline" className="mt-2 h-12 w-full bg-card" onClick={() => navigate(`/my-tasks/${raised}`)}>
              Open {raised}
            </Button>
          ) : (
            <Button className="mt-2 h-12 w-full" onClick={raiseCleaning}>
              <SprayCan /> Raise the cleaning task
            </Button>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">
            Raised against this inspection, so the clean and the reading that called for it stay joined.
          </p>
        </div>
      ) : null}
    </TaskPanel>
  )
}

/** One report, on screen, with the way to get it off the tablet */
function ReportCard({ report, onPrint }: { report: InspectionReport; onPrint: () => void }) {
  return (
    <section className="rounded-xl ring-1 ring-foreground/10">
      <header className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <h4 className="flex-1 font-semibold text-brand-navy dark:text-foreground">{report.title}</h4>
        <span className="text-sm text-muted-foreground">{report.summary}</span>
        {report.score === undefined ? null : (
          <span className="rounded-full bg-card px-2.5 py-1 text-sm font-bold tabular-nums ring-1 ring-foreground/10">
            {report.score} / 100
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          className="bg-card"
          /* printReport says so itself if the browser blocks the window */
          onClick={onPrint}
        >
          <Printer /> Save as PDF
        </Button>
      </header>

      <div className="divide-y">
        {report.sections.map((section) => (
          <div key={section.title} className="p-3">
            <h5 className="text-sm font-semibold">{section.title}</h5>
            {section.note ? <p className="mt-0.5 text-xs text-muted-foreground">{section.note}</p> : null}
            {section.rows.length ? (
              <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-[max-content_minmax(0,1fr)]">
                {section.rows.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className={cn("text-sm font-medium", row.tone && toneClass[row.tone])}>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Nothing recorded.</p>
            )}
          </div>
        ))}

        {report.recommendations.length ? (
          <div className="p-3">
            <h5 className="text-sm font-semibold">Recommendations</h5>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {report.recommendations.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="p-3 text-sm text-muted-foreground">
            <Download className="mr-1.5 inline size-4" />
            Nothing to action from this report.
          </p>
        )}
      </div>
    </section>
  )
}
