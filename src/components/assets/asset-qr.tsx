import { useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Check, Copy, Download, Printer } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import type { AssetRecord } from "@/data/asset-data"

/**
 * The QR code an asset is identified by in the field.
 *
 * It encodes the Asset ID and nothing else — a scanner that does not know EVITA
 * still reads something useful, and the app looks the id up rather than trusting
 * anything carried in the code. The Olivine emblem sits in the middle, which is
 * why the error correction is set to H: the image covers modules the reader has
 * to recover.
 */

const EMBLEM = "/brand/olivine-emblem.png"

export function AssetQrCode({ asset, size = 200, className }: { asset: AssetRecord; size?: number; className?: string }) {
  return (
    <QRCodeCanvas
      value={asset.id}
      size={size}
      level="H"
      marginSize={2}
      title={`QR code for asset ${asset.id}`}
      imageSettings={{ src: EMBLEM, height: Math.round(size * 0.2), width: Math.round(size * 0.2), excavate: true }}
      className={cn("h-auto max-w-full", className)}
    />
  )
}

/** The Asset ID with a copy button, as the mockup renders it */
export function AssetIdChip({ id, className }: { id: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Could not copy the Asset ID. Select and copy it by hand.")
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-info-soft px-2.5 py-1.5", className)}>
      <span className="font-semibold tracking-wide text-primary tabular-nums">{id}</span>
      <Button type="button" variant="ghost" size="icon-sm" onClick={copy} aria-label={`Copy asset ID ${id}`}>
        {copied ? <Check className="text-healthy" /> : <Copy />}
      </Button>
    </span>
  )
}

/**
 * The QR panel: the code itself, the id beneath it, and the two things a field
 * engineer does with it — save the image, or print the label for the panel door.
 */
export function AssetQrPanel({ asset }: { asset: AssetRecord }) {
  const holder = useRef<HTMLDivElement>(null)

  /** The rendered code as a PNG data URL, or nothing if the canvas has not painted */
  const png = () => holder.current?.querySelector("canvas")?.toDataURL("image/png")

  const download = () => {
    const url = png()
    if (!url) {
      toast.error("The QR code is still rendering. Try again in a moment.")
      return
    }
    const link = document.createElement("a")
    link.href = url
    link.download = `${asset.id}-qr.png`
    link.click()
  }

  const print = () => {
    const url = png()
    if (!url) {
      toast.error("The QR code is still rendering. Try again in a moment.")
      return
    }
    const sheet = window.open("", "_blank", "noopener,width=460,height=620")
    if (!sheet) {
      toast.error("Allow pop-ups for this site to print the label.")
      return
    }
    sheet.document.write(labelSheet(asset, url))
    sheet.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={holder} className="rounded-lg bg-white p-3 ring-1 ring-foreground/10">
        <AssetQrCode asset={asset} size={200} />
      </div>
      <AssetIdChip id={asset.id} />
      <p className="text-center text-sm text-muted-foreground">
        Scan this code, or tap the Asset ID, to open the full asset record.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={download}>
          <Download /> Download
        </Button>
        <Button type="button" variant="outline" onClick={print}>
          <Printer /> Print Label
        </Button>
      </div>
    </div>
  )
}

/** The printable panel-door label, as the mockup's QR Code Label Preview shows it */
export function QrLabelPreview({ asset }: { asset: AssetRecord }) {
  return (
    <div className="rounded-lg bg-card p-3 ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 border-b pb-2">
        <img src={EMBLEM} alt="" className="size-8 shrink-0" />
        <div className="min-w-0 text-xs leading-tight">
          <div className="font-bold text-brand-navy dark:text-foreground">OLIVINE GLOBAL SYSTEMS</div>
          <div className="text-muted-foreground">Reliable Today. Sustainable Tomorrow.</div>
        </div>
      </div>
      <div className="mt-2 flex items-start gap-3">
        <dl className="min-w-0 flex-1 space-y-1 text-xs">
          <div className="font-semibold">{asset.enterprise}</div>
          <div className="font-semibold">{asset.plant}</div>
          <Row label="Asset ID" value={asset.id} />
          <Row label="Category" value={asset.category} />
          <Row label="Location" value={asset.area} />
        </dl>
        <div className="shrink-0 text-center">
          <div className="rounded bg-white p-1 ring-1 ring-foreground/10">
            <AssetQrCode asset={asset} size={72} />
          </div>
          <div className="mt-1 text-[0.65rem] text-muted-foreground">Scan for details</div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 font-medium break-words">{value}</dd>
    </div>
  )
}

/** Self-contained markup for the print window; nothing from the app is available there */
function labelSheet(asset: AssetRecord, qr: string) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(asset.id)}</title><style>
  body{font:12px/1.4 system-ui,sans-serif;margin:0;padding:16px;display:flex;justify-content:center}
  .label{width:320px;border:1px solid #1b2a4a;border-radius:8px;padding:12px}
  h1{font-size:13px;margin:0;color:#1b2a4a}
  .sub{color:#666;font-size:10px;margin:0 0 8px;border-bottom:1px solid #ddd;padding-bottom:6px}
  .body{display:flex;gap:10px;align-items:flex-start}
  dl{margin:0;flex:1}
  dt{color:#666;font-size:10px}
  dd{margin:0 0 5px;font-weight:600}
  img{width:88px;height:88px}
  @media print{body{padding:0}}
  </style></head><body onload="window.print()">
  <div class="label">
    <h1>OLIVINE GLOBAL SYSTEMS</h1>
    <p class="sub">Reliable Today. Sustainable Tomorrow.</p>
    <div class="body">
      <dl>
        <dt>Enterprise</dt><dd>${esc(asset.enterprise)}</dd>
        <dt>Plant</dt><dd>${esc(asset.plant)}</dd>
        <dt>Asset ID</dt><dd>${esc(asset.id)}</dd>
        <dt>Category</dt><dd>${esc(asset.category)}</dd>
        <dt>Location</dt><dd>${esc(asset.area)}</dd>
      </dl>
      <img src="${qr}" alt="QR code for ${esc(asset.id)}">
    </div>
  </div></body></html>`
}
