/**
 * The two reports an inspection produces, as the client set them out on
 * 12-10-2026.
 *
 * - The **Contamination Report** is what the cleaning is sold on. It carries
 *   the dust, carbon and corrosion the AI read off the photographs, the thermal
 *   hot spots with their rise over ambient, the fire prevention system, and the
 *   measured electrical parameters against the ratings the asset was onboarded
 *   with. It is scored: 70% contamination, 20% thermal, 10% fire prevention.
 * - The **Hygiene Report** is the physical condition of the panel - cable
 *   ducts, hanging or broken wires, doors, hinges, locks, indicators. It is
 *   deliberately **not** scored: the client's reason is that cleaning cannot
 *   improve what is outside the scope of work, so a customer who paid for a
 *   clean would otherwise see a score that refused to move.
 *
 * Both end in recommendations. The contamination one names the INSTA product
 * (see data/insta.ts); the hygiene one asks for the physical faults to be
 * rectified.
 */
import { toast } from "sonner"

import type { InspectionCapture } from "@/data/inspection-detail"
import { recommendInsta } from "@/data/insta"
import { contaminationKinds, hygieneChecks, inspectionReadingsFor, readingKeys } from "@/data/test-template"
import { levelOf, thermalReadings } from "@/lib/testing"

export type ReportRow = { label: string; value: string; tone?: "healthy" | "attention" | "critical" }
export type ReportSection = { title: string; rows: ReportRow[]; note?: string }

export type InspectionReport = {
  kind: "Contamination" | "Hygiene" | "Cleaning"
  title: string
  summary: string
  sections: ReportSection[]
  recommendations: string[]
  /** Absent on the hygiene report, deliberately */
  score?: number
}

/** One onboarded rating, as the asset register holds it */
export type RatedParameter = { label: string; value: string; unit?: string }

const num = (v?: string) => {
  const n = Number((v ?? "").replace(/[^\d.-]/g, ""))
  return Number.isFinite(n) && (v ?? "").trim() !== "" ? n : undefined
}

const levelTone = (level?: string): ReportRow["tone"] =>
  level === "High" ? "critical" : level === "Medium" ? "attention" : level ? "healthy" : undefined

/**
 * What the readings say against what the asset is rated for.
 *
 * The client's own example: a 1600 A asset running at 1500 A is "90% ke paar",
 * and the report has to say so. Anything at or over the rating is worse than a
 * warning, so it reads critical.
 */
export function ratingComparison(capture: InspectionCapture, category: string, rated: RatedParameter[]): ReportRow[] {
  const rows: ReportRow[] = []
  const find = (needle: string) => rated.find((r) => r.label.toLowerCase().includes(needle))

  /** The heaviest phase is the one the rating has to carry */
  const phases = readingKeys({ key: "phaseLoad", label: "", unit: "A", required: false, phases: true })
    .map((k) => num(capture.readings[k]))
    .filter((n): n is number => n !== undefined)
  const running = phases.length ? Math.max(...phases) : num(capture.readings.loadCurrent)

  const ratedCurrent = find("rated current") ?? find("busbar rating") ?? find("incomer rating")
  if (running !== undefined && ratedCurrent) {
    const limit = num(ratedCurrent.value)
    if (limit) {
      const pc = Math.round((running / limit) * 100)
      rows.push({
        label: ratedCurrent.label,
        value: `${limit} ${ratedCurrent.unit ?? "A"} rated · ${running} A measured · ${pc}% of rated`,
        tone: pc >= 100 ? "critical" : pc >= 90 ? "attention" : "healthy",
      })
    }
  }

  const measuredVoltage = num(capture.readings.voltage)
  const ratedVoltage = find("rated voltage") ?? find("voltage")
  if (measuredVoltage !== undefined && ratedVoltage) {
    const limit = num(ratedVoltage.value)
    if (limit) {
      const off = Math.round(((measuredVoltage - limit) / limit) * 100)
      rows.push({
        label: ratedVoltage.label,
        value: `${limit} ${ratedVoltage.unit ?? "V"} rated · ${measuredVoltage} V measured · ${off > 0 ? "+" : ""}${off}%`,
        // The client's own figure for an acceptable supply: within 10% of rated
        tone: Math.abs(off) > 10 ? "critical" : Math.abs(off) > 5 ? "attention" : "healthy",
      })
    }
  }

  /* Everything else the sheet asked for, reported as measured */
  for (const spec of inspectionReadingsFor(category)) {
    if (spec.key === "phaseLoad" || spec.key === "voltage" || spec.key === "loadCurrent") continue
    const value = capture.readings[spec.key]?.trim()
    if (value) rows.push({ label: spec.label, value: `${value} ${spec.unit}` })
  }

  if (running !== undefined && !ratedCurrent) {
    rows.push({
      label: "Load current",
      value: `${running} A measured · no rated current on the asset record to compare against`,
      tone: "attention",
    })
  }
  return rows
}

