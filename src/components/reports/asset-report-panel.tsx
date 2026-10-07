import { Link } from "react-router"
import { ClipboardList, Download, ExternalLink, Sparkles, Wrench, X } from "lucide-react"
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
 * Asset Details & Health Report — the panel beside the report tables.
 *
 * It opens when a row's View is pressed and closes on the cross, rather than
 * preselecting the first result. The parameter sheet suggests preselecting for
 * usability; the client asked on review for it to open only on View, which is
 * what this does.
 *
 * The mockup's third tab, Trend & Analytics, is not here — trend reporting was
 * dropped from this screen along with the Trend Analysis tab above it.
 */
export function AssetReportPanel({ row, onClose }: { row: ReportRow; onClose: () => void }) {
  const { asset } = row
  const report = assetReport(row)
  const band = row.healthScore === null ? null : healthBandFor(row.healthScore)

  return (
    <aside className="flex flex-col gap-3 rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-brand-navy dark:text-foreground">Asset Details &amp; Health Report</h3>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close the report panel" onClick={onClose}>
          <X />
        </Button>
      </header>

      {/* ---------- Which asset this is ---------- */}
      <div className="flex gap-3">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
          <AssetPhoto label={asset.category} caption={asset.name} />
          <Badge
            variant={findingLook[row.contaminationStatus].badge}
            className="absolute inset-x-1 bottom-1 h-auto justify-center rounded px-1 py-0.5 text-[0.65rem]"
          >
            {row.contaminationStatus}
          </Badge>
        </div>
        <DetailList
          className="min-w-0 flex-1 text-xs"
          rows={[
            { label: "Asset Tag ID", value: asset.tag, always: true },
            { label: "Asset Name", value: asset.name, always: true },
            { label: "Category", value: asset.category },
            { label: "Location", value: asset.area },
            { label: "Department", value: asset.department },
            { label: "Manufacturer", value: asset.manufacturer },
            { label: "Model", value: asset.model },
            { label: "Serial Number", value: asset.serial },
          ]}
        />
      </div>

      {/* ---------- Its identity on the platform ---------- */}
      <div className="flex items-center gap-3 rounded-md bg-muted/40 p-2">
        <div className="shrink-0 rounded bg-white p-1 ring-1 ring-foreground/10">
          <AssetQrCode asset={asset} size={64} />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Asset ID (Unique)</div>
          <AssetIdChip id={asset.id} className="mt-0.5" />
        </div>
      </div>

      {/* ---------- Where it stands ---------- */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Health Score">
          {band ? (
            <HealthDial score={row.healthScore!} label={band.label} tone={band.tone} className="size-20" />
          ) : (
            <span className="text-xs text-muted-foreground">Not inspected</span>
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
          <Badge variant={findingLook[row.hygieneStatus].badge} className="h-auto rounded px-2 py-1 text-xs">
            {row.hygieneStatus}
          </Badge>
          <span className="mt-1 block text-[0.65rem] leading-tight text-muted-foreground">
            {row.hygieneStatus === "Not Inspected" ? "No walk yet" : `${row.hygieneOpen} of 8 points open`}
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
            className="text-xs"
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
              hygiene report carries none - see report-data.ts */}
          <ul className="divide-y divide-foreground/10 text-xs">
            {row.hygiene.map((point) => (
              <li key={point.check} className="flex items-center justify-between gap-2 py-1.5 first:pt-0">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2 shrink-0 rounded-full", findingLook[point.finding].dot)} />
                  <span className="truncate">{point.check}</span>
                </span>
                <span className="shrink-0 text-muted-foreground">{point.finding}</span>
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
            <p className="py-4 text-center text-sm text-muted-foreground">No maintenance recorded against this asset.</p>
          )}
          <DetailList
            className="mt-2 text-xs"
            rows={[
              { label: "Next Maintenance Due", value: row.nextMaintenanceDue },
              { label: "Maintenance Type", value: row.maintenanceType },
            ]}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to={`/assets/${asset.id}`}>
            <ExternalLink /> Full asset
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          onClick={() => toast.info("Report generation is a Phase-1 server job; nothing is produced on the tablet yet.")}
        >
          <Download /> Download PDF
        </Button>
      </div>
    </aside>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-md bg-muted/40 p-2 text-center">
      <span className="mb-1 text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      {children}
    </div>
  )
}
