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

/** Open one in a tab of its own, which is where a PDF is read */
export const openReport = (report: SampleReport) => window.open(report.file, "_blank", "noopener")