export function contaminationReport(
  capture: InspectionCapture,
  category: string,
  rated: RatedParameter[],
  score?: number
): InspectionReport {
  const level = levelOf(capture)
  const thermal = thermalReadings(capture)
  const advice = recommendInsta(capture)

  const sections: ReportSection[] = [
    {
      title: "Contamination",
      note: "Read from the asset photographs after sync. Carries 70% of the health score.",
      rows: [
        ...contaminationKinds.map((kind) => ({
          label: kind,
          value: capture.contamination?.[kind] ?? "Not assessed",
          tone: levelTone(capture.contamination?.[kind]),
        })),
        { label: "Dust thickness", value: capture.thickness ?? "Not assessed" },
        { label: "Overall level", value: level ?? "Not assessed", tone: levelTone(level) },
      ],
    },
    {
      title: "Thermal",
      note: "Each point is judged on its rise over ambient. Carries 20% of the health score.",
      rows: [
        { label: "Ambient temperature", value: capture.ambient ? `${capture.ambient} °C` : "Not recorded" },
        ...thermal.map((point) => ({
          label: point.point,
          value:
            point.max === undefined
              ? "Image captured, temperature not read"
              : `${point.max} °C${point.dt === undefined ? "" : ` · ΔT ${point.dt} °C`}`,
          tone: point.status === "Fail" ? ("critical" as const) : point.status === "Attention" ? ("attention" as const) : undefined,
        })),
      ],
    },
    {
      title: "Fire Prevention",
      note: "Carries 10% of the health score.",
      rows: [
        { label: "System installed", value: capture.fps.installed ?? "Not assessed", tone: capture.fps.installed === "No" ? "critical" : undefined },
        ...(capture.fps.status ? [{ label: "Status", value: capture.fps.status, tone: capture.fps.status === "At Risk" ? ("critical" as const) : undefined }] : []),
        ...(capture.fps.remarks ? [{ label: "Remarks", value: capture.fps.remarks }] : []),
      ],
    },
    {
      title: "Technical Parameters Measured",
      note: "Against the ratings the asset was onboarded with.",
      rows: ratingComparison(capture, category, rated),
    },
  ]

  return {
    kind: "Contamination",
    title: "Contamination Report",
    summary: level ? `${level} contamination` : "Contamination not yet assessed",
    sections,
    score,
    recommendations: [
      ...(advice ? [`Clean with ${advice.product} — ${advice.because}.`] : []),
      ...(level === "High" || level === "Medium" ? ["Re-inspect after the clean so the before-and-after can be shown."] : []),
      ...(capture.fps.installed === "No" ? ["Install a fire prevention system on this asset."] : []),
    ],
  }
}

