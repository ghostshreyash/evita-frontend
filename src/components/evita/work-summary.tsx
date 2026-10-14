import { Camera, ClipboardList, Droplets, Eye, Flame, Gauge, Timer, Wrench } from "lucide-react"
import { cn } from "cn"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DetailList } from "@/components/common/detail-list"
import { EvidenceStrip, TaskPanel } from "@/components/evita/field-kit"
import { TimeLog } from "@/components/evita/time-log"
import type { InspectionDetail } from "@/data/inspection-detail"
import type { MaintenanceDetail } from "@/data/maintenance-detail"
import { profileOf, useAssetRows } from "@/data/asset-store"
import { resultLabel, resultPill } from "@/data/test-template"
import { td, th } from "@/lib/data-table"
import { bandLook } from "@/lib/health"
import { inspectionTypeFor } from "@/lib/testing"

/**
 * Read-only views of what was recorded, for work that is submitted, approved
 * or closed — the same panels and label/value lists as the asset screens.
 */

const severityTone = {
  Low: "bg-neutral-soft text-neutral-soft-foreground",
  Medium: "bg-attention-soft text-attention-soft-foreground",
  High: "bg-critical-soft text-critical-soft-foreground",
  Critical: "bg-critical text-critical-foreground",
} as const

const empty = (text: string) => <p className="py-1 text-sm text-muted-foreground">{text}</p>

/**
 * Which onboarded parameter a reading is to be read against.
 *
 * Matched by name rather than by key: the onboarding sheet and the inspection
 * sheet are two separate transcriptions, and they do not share identifiers. The
 * match is deliberately exact - "Neutral-Earth Voltage" must not pick up Rated
 * Voltage, which is a different thing measured at a different place.
 *
 * Only the readings the onboarding sheet has a counterpart for appear here.
 * Frequency is one it does not ask for, so that row carries no onboarded value;
 * nothing is invented to fill the column.
 */
const ratedNames: Record<string, string[]> = {
  voltage: ["rated voltage"],
  "load current per phase": ["rated current", "busbar rating", "incomer rating"],
  "load current": ["rated current", "busbar rating", "incomer rating"],
  "neutral current": ["rated current", "busbar rating", "incomer rating"],
}

/** The value this asset was onboarded with for a measured parameter, if it carries one */
function onboardedValue(parameter: string, rated: { label: string; value: string; unit?: string }[]) {
  const names = ratedNames[parameter.toLowerCase()]
  if (!names) return undefined
  const match = rated.find((r) => names.includes(r.label.toLowerCase()) && r.value.trim())
  return match ? [match.value, match.unit].filter(Boolean).join(" ") : undefined
}

/**
 * A submitted inspection, laid out like the Inspection Completed screen
 * (mockup p.22): the inspection details, the Test Results table, what was
 * found, and the images.
 *
 * Each reading is shown three ways across: what the asset was onboarded with,
 * what was measured on the day, and the standard it is judged against. The
 * onboarded figure is the one the customer signed the asset up with, so a
 * reading drifting away from it is the thing worth seeing at a glance.
 */
