import { useState } from "react"
import { FileText, Image as ImageIcon, Thermometer } from "lucide-react"
import { cn } from "cn"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { EvidenceItem, TimelineStep } from "@/data/evidence"

/** The building blocks both activity-details screens are made of */

/** A labelled value in a details grid */
export function Detail({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">{label}</div>
      <div className="mt-0.5 text-xs">{children}</div>
    </div>
  )
}

const tone = (kind: EvidenceItem["kind"]) =>
  kind === "thermal" ? "bg-linear-to-br from-info via-attention to-critical" : kind === "document" ? "bg-muted" : "bg-linear-to-br from-muted to-info-soft"

const Glyph = ({ kind, className }: { kind: EvidenceItem["kind"]; className?: string }) => {
  const Icon = kind === "thermal" ? Thermometer : kind === "document" ? FileText : ImageIcon
  return <Icon className={cn(kind === "thermal" ? "text-white/90" : "text-muted-foreground", className)} />
}

/**
 * Captured photos and TIC images as thumbnails with a larger preview, and any
 * documents beneath as a list. Images here are placeholder tiles — swap the
 * tinted block for an <img> once real captures are available.
 */
export function EvidenceGallery({ items, empty = "No evidence uploaded yet." }: { items: EvidenceItem[]; empty?: string }) {
  const [preview, setPreview] = useState<EvidenceItem | null>(null)
  const images = items.filter((e) => e.kind !== "document")
  const documents = items.filter((e) => e.kind === "document")

  if (!items.length) return <p className="py-3 text-center text-xs text-muted-foreground">{empty}</p>

  return (
    <>
      {images.length ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreview(item)}
              className="group/ev w-40 shrink-0 overflow-hidden rounded-lg text-left ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
            >
              <div className={cn("flex h-24 items-center justify-center", tone(item.kind))}>
                <Glyph kind={item.kind} className="size-7" />
              </div>
              <div className="p-2">
                <div className="flex items-center gap-1 text-[0.7rem] font-medium group-hover/ev:text-primary">
                  {item.kind === "thermal" ? <Thermometer className="size-3 shrink-0 text-critical" /> : null}
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="truncate text-[0.65rem] tabular-nums text-muted-foreground">{item.meta}</div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {documents.length ? (
        <ul className={cn("divide-y divide-foreground/10 text-xs", images.length && "mt-3")}>
          {documents.map((d) => (
            <li key={d.id} className="flex items-center gap-2 py-1.5 first:pt-0 last:pb-0">
              <FileText className="size-3.5 shrink-0 text-primary" />
              <button
                type="button"
                onClick={() => setPreview(d)}
                className="min-w-0 flex-1 truncate text-left font-medium hover:text-primary hover:underline"
              >
                {d.label}
              </button>
              <span className="shrink-0 text-[0.65rem] tabular-nums text-muted-foreground">{d.meta}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="sm:max-w-2xl!">
          <DialogHeader>
            <DialogTitle>{preview?.label}</DialogTitle>
            <DialogDescription>{preview?.caption} · {preview?.meta}</DialogDescription>
          </DialogHeader>
          <div className={cn("flex h-80 items-center justify-center rounded-lg ring-1 ring-foreground/10", preview && tone(preview.kind))}>
            {preview ? <Glyph kind={preview.kind} className="size-16" /> : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The lifecycle rail: steps without a timestamp have not happened yet */
export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol>
      {steps.map((t, i) => {
        const done = !!t.at
        return (
          <li key={t.step} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", done ? "bg-primary" : "bg-foreground/20")} />
              {i < steps.length - 1 ? <span className={cn("w-px flex-1", done ? "bg-primary/40" : "bg-foreground/10")} /> : null}
            </div>
            <div className={cn("min-w-0 pb-3", !done && "text-muted-foreground/70")}>
              <div className="text-xs font-medium">{t.step}</div>
              <div className="text-[0.65rem] tabular-nums text-muted-foreground">{t.at ?? "Pending"}</div>
              {t.note ? <div className="text-[0.65rem] text-muted-foreground">{t.note}</div> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
