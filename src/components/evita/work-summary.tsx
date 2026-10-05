import { cn } from "cn"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EvidenceStrip } from "@/components/evita/field-kit"
import type { InspectionDetail } from "@/data/inspection-detail"
import type { MaintenanceDetail } from "@/data/maintenance-detail"
import { td, th } from "@/lib/data-table"

/** Read-only views of what was recorded, for work that is submitted, approved or closed */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b py-2 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}

const resultTone = { Pass: "text-healthy", Attention: "text-attention", Fail: "text-critical" } as const
const severityTone = { Low: "bg-neutral-soft text-neutral-soft-foreground", Medium: "bg-attention-soft text-attention-soft-foreground", High: "bg-critical-soft text-critical-soft-foreground", Critical: "bg-critical text-critical-foreground" } as const

export function InspectionRecord({ detail }: { detail: InspectionDetail }) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <h3 className="mb-2 text-base font-semibold">Test Results</h3>
        {detail.measurements.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className={th}>Parameter</TableHead>
                  <TableHead className={th}>Measured</TableHead>
                  <TableHead className={cn(th, "max-md:hidden")}>Instrument</TableHead>
                  <TableHead className={th}>Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.measurements.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className={cn(td, "whitespace-normal")}>{m.parameter}</TableCell>
                    <TableCell className={cn(td, "tabular-nums")}>{m.value} {m.unit !== "—" && m.unit !== "Other" ? m.unit : ""}</TableCell>
                    <TableCell className={cn(td, "max-md:hidden")}>{m.source}</TableCell>
                    <TableCell className={cn(td, "font-semibold", resultTone[m.status])}>{m.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No readings recorded.</p>
        )}
      </section>

      <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <h3 className="mb-2 text-base font-semibold">Observations</h3>
        {detail.observations.length ? (
          <ul className="space-y-2">
            {detail.observations.map((o, i) => (
              <li key={i} className="rounded-md bg-muted/40 p-3">
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
          <p className="text-sm text-muted-foreground">No abnormality observed.</p>
        )}
      </section>

      <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <h3 className="mb-3 text-base font-semibold">Images Captured ({detail.evidence.filter((e) => e.kind !== "document").length})</h3>
        <EvidenceStrip items={detail.evidence.filter((e) => e.kind !== "document")} />
      </section>
    </div>
  )
}

export function MaintenanceRecord({ detail }: { detail: MaintenanceDetail }) {
  const { execution } = detail
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-1 text-base font-semibold">Work Performed</h3>
          {execution ? (
            <dl>
              <Row label="Performed by">{execution.performedBy}</Row>
              <Row label="Mode">{execution.mode}</Row>
              <Row label="Started">{execution.startedAt}</Row>
              <Row label="Stopped">{execution.endedAt ?? "—"}</Row>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Not started.</p>
          )}
          {execution?.notes ? <p className="mt-2 text-sm text-muted-foreground">{execution.notes}</p> : null}
        </section>

        <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-1 text-base font-semibold">INSTA Consumables</h3>
          {detail.products.length ? (
            <dl>
              {detail.products.map((p) => <Row key={p.name} label={p.name}>{p.quantity} {p.unit}</Row>)}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">None booked.</p>
          )}
        </section>

        <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-1 text-base font-semibold">Fire Prevention System</h3>
          {detail.firePrevention ? (
            <dl>
              <Row label="System">{detail.firePrevention.system}</Row>
              {detail.firePrevention.remarks ? <p className="pt-2 text-sm text-muted-foreground">{detail.firePrevention.remarks}</p> : null}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Not performed on this job.</p>
          )}
        </section>

        <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <h3 className="mb-1 text-base font-semibold">PD Mitigation</h3>
          {detail.pdMitigation ? (
            <dl>
              <Row label="Method">{detail.pdMitigation.method}</Row>
              {detail.pdMitigation.remarks ? <p className="pt-2 text-sm text-muted-foreground">{detail.pdMitigation.remarks}</p> : null}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Not performed on this job.</p>
          )}
        </section>
      </div>

      <section className="rounded-lg bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <h3 className="mb-3 text-base font-semibold">Evidence ({detail.evidence.length})</h3>
        {detail.evidence.length ? <EvidenceStrip items={detail.evidence.filter((e) => e.kind !== "document")} /> : <p className="text-sm text-muted-foreground">No evidence uploaded.</p>}
        {detail.evidence.some((e) => e.kind === "document") ? (
          <ul className="mt-3 space-y-1 text-sm">
            {detail.evidence.filter((e) => e.kind === "document").map((d) => (
              <li key={d.id} className="flex justify-between gap-3"><span className="font-medium">{d.label}</span><span className="text-muted-foreground">{d.meta}</span></li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  )
}
