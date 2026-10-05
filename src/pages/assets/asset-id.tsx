import { ArrowLeft, Check, CircleCheckBig, Cog, Lightbulb, QrCode } from "lucide-react"

import { PageHeader } from "@/components/common/page-header"
import { CheckList, DetailList, DetailPanel } from "@/components/common/detail-list"
import { AssetIdChip, AssetQrPanel, QrLabelPreview } from "@/components/assets/asset-qr"
import { Button } from "@/components/ui/button"
import { profileOf } from "@/data/asset-store"
import type { AssetRecord } from "@/data/asset-data"

/**
 * Slide 20: the asset is registered, and here is its ID and QR code.
 *
 * The mockup also carries Health & Condition, Inspection Information,
 * Maintenance Information and Recent Activities. None of them belong on this
 * screen: the asset was registered seconds ago, so it has never been inspected,
 * never been maintained, and has no history beyond its own creation. Those four
 * panels would read as data when they are in fact placeholders. The submission
 * checklist takes their place, carrying the new Asset ID as its first line.
 *
 * Everything they would have shown lives on the asset detail screen, which is
 * where an asset with a history is read.
 */
export function AssetIdScreen({
  asset,
  onRestart,
  onDone,
}: {
  asset: AssetRecord
  /** Clear the form and onboard another asset */
  onRestart: () => void
  /** Finish, and open the asset that was just created */
  onDone: () => void
}) {
  const profile = profileOf(asset)

  return (
    <div>
      <PageHeader
        title="Asset ID & QR Code Generated"
        description="The asset has been registered. A unique Asset ID and QR code have been generated for it."
        breadcrumbs={[
          { label: "Assets", to: "/assets" },
          { label: "Asset Onboarding", onClick: onRestart },
          { label: "Asset ID & QR Code" },
        ]}
        actions={
          <p className="flex max-w-md items-start gap-2 rounded-lg bg-healthy-soft px-3 py-2 text-sm ring-1 ring-healthy/20">
            <CircleCheckBig className="mt-0.5 size-5 shrink-0 text-healthy" />
            <span>
              <strong className="block font-semibold">Asset onboarded successfully</strong>
              The record is held on this tablet and reaches the server at the next sync.
            </span>
          </p>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {/* ---------- What was registered ---------- */}
        <DetailPanel icon={Cog} title="Asset Information">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Asset ID (Unique)</span>
            <AssetIdChip id={asset.id} />
          </div>
          <DetailList
            rows={[
              { label: "Asset Category", value: asset.category, always: true },
              { label: "Asset Name / Tag ID", value: asset.tag, always: true },
              { label: "Asset Description", value: profile.details.description },
              { label: "Enterprise", value: asset.enterprise, always: true },
              { label: "Plant", value: asset.plant, always: true },
              { label: "Location / Area", value: asset.area, always: true },
              { label: "Department", value: asset.department },
              { label: "Manufacturer", value: asset.manufacturer },
              { label: "Model", value: asset.model },
              { label: "Serial Number", value: asset.serial },
              {
                label: "Rated Capacity",
                value: profile.technical.capacity ? `${profile.technical.capacity} ${profile.technical.capacityUnit}` : "",
              },
              {
                label: "Rated Voltage",
                note: "(Primary/Secondary)",
                value: `${profile.technical.primaryVoltage} ${profile.technical.primaryVoltageUnit} / ${profile.technical.secondaryVoltage} ${profile.technical.secondaryVoltageUnit}`,
              },
              { label: "Installation Date", value: asset.installed },
              { label: "Asset Criticality", value: asset.criticality, always: true },
              {
                label: "Warranty Period",
                value: profile.operational.warranty
                  ? `${profile.operational.warranty} ${profile.operational.warrantyUnit}`
                  : "",
              },
            ]}
          />
        </DetailPanel>

        {/* ---------- The code that gets stuck on the panel door ---------- */}
        <DetailPanel icon={QrCode} title="Asset ID & QR Code">
          <AssetQrPanel asset={asset} />
        </DetailPanel>

        {/* ---------- What to do with it ---------- */}
        <div className="space-y-3">
          <div className="rounded-lg bg-healthy-soft p-3 ring-1 ring-healthy/20">
            <h4 className="mb-1.5 flex items-center gap-2 text-base font-semibold">
              <Lightbulb className="size-5 text-healthy" /> How to use it
            </h4>
            <ul className="ml-4 list-disc space-y-1 text-sm text-foreground/80">
              <li>Scan the QR code from the EVITA app, or any scanner.</li>
              <li>Print the label and fix it to the panel door or the asset itself.</li>
              <li>Tap the Asset ID to open the full asset record.</li>
              <li>The record syncs to the central server for inspection and maintenance planning.</li>
            </ul>
          </div>

          <DetailPanel title="QR Code Label Preview">
            <QrLabelPreview asset={asset} />
          </DetailPanel>

          <CheckList
            title="Submission Checklist"
            items={[
              { label: <>Asset ID generated — <strong className="font-semibold">{asset.id}</strong></>, done: true },
              { label: "Asset details completed", done: true },
              { label: "Technical details completed", done: true },
              { label: "Images uploaded", done: profile.images.length > 0 },
              { label: "Required documents uploaded", done: profile.documents.length > 0 },
              { label: "Information reviewed and submitted", done: true },
            ]}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={onRestart}>
          <ArrowLeft /> Onboard another asset
        </Button>
        <Button onClick={onDone} className="min-w-32">
          Done <Check />
        </Button>
      </div>
    </div>
  )
}
