import { useEffect, useMemo } from "react"
import { Image as ImageIcon, ScanLine } from "lucide-react"
import { cn } from "cn"

/**
 * One asset photograph.
 *
 * Real captures do not exist yet — nothing has been through the camera step on a
 * tablet — so a slot with no file renders as a labelled placeholder rather than a
 * broken image. Pass a `file` and it shows the real picture, which is what the
 * onboarding wizard does with what the engineer has just uploaded.
 */
export function AssetPhoto({
  file,
  label,
  caption,
  className,
  glyphClassName,
}: {
  file?: File
  label?: string
  caption?: string
  className?: string
  glyphClassName?: string
}) {
  const url = useObjectUrl(file)

  if (url) {
    return <img src={url} alt={caption ?? label ?? "Asset photograph"} className={cn("size-full object-cover", className)} />
  }

  // Nameplate shots read differently from an elevation, so they carry their own glyph
  const Glyph = label?.toLowerCase().includes("nameplate") ? ScanLine : ImageIcon
  return (
    <div
      role="img"
      aria-label={caption ? `${label}: ${caption}` : (label ?? "Photograph pending")}
      className={cn(
        "flex size-full flex-col items-center justify-center gap-1 bg-linear-to-br from-muted to-info-soft text-center text-muted-foreground",
        className
      )}
    >
      <Glyph className={cn("size-7", glyphClassName)} />
      <span className="px-2 text-xs leading-tight">Photograph pending</span>
    </div>
  )
}

/**
 * Object URL for a picked file, revoked when the file changes or the component
 * unmounts. The URL is derived rather than held in state, so a new file renders
 * its picture in the same pass instead of one render later.
 */
function useObjectUrl(file?: File) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file])
  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  return url
}
