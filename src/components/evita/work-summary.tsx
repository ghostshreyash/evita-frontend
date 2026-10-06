import { Activity, Camera, Droplets, Eye, Flame, Gauge, Timer, Wrench } from "lucide-react"
import { cn } from "cn"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DetailList } from "@/components/common/detail-list"
import { EvidenceStrip, TaskPanel } from "@/components/evita/field-kit"
import { TimeLog } from "@/components/evita/time-log"
import type { InspectionDetail } from "@/data/inspection-detail"
import type { MaintenanceDetail } from "@/data/maintenance-detail"
import { td, th } from "@/lib/data-table"

/**
 * Read-only views of what was recorded, for work that is submitted, approved
 * or closed — the same panels and label/value lists as the asset screens.
 */

const resultTone = { Pass: "text-healthy", Attention: "text-attention", Fail: "text-critical" } as const
const severityTone = {
  Low: "bg-neutral-soft text-neutral-soft-foreground",
  Medium: "bg-attention-soft text-attention-soft-foreground",
  High: "bg-critical-soft text-critical-soft-foreground",
  Critical: "bg-critical text-critical-foreground",
} as const

const empty = (text: string) => <p className="py-1 text-sm text-muted-foreground">{text}</p>

export function InspectionRecord({ detail }: { detail: InspectionDetail }) {
  const images = detail.evidence.filter((e) => e.kind !== "document")
  return (
    <div className="space-y-3">
      <TaskPanel icon={Gauge} title="Test Results" contentClassName="px-2 py-3">
        {detail.measurements.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={th}>Parameter</TableHead>
                  <TableHead className={th}>Measured</TableHead>
                  <TableHead className={cn(th, "max-md:hidden")}>Instrument</TableHead>
                  <TableHead className={th}>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.measurements.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className={cn(td, "font-medium whitespace-normal")}>{m.parameter}</TableCell>
                    <TableCell className={cn(td, "tabular-nums")}>{m.value} {m.unit !== "—" && m.unit !== "Other" ? m.unit : ""}</TableCell>
                    <TableCell className={cn(td, "text-muted-foreground max-md:hidden")}>{m.source}</TableCell>
                    <TableCell className={cn(td, "font-semibold", resultTone[m.status])}>{m.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="px-2">{empty("No readings recorded.")}</div>
        )}
      </TaskPanel>

      <TaskPanel icon={Eye} title={`Observations (${detail.observations.length})`}>
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
          empty("No abnormality observed.")
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
          {detail.products.length ? <DetailList rows={detail.products.map((p) => ({ label: p.name, value: `${p.quantity} ${p.unit}` }))} /> : empty("None booked.")}
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

        <TaskPanel icon={Activity} title="PD Mitigation">
          {detail.pdMitigation ? (
            <DetailList
              rows={[
                { label: "Method", value: detail.pdMitigation.method, always: true },
                { label: "Remarks", value: detail.pdMitigation.remarks },
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
