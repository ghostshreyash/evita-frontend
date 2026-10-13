import { useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, CalendarDays, Building2, CircleDashed, ClipboardCheck, FileText, Images, QrCode, Settings, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { AssetPhoto } from "@/components/common/asset-photo"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { assetDetailRows, assetTechnicalRows } from "@/components/assets/asset-sections"
import { AssetQrPanel, QrLabelPreview } from "@/components/assets/asset-qr"
import { StartInspection } from "@/components/assets/start-inspection"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AssetRecord } from "@/data/asset-data"
import { capturesOf, findAsset, profileOf, useAssetRows } from "@/data/asset-store"
import { healthBandFor } from "@/data/master-data"
import { healthStatus } from "@/lib/status"
import { td, th } from "@/lib/data-table"

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
        /* The score belongs with the name: it is the first thing asked about an
           asset, and it was taking a card of its own to say one number */
        badge={
          band ? (
            <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", healthStatus[band.tone].tile)}>
              <span aria-hidden className={cn("size-2 rounded-full", healthStatus[band.tone].dot)} />
              {band.label} · <span className="tabular-nums">{asset.health}/100</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <CircleDashed className="size-4" /> Not inspected yet
            </span>
          )
        }
        description={`${asset.category} · ${asset.area}`}
        breadcrumbs={[{ label: "Assets", to: "/assets" }, { label: asset.id }]}
        actions={
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft /> Back to Assets
          </Button>
        }
      />

      {/*
        * Three columns, each one a thing the engineer came for: what the asset
        * is and the label that goes on its door; the code on that door; what it
        * is rated for and the inspection it leads to. The photographs and the
        * documents run the full width underneath.
        */}
      <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {/* ---------- What it is, and the label for its door ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={Building2} title="Asset Information">
            <DetailList rows={assetDetailRows(profile)} />
          </DetailPanel>

          <DetailPanel title="QR Code Label Preview">
            <QrLabelPreview asset={asset} />
          </DetailPanel>
        </div>

        {/* ---------- The code on the panel door ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={QrCode} title="Asset ID & QR Code">
            <AssetQrPanel asset={asset} />
          </DetailPanel>

          {/* When the asset joined the register - a card of its own, since the
              printed label carries no date */}
          <DetailPanel icon={CalendarDays} title="Onboarding">
            <DetailList rows={[{ label: "Onboarded On", value: asset.onboarded, always: true }]} />
          </DetailPanel>
        </div>

        {/* ---------- What it is rated for, and what it looks like ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={Settings} title="Technical Details">
            <DetailList rows={assetTechnicalRows(profile)} />
          </DetailPanel>

          {/* Walk up to the asset, open its record, inspect it */}
          <DetailPanel icon={ClipboardCheck} title="Inspect this asset">
            <StartInspection asset={asset} />
          </DetailPanel>
        </div>

        {/* ---------- What it was photographed as ---------- */}
        <DetailPanel
          icon={Images}
          title={`Asset Images (${profile.images.length})`}
          className="lg:col-span-2 xl:col-span-3"
        >
          {profile.images.length ? (
            /* A row of five across the page: the angles were shot as a set and
               read as one, and the three-up grid in a column cut them too small */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {profile.images.map((image) => (
                <figure key={image.id}>
                  <div className="h-36 overflow-hidden rounded-lg ring-1 ring-foreground/10">
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