export function InspectionRecord({ detail, activity }: { detail: InspectionDetail; activity?: string }) {
  const register = useAssetRows()
  /* What the asset was registered with, so a reading can be read against it */
  const asset = register.find((a) => a.id === detail.assetTag)
  const rated = asset ? profileOf(asset).parameters : []

  const images = detail.evidence.filter((e) => e.kind !== "document")
  const { execution, result } = detail
  const [date, start] = (execution?.startedAt ?? "").split(" ")
  const end = execution?.completedAt?.split(" ")[1]
  return (
    <div className="space-y-5">
      <TaskPanel icon={ClipboardList} title="Inspection Details">
        <DetailList
          rows={[
            { label: "Inspection Type", value: activity ? inspectionTypeFor(activity) : "—" },
            { label: "Activity", value: activity ?? "—" },
            { label: "Inspection Date", value: date || "—" },
            { label: "Inspection Time", value: start ? `${start}${end ? ` – ${end}` : ""}` : "—" },
            {
              label: "Overall Condition",
              value: result ? <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-semibold", bandLook(result.healthScore).soft)}>{bandLook(result.healthScore).label}</span> : "Not Inspected",
            },
            { label: "Health Score", value: result ? <span className="tabular-nums font-bold">{result.healthScore} / 100</span> : "—" },
            { label: "Inspected By", value: execution?.performedBy ?? "—" },
            { label: "Remarks", value: execution?.remarks || "—" },
          ]}
        />
      </TaskPanel>

      <TaskPanel icon={Gauge} title="Test Results" contentClassName="px-2 py-3">
        {detail.measurements.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className={cn(th, "w-10")}>#</TableHead>
                  <TableHead className={th}>Test Parameter</TableHead>
                  <TableHead className={th}>Onboarded Value</TableHead>
                  <TableHead className={th}>Measured Value</TableHead>
                  <TableHead className={cn(th, "max-md:hidden")}>Standard Limit</TableHead>
                  <TableHead className={cn(th, "max-lg:hidden")}>Captured By</TableHead>
                  <TableHead className={th}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.measurements.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className={cn(td, "text-muted-foreground tabular-nums")}>{i + 1}</TableCell>
                    <TableCell className={cn(td, "font-medium whitespace-normal")}>{m.parameter}</TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap tabular-nums text-muted-foreground")}>
                      {onboardedValue(m.parameter, rated) ?? "—"}
                    </TableCell>
                    <TableCell className={cn(td, "tabular-nums font-semibold whitespace-nowrap")}>
                      {m.value} {m.unit !== "—" && m.unit !== "Other" ? m.unit : ""}
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-normal text-muted-foreground max-md:hidden")}>{m.limit ?? "—"}</TableCell>
                    <TableCell className={cn(td, "max-w-56 whitespace-normal text-muted-foreground max-lg:hidden")}>{m.source}</TableCell>
                    <TableCell className={td}>
                      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", resultPill[m.status])}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {resultLabel[m.status]}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="px-2">{empty("No readings recorded.")}</div>
        )}
      </TaskPanel>

      <TaskPanel icon={Eye} title={`Findings (${detail.observations.length})`}>
        {detail.observations.length ? (
          <ul className="divide-y">
            {detail.observations.map((o, i) => (
              <li key={i} className="py-2 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", severityTone[o.severity])}>{o.severity}</span>
                  <span className="text-sm font-medium">{o.type}</span>
                </div>
                <p className="mt-1 text-sm">{o.value}</p>
                {o.remarks ? <p className="text-sm text-muted-foreground">{o.remarks}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          empty("No abnormality observed. All values within limits.")
        )}
      </TaskPanel>

      <TaskPanel icon={Camera} title={`Images Captured (${images.length})`}>
        {images.length ? <EvidenceStrip items={images} /> : empty("No images captured.")}
      </TaskPanel>
    </div>
  )
}

export function MaintenanceRecord({ detail }: { detail: MaintenanceDetail }) {
  const { execution } = detail
  const images = detail.evidence.filter((e) => e.kind !== "document")
  const documents = detail.evidence.filter((e) => e.kind === "document")
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <TaskPanel icon={Wrench} title="Work Performed">
          {execution ? (
            <DetailList
              rows={[
                { label: "Performed By", value: execution.performedBy, always: true },
                { label: "Started", value: execution.startedAt, always: true },
                { label: "Stopped", value: execution.endedAt, always: true },
                { label: "Notes", value: execution.notes },
              ]}
            />
          ) : (
            empty("Not started.")
          )}
        </TaskPanel>

        <TaskPanel icon={Droplets} title="INSTA Consumables">
          {detail.products.length ? (
            <ul className="space-y-1 text-sm font-medium">
              {detail.products.map((p) => (
                <li key={p.name}>{p.name}</li>
              ))}
            </ul>
          ) : (
            empty("None booked.")
          )}
        </TaskPanel>

        <TaskPanel icon={Flame} title="Fire Prevention System">
          {detail.firePrevention ? (
            <DetailList
              rows={[
                { label: "System", value: detail.firePrevention.system, always: true },
                { label: "Remarks", value: detail.firePrevention.remarks },
              ]}
            />
          ) : (
            empty("Not performed on this job.")
          )}
        </TaskPanel>

      </div>

      {detail.timeLog?.length ? (
        <TaskPanel icon={Timer} title="Real Time Maintenance Log">
          <TimeLog entries={detail.timeLog} readOnly />
        </TaskPanel>
      ) : null}

      <TaskPanel icon={Camera} title={`Evidence (${detail.evidence.length})`}>
        {images.length ? <EvidenceStrip items={images} /> : documents.length ? null : empty("No evidence uploaded.")}
        {documents.length ? (
          <DetailList className={images.length ? "mt-3" : undefined} rows={documents.map((d) => ({ label: d.label, value: d.meta }))} />
        ) : null}
      </TaskPanel>
    </div>
  )
}
