import { useEffect, useMemo, useRef, useState } from "react"
import { Camera, CameraOff, ImageUp, Loader2, QrCode, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScanResult } from "@/components/assets/scan-result"
import { useAssetRows } from "@/data/asset-store"
import { decodeQr, decodeQrFile, usingNativeDetector } from "@/lib/qr-decode"

/**
 * Scan an asset's QR label with the tablet's rear camera, or type the Digital
 * Asset ID / tag when the label is damaged or the camera is unavailable.
 *
 * The code is answered here rather than navigated away from: a scan is the
 * question "is this the right asset?", so the dialog turns into the answer —
 * the asset in brief, with Start Inspection under it. Nothing is opened or
 * started until the engineer has read it back.
 *
 * Mounted fresh each time it opens, so the camera state starts over.
 * The camera needs HTTPS (or localhost) and the user's permission; when either
 * is missing the manual entry is all that shows.
 */
export function ScanQrDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const register = useAssetRows()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [camera, setCamera] = useState<"starting" | "live" | "blocked" | "unsupported">("starting")
  const [code, setCode] = useState("")
  /** The code being answered; null while the camera is still looking */
  const [read, setRead] = useState<string | null>(null)
  /** A picked picture is being read */
  const [reading, setReading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  /** A label can carry the Digital Asset ID, the plant's own tag, or the name */
  const found = useMemo(() => {
    if (!read) return undefined
    const value = read.trim().toLowerCase()
    return register.find((a) => [a.id, a.tag, a.name].some((v) => v.toLowerCase() === value))
  }, [register, read])

  /** A label may encode a URL ending in the asset ID, or the ID on its own */
  const answer = (raw: string) => {
    const value = raw.trim().split("/").pop()?.trim() ?? ""
    if (!value) return false
    setRead(value)
    return true
  }

  useEffect(() => {
    // The camera runs only while the dialog is still asking
    if (!open || read) return
    let stream: MediaStream | undefined
    let timer: number | undefined
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("unsupported")
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        if (cancelled || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCamera("live")
        const scan = async () => {
          const video = videoRef.current
          if (cancelled || !video) return
          try {
            const found = await decodeQr(video, {
              width: video.videoWidth,
              height: video.videoHeight,
            })
            if (found && answer(found)) return
          } catch {
            // A frame that cannot be read yet; try the next one
          }
          // jsQR reads every pixel itself, so it is given a little more room
          timer = window.setTimeout(scan, usingNativeDetector ? 350 : 500)
        }
        scan()
      } catch {
        if (!cancelled) setCamera("blocked")
      }
    }

    start()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // The camera starts once per opening; `answer` only records what was read
  }, [open, read])

  const retry = () => {
    setRead(null)
    setCode("")
    setCamera("starting")
  }

  /**
   * Read a label out of a picture instead of off the camera.
   *
   * A photograph of a panel door answers the same question a live scan does,
   * and it is the only way to exercise the scan path on a machine with no
   * camera - or in a browser whose own detector is missing.
   */
  const pickImage = async (file?: File) => {
    if (!file) return
    setReading(true)
    try {
      const found = await decodeQrFile(file)
      if (!found) {
        toast.error("No QR code could be read in that picture.")
        return
      }
      answer(found)
    } catch {
      toast.error("That file could not be read as an image.")
    } finally {
      setReading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <QrCode className="size-5 text-primary" /> {read ? "Scanned" : "Scan Asset QR"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {read ? "Check this is the asset in front of you." : "Point the camera at the QR label on the asset."}
          </DialogDescription>
        </DialogHeader>

        {read ? (
          <ScanResult code={read} asset={found} onClose={() => onOpenChange(false)} onRetry={retry} />
        ) : (
          <>
            {/* Reads a label out of a picture - the same decoder the camera
                uses, so what works here works on the panel door */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                void pickImage(event.target.files?.[0])
                event.target.value = ""
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={reading}
              onClick={() => fileRef.current?.click()}
            >
              {reading ? <Loader2 className="animate-spin" /> : <ImageUp />}
              {reading ? "Reading the picture…" : "Upload a QR image"}
            </Button>

            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-navy">
              <video ref={videoRef} playsInline muted className="size-full object-cover" hidden={camera !== "live"} />
              {camera === "live" ? (
                <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="size-48 rounded-2xl border-4 border-white/85 shadow-[0_0_0_9999px_rgba(11,31,68,0.45)]" />
                </div>
              ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 px-6 text-center text-white/85">
                  {camera === "starting" ? <Camera className="size-10 animate-pulse" /> : <CameraOff className="size-10" />}
                  <p className="text-sm">
                    {camera === "starting"
                      ? "Starting the camera…"
                      : camera === "blocked"
                        ? "Camera access was refused. Allow it in Chrome's site settings, or enter the ID below."
                        : "No camera on this device. Upload a picture of the label above, or enter the Asset ID below."}
                  </p>
                </div>
              )}
            </div>

            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                answer(code)
              }}
            >
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Digital Asset ID or tag, e.g. LYB-PIT-TRF-001"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                aria-label="Asset ID or tag"
              />
              <Button type="submit" disabled={!code.trim()}>
                <Search /> Find
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
