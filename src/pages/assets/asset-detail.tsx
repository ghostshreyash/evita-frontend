import { useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { Activity, ArrowLeft, Building2, CircleDashed, FileText, Images, QrCode, Settings, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { AssetPhoto } from "@/components/common/asset-photo"
import { HealthDial } from "@/components/common/health-dial"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { assetDetailRows, assetTechnicalRows } from "@/components/assets/asset-sections"
import { AssetIdChip, AssetQrPanel, QrLabelPreview } from "@/components/assets/asset-qr"
import { CategoryIcon } from "@/components/common/category-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AssetRecord } from "@/data/asset-data"
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
 * blocks belong here once the inspection and maintenance records are
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
  // No inspection has happened yet on an asset still waiting to sync, so there
  // is no score to show - better an absent panel than an invented number
  const band = asset.health === null ? null : healthBandFor(asset.health)

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
        <Badge
          variant={band ? healthStatus[band.tone].badge : "neutral"}
          className="h-auto rounded px-2 py-1 text-xs"
        >
          {band ? `${band.label} · ${asset.health}` : "Onboarded"}
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
          <DetailPanel icon={Activity} title={band ? "Health & Condition" : "Condition"}>
            {band ? (
              <HealthDial score={asset.health!} label={band.label} tone={band.tone} />
            ) : (
              <p className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-sm text-muted-foreground">
                <CircleDashed className="mt-0.5 size-4 shrink-0" />
                Not inspected yet. A health score appears once the first inspection report is in.
              </p>
            )}
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
                <figure key={image.id}>
                  <div className="h-24 overflow-hidden rounded-md ring-1 ring-foreground/10">
                    <AssetPhoto file={captures?.images[image.id]} label={image.name} caption={image.name} />
                  </div>
                  <figcaption className="mt-1 line-clamp-2 text-center text-xs leading-tight">{image.name}</figcaption>
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
                    <TableHead className={th}>Name</TableHead>
                    <TableHead className={th}>File Name</TableHead>
                    <TableHead className={th}>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className={cn(td, "font-medium")}>{doc.name}</TableCell>
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
