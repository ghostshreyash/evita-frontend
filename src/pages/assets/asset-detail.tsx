import { useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Activity, ArrowLeft, Building2, Cog, FileText, Images, QrCode, Settings, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { AssetPhoto } from "@/components/common/asset-photo"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { assetDetailRows, assetOperationalRows, assetTechnicalRows } from "@/components/assets/asset-sections"
import { AssetIdChip, AssetQrPanel, QrLabelPreview } from "@/components/assets/asset-qr"
import { CategoryIcon } from "@/components/assets/category-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { assetSyncMeta, type AssetRecord } from "@/data/asset-data"
import { capturesOf, findAsset, profileOf, useAssetRows } from "@/data/asset-store"
import { criticalityTone } from "@/data/occ-tables"
import { healthBandFor } from "@/data/master-data"
import { td, th } from "@/lib/data-table"
import { healthStatus } from "@/lib/status"

/**
 * One asset, in full.
 *
 * This is the Asset ID & QR screen and the review step combined: the identity
 * and its code at the top, then every value onboarding captured, the
 * photographs, and the documents behind them.
 *
 * Inspection Information, Maintenance Information and Recent Activities are
 * deliberately absent. Inspection and maintenance records are not held yet, and
 * a panel of invented dates against a real asset is worse than no panel — those
 * blocks belong here once Testing & Measurements and Maintenance Activities are
 * built and have something true to show.
 */
export function AssetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Subscribing keeps this screen live for an asset registered in this session
  useAssetRows()
  const asset = findAsset(id)

  if (!asset) return <NotFound id={id} />

  return <AssetDetail asset={asset} onBack={() => navigate("/assets")} />
}

function AssetDetail({ asset, onBack }: { asset: AssetRecord; onBack: () => void }) {
  const profile = useMemo(() => profileOf(asset), [asset])
  const captures = capturesOf(asset.id)
  const band = healthBandFor(asset.health)

  return (
    <div>
      <PageHeader
        title={asset.name}
        description={`${asset.category} · ${asset.area}`}
        breadcrumbs={[{ label: "Assets", to: "/assets" }, { label: asset.id }]}
        actions={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft /> Back to Assets
          </Button>
        }
      />

      {/* ---------- Identity strip ---------- */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-card px-3 py-2.5 shadow-xs ring-1 ring-foreground/10">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
          <CategoryIcon category={asset.category} className="size-5" />
        </span>
        <AssetIdChip id={asset.id} />
        <span className="text-sm text-muted-foreground">{asset.tag}</span>
        <span className={cn("rounded px-2 py-1 text-xs font-semibold", criticalityTone[asset.criticality])}>
          {asset.criticality} criticality
        </span>
        <Badge variant={assetSyncMeta[asset.status].badge} className="h-auto rounded px-2 py-1 text-xs">
          {assetSyncMeta[asset.status].label}
        </Badge>
        <span className="ml-auto text-sm text-muted-foreground">
          Onboarded <span className="font-medium text-foreground tabular-nums">{asset.onboarded}</span>
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------- Identity and where it sits ---------- */}
        <DetailPanel icon={Building2} title="Asset Information">
          <DetailList rows={assetDetailRows(profile)} />
        </DetailPanel>

        {/* ---------- The code on the panel door ---------- */}
        <DetailPanel icon={QrCode} title="Asset ID & QR Code">
          <AssetQrPanel asset={asset} />
        </DetailPanel>

        {/* ---------- How it is doing ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={Activity} title="Health & Condition">
            <HealthDial score={asset.health} label={band.label} tone={band.tone} />
            <DetailList
              className="mt-3"
              rows={[
                { label: "Asset Condition", value: profile.operational.condition, always: true },
                { label: "Current Load", value: profile.operational.load ? `${profile.operational.load} kVA` : "" },
                { label: "Next Due Date", value: profile.operational.nextDue },
              ]}
            />
          </DetailPanel>

          <DetailPanel title="QR Code Label Preview">
            <QrLabelPreview asset={asset} />
          </DetailPanel>
        </div>

        {/* ---------- What it was photographed as ---------- */}
        <DetailPanel
          icon={Images}
          title={`Asset Images (${profile.images.length})`}
          className="lg:col-span-2 xl:col-span-1"
        >
          {profile.images.length ? (
            <div className="grid grid-cols-3 gap-2">
              {profile.images.map((image) => (
                <figure key={image.slot}>
                  <div className="h-24 overflow-hidden rounded-md ring-1 ring-foreground/10">
                    <AssetPhoto file={captures?.images[image.slot]} label={image.label} caption={image.caption} />
                  </div>
                  <figcaption className="mt-1 text-center text-xs leading-tight">{image.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No photographs held for this asset.</p>
          )}
        </DetailPanel>

        <DetailPanel icon={Settings} title="Technical Details">
          <DetailList rows={assetTechnicalRows(profile)} />
        </DetailPanel>

        <DetailPanel icon={Cog} title="Operational Details">
          <DetailList rows={assetOperationalRows(profile)} />
        </DetailPanel>

        {/* ---------- The paperwork behind the ratings ---------- */}
        <DetailPanel
          icon={FileText}
          title={`Documents (${profile.documents.length})`}
          contentClassName="px-1"
          className="lg:col-span-2 xl:col-span-3"
        >
          {profile.documents.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={th}>Document Type</TableHead>
                    <TableHead className={th}>File Name</TableHead>
                    <TableHead className={th}>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.documents.map((doc) => (
                    <TableRow key={doc.type}>
                      <TableCell className={cn(td, "font-medium")}>{doc.type}</TableCell>
                      <TableCell className={cn(td, "text-muted-foreground")}>{doc.file}</TableCell>
                      <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{doc.uploaded}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No documents held for this asset.</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}

/** Health score as a ring, in the band's own colour */
function HealthDial({ score, label, tone }: { score: number; label: string; tone: "healthy" | "attention" | "critical" }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const filled = (Math.max(0, Math.min(100, score)) / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="size-28" role="img" aria-label={`Health score ${score} out of 100, ${label}`}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-foreground/10" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={healthStatus[tone].color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" className="fill-foreground text-2xl font-bold tabular-nums">
          {score}
        </text>
        <text x="50" y="66" textAnchor="middle" className="fill-muted-foreground text-xs">
          / 100
        </text>
      </svg>
      <Badge variant={healthStatus[tone].badge} className="mt-1 h-auto rounded px-2.5 py-1 text-sm">
        {label}
      </Badge>
    </div>
  )
}

function NotFound({ id }: { id?: string }) {
  return (
    <div>
      <PageHeader title="Asset not found" breadcrumbs={[{ label: "Assets", to: "/assets" }, { label: id ?? "Unknown" }]} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
        <TriangleAlert className="size-8 text-attention" />
        <p className="max-w-md text-sm text-muted-foreground">
          No asset is registered under <span className="font-semibold">{id}</span> at your plant. It may belong to another
          site, or it may not have reached this tablet yet.
        </p>
        <Button asChild>
          <Link to="/assets">Back to Assets</Link>
        </Button>
      </div>
    </div>
  )
}
