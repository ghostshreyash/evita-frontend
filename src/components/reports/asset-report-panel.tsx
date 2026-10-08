import { Link } from "react-router"
import { ClipboardList, Download, ExternalLink, QrCode, Sparkles, Wrench, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { AssetPhoto } from "@/components/common/asset-photo"
import { HealthDial } from "@/components/common/health-dial"
import { DetailList } from "@/components/common/detail-list"
import { AssetIdChip, AssetQrCode } from "@/components/assets/asset-qr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assetReport, contaminationTone, findingLook, type ReportRow } from "@/data/report-data"
import { healthBandFor } from "@/data/master-data"
import { td, th } from "@/lib/data-table"

/**
 * Asset Details & Health Report — the report for the selected row.
 *
 * It opens as a drawer down the full height of the screen on the right. The
 * drawer is not modal, so the table stays readable and clickable behind it and
 * another row can be opened without closing this one first.
 *
 * It opens on View rather than preselecting the first result. The parameter
 * sheet suggests preselecting for usability; the client asked at review for it
 * to open only on View.
 *
 * The mockup's Trend & Analytics tab is not here — trend reporting was dropped
 * from this screen along with the Trend Analysis tab above it.
 */
export function AssetReportPanel({ row, onClose }: { row: ReportRow; onClose: () => void }) {
  const { asset } = row
  const report = assetReport(row)
  const band = row.healthScore === null ? null : healthBandFor(row.healthScore)

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      {/* Fixed head and foot; only the record between them scrolls */}
      <header className="flex shrink-0 items-start justify-between gap-2 border-b px-3 py-2.5">
        <h3 className="min-w-0 text-base font-semibold text-brand-navy dark:text-foreground">
          Asset Details
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">{asset.id}</span>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <Button asChild variant="link" size="sm" className="px-1">
            <Link to={`/assets/${asset.id}`}>
              View Full Details <ExternalLink />
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Close the report panel" onClick={onClose}>
            <X />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* ---------- Which asset this is ---------- */}
        <div className="flex gap-3">
          <figure className="w-28 shrink-0">
            <div className="h-24 overflow-hidden rounded-md ring-1 ring-foreground/10">
              <AssetPhoto label={asset.category} caption={asset.name} />
            </div>
            <figcaption className="mt-1 text-center">
              <Badge variant={findingLook[row.contaminationStatus].badge} className="h-auto rounded px-2 py-0.5 text-xs">
                {row.contaminationStatus}
              </Badge>
            </figcaption>
          </figure>
          <DetailList
            className="min-w-0 flex-1"
            rows={[
              { label: "Asset Tag ID", value: asset.tag, always: true },
              { label: "Asset Name", value: asset.name, always: true },
              { label: "Category", value: asset.category },
              { label: "Enterprise", value: asset.enterprise },
              { label: "Location", value: asset.area },
              { label: "Department", value: asset.department },
            ]}
          />
        </div>

        {/* ---------- Its identity on the platform ---------- */}
        <section className="rounded-md bg-info-soft/60 p-2">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-navy dark:text-foreground">
            <QrCode className="size-4 text-primary" /> Asset ID &amp; QR Code
          </h4>
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded bg-white p-1 ring-1 ring-foreground/10">
              <AssetQrCode asset={asset} size={76} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">Asset ID (Unique)</div>
              <AssetIdChip id={asset.id} className="mt-0.5" />
              <p className="mt-1 text-xs text-muted-foreground">
                Scan the code, or tap the Asset ID, to open the full asset record.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Where it stands ---------- */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Health Score">
            {band ? (
              <HealthDial score={row.healthScore!} label={band.label} tone={band.tone} className="size-20" />
            ) : (
              <span className="py-2 text-xs text-muted-foreground">Not inspected</span>
            )}
          </Stat>
          <Stat label="Contamination">
            <span className={cn("rounded px-2 py-1 text-sm font-semibold", contaminationTone[row.contamination])}>
              {row.contamination}
            </span>
            <span className="mt-1 block text-[0.65rem] leading-tight text-muted-foreground">
              {report.inspection.dustType || "No assessment yet"}
            </span>
          </Stat>
          <Stat label="Hygiene">
            <Badge variant={findingLook[row.hygieneStatus].badge} className="h-auto rounded px-1.5 py-1 text-xs">
              {row.hygieneStatus}
            </Badge>
            <span className="mt-1 block text-[0.65rem] leading-tight text-muted-foreground">
              {row.hygieneOpen} of 8 points open
            </span>
          </Stat>
        </div>

        {/* ---------- The record behind it ---------- */}
        <Tabs defaultValue="inspection">
          <TabsList className="w-full">
            <TabsTrigger value="inspection" className="flex-1">
              <ClipboardList className="size-4" /> Inspection
            </TabsTrigger>
            <TabsTrigger value="hygiene" className="flex-1">
              <Sparkles className="size-4" /> Hygiene
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex-1">
              <Wrench className="size-4" /> Maintenance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspection" className="mt-2">
            <DetailList
              rows={[
                { label: "Last Inspection", value: row.lastInspection, always: true },
                { label: "Next Inspection Due", value: row.nextInspectionDue, always: true },
                { label: "Frequency", value: `${row.frequency} months` },
                { label: "Inspection Type", value: report.inspection.type },
                { label: "Inspected By", value: report.inspection.inspectedBy },
                { label: "Overall Condition", value: report.inspection.overallCondition },
                { label: "Dust Thickness", value: report.inspection.dustThickness },
                { label: "Type of Dust", value: report.inspection.dustType },
                { label: "Hotspot Temperature", value: report.inspection.hotspot },
                { label: "Key Findings", value: report.inspection.keyFindings },
                { label: "Recommended Action", value: report.inspection.recommendedAction },
              ]}
            />
          </TabsContent>

          <TabsContent value="hygiene" className="mt-2">
            {/* Point specific, and no score: the client was explicit that the
                hygiene report carries none — see report-data.ts */}
            <ul className="text-sm">
              {row.hygiene.map((point) => (
                <li
                  key={point.check}
                  className="flex items-center justify-between gap-2 border-b py-1.5 last:border-0"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", findingLook[point.finding].dot)} />
                    <span className="truncate">{point.check}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{point.finding}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-2">
            {report.maintenance.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={th}>Date</TableHead>
                    <TableHead className={th}>Type</TableHead>
                    <TableHead className={th}>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.maintenance.map((m) => (
                    <TableRow key={m.date}>
                      <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{m.date}</TableCell>
                      <TableCell className={td}>{m.type}</TableCell>
                      <TableCell className={cn(td, "text-muted-foreground")}>{m.by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No maintenance recorded against this asset.
              </p>
            )}
            <DetailList
              className="mt-2"
              rows={[
                { label: "Next Maintenance Due", value: row.nextMaintenanceDue },
                { label: "Maintenance Type", value: row.maintenanceType },
              ]}
            />
          </TabsContent>
        </Tabs>

      </div>

      <div className="shrink-0 border-t p-3">
        <Button
          type="button"
          className="w-full"
          onClick={() => toast.info("Report generation is a Phase-1 server job; nothing is produced on the tablet yet.")}
        >
          <Download /> Download Report (PDF)
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md bg-muted/40 p-2 text-center">
      <span className="mb-1 text-[0.65rem] leading-tight font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}