export function hygieneReport(capture: InspectionCapture): InspectionReport {
  const assessed = hygieneChecks.filter((c) => capture.hygiene[c.key])
  const faults = assessed.filter((c) => !capture.hygiene[c.key].ok)

  return {
    kind: "Hygiene",
    title: "Hygiene Report",
    summary: assessed.length
      ? faults.length
        ? `${faults.length} of ${assessed.length} points need attention`
        : "All points clear"
      : "Physical condition not yet assessed",
    sections: [
      {
        title: "Physical Condition",
        note: "Read from the asset photographs after sync. Not scored: cleaning cannot improve what is outside the scope of work.",
        rows: assessed.map((check) => ({
          label: check.label,
          value: capture.hygiene[check.key].ok ? "Clear" : capture.hygiene[check.key].note || "Needs attention",
          tone: capture.hygiene[check.key].ok ? ("healthy" as const) : ("attention" as const),
        })),
      },
    ],
    recommendations: faults.length
      ? [`Kindly rectify: ${faults.map((c) => c.label.toLowerCase()).join(", ")}.`, "These sit outside the cleaning scope of work and are raised for the plant to action."]
      : [],
  }
}

/**
 * Hand the report to the browser's print dialogue, which is where a PDF comes
 * from on a tablet.
 *
 * Printed from a window of its own rather than the app, so the page needs no
 * print stylesheet and what comes out carries only the report.
 *
 * The window is opened WITHOUT `noopener`. With it, `window.open` is specified
 * to return null even though the window itself opens, so the report could never
 * be written into it and the engineer got an empty `about:blank`. Nothing
 * untrusted is loaded here - the markup below is the whole document - so there
 * is no opener to protect.
 */
export function printReport(report: InspectionReport, header: { asset: string; assetId: string; plant: string; when: string }) {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c)
  const tone = { healthy: "#0f7a5c", attention: "#b45309", critical: "#b91c1c" }

  const body = report.sections
    .map(
      (section) => `<section>
      <h2>${esc(section.title)}</h2>
      ${section.note ? `<p class="note">${esc(section.note)}</p>` : ""}
      <table>${section.rows
        .map(
          (row) =>
            `<tr><th>${esc(row.label)}</th><td${row.tone ? ` style="color:${tone[row.tone]};font-weight:600"` : ""}>${esc(row.value)}</td></tr>`
        )
        .join("")}</table>
    </section>`
    )
    .join("")

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(report.title)} — ${esc(header.assetId)}</title>
  <style>
    body { font: 13px/1.5 system-ui, sans-serif; color: #111; margin: 32px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #0b1f44 }
    h2 { font-size: 14px; margin: 20px 0 6px; color: #0b1f44; border-bottom: 1px solid #ddd; padding-bottom: 4px }
    .meta { color: #555; margin: 0 0 4px }
    .note { color: #666; font-size: 12px; margin: 0 0 6px }
    table { border-collapse: collapse; width: 100% }
    th { text-align: left; font-weight: 500; color: #555; width: 42%; padding: 4px 8px 4px 0; vertical-align: top }
    td { padding: 4px 0; vertical-align: top }
    .score { display: inline-block; margin-top: 8px; padding: 4px 10px; border: 1px solid #ccc; border-radius: 999px; font-weight: 700 }
    ul { margin: 6px 0 0 18px; padding: 0 }
  </style></head><body>
  <h1>${esc(report.title)}</h1>
  <p class="meta">${esc(header.asset)} · ${esc(header.assetId)} · ${esc(header.plant)}</p>
  <p class="meta">Inspected ${esc(header.when)}</p>
  <p class="meta"><strong>${esc(report.summary)}</strong></p>
  ${report.score === undefined ? "" : `<div class="score">Health score ${report.score} / 100</div>`}
  ${body}
  ${report.recommendations.length ? `<section><h2>Recommendations</h2><ul>${report.recommendations.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></section>` : ""}
  </body></html>`

  const win = window.open("", "_blank", "width=820,height=1000")
  if (!win) {
    toast.error("Allow pop-ups for this site to save the report as a PDF.")
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
