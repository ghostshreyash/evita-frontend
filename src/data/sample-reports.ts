/**
 * The three documents an asset's record produces, as OLIVINE issue them.
 *
 * The PDFs in `public/reports` are the client's own samples (14-10-2026) and
 * stand in for the generated article until the reporting service exists: one
 * contamination report, one hygiene report, and the before-and-after a clean is
 * sold on. Every asset opens the same sample, which is the point of a sample -
 * the layout is what is being agreed, not the figures.
 *
 * TODO(api): swap `file` for the URL the reporting service returns for this
 * asset's own report. Nothing else here should need to change.
 */
import { openPanel } from "@/lib/ui-store"

export type ReportKind = "contamination" | "hygiene" | "cleaning"

export type SampleReport = {
  kind: ReportKind
  title: string
  /** What the report is for, in a line */
  detail: string
  file: string
}

export const sampleReports: SampleReport[] = [
  {
    kind: "contamination",
    title: "Contamination Report",
    detail: "Dust, carbon and corrosion read off the inspection, scored",
    file: "/reports/contamination-report-sample.pdf",
  },
  {
    kind: "hygiene",
    title: "Hygiene Report",
    detail: "The physical condition of the panel, point by point",
    file: "/reports/hygiene-report-sample.pdf",
  },
  {
    kind: "cleaning",
    title: "Cleaning Report",
    detail: "The panel as found against the panel after cleaning",
    file: "/reports/cleaning-report-sample.pdf",
  },
]

/**
 * Read one without leaving the screen it was opened from.
 *
 * A tab of its own means leaving EVITA on a tablet, and the engineer loses the
 * list they were working down - so it opens in the reader over the page, with
 * Open and Download on its bar for anyone who does want it elsewhere.
 */
export const openReport = (report: SampleReport) =>
  openPanel({ kind: "document", title: report.title, file: report.file, detail: report.detail })
