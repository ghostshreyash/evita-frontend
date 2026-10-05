import { useRef } from "react"
import { Camera, Thermometer } from "lucide-react"
import { cn } from "cn"

import type { EvidenceItem } from "@/data/evidence"
import { stampNow } from "@/data/persist"

/**
 * A large tile that opens the tablet's rear camera (or the gallery) and turns
 * each picture into an evidence item.
 *
 * Thermal images come from the thermal camera's own app (browsers cannot drive
 * FLIR / Hikmicro cameras), so the thermal tile picks a saved image instead of
 * opening the camera.
 */
export function CaptureTile({
  kind,
  label,
  onCapture,
  className,
}: {
  kind: "photo" | "thermal"
  label: string
  onCapture: (items: EvidenceItem[]) => void
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const Icon = kind === "thermal" ? Thermometer : Camera

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className={cn(
          "flex min-h-28 w-40 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-primary/40 bg-info-soft/40 px-3 text-center text-primary transition-colors hover:bg-info-soft active:bg-info-soft",
          className
        )}
      >
        <Icon className="size-7" />
        <span className="text-sm leading-tight font-semibold">{label}</span>
        <span className="text-xs text-muted-foreground">{kind === "thermal" ? "Choose TIC image" : "Tap to capture"}</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        // The rear camera for site photos; thermal captures come from the gallery
        {...(kind === "photo" ? { capture: "environment" as const } : {})}
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ""
          if (!files.length) return
          const at = stampNow()
          onCapture(
            files.map((file, i) => ({
              id: `${kind}-${Date.now()}-${i}`,
              kind,
              label: kind === "thermal" ? "Thermal image" : "Site photo",
              caption: file.name,
              meta: at,
              src: URL.createObjectURL(file),
            }))
          )
        }}
      />
    </>
  )
}
