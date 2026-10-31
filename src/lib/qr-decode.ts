import jsQR from "jsqr"

/**
 * Reading a QR code, however the browser lets us.
 *
 * Chrome on Android ships `BarcodeDetector`, which is hardware-accelerated and
 * the right thing to use on the tablets EVITA runs on. Windows Chrome, Firefox
 * and iOS Safari do not ship it at all, and on those the dialog used to say the
 * browser could not scan - which also meant the scan path could not be tested
 * anywhere but on a device.
 *
 * jsQR is the fallback: slower, but pure JavaScript and everywhere. The same
 * two paths read a frame off the camera and a picture off the tablet, so what
 * is tested with an uploaded image is what runs against the panel door.
 */

type Detector = { detect: (source: CanvasImageSource | Blob) => Promise<{ rawValue: string }[]> }
type DetectorCtor = new (options?: { formats?: string[] }) => Detector

const BarcodeDetectorImpl = (globalThis as unknown as { BarcodeDetector?: DetectorCtor })
  .BarcodeDetector

/** Whether the browser can read a code at all. jsQR means the answer is always yes. */
export const canDecodeQr = true

/** True when the browser's own detector is doing the work rather than jsQR */
export const usingNativeDetector = Boolean(BarcodeDetectorImpl)

let native: Detector | undefined
const nativeDetector = () => {
  if (!BarcodeDetectorImpl) return undefined
  native ??= new BarcodeDetectorImpl({ formats: ["qr_code"] })
  return native
}

/** One reusable canvas - jsQR needs pixels, and allocating per frame is wasteful */
let canvas: HTMLCanvasElement | undefined
const pixelsOf = (source: CanvasImageSource, width: number, height: number) => {
  canvas ??= document.createElement("canvas")
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return undefined
  context.drawImage(source, 0, 0, width, height)
  return context.getImageData(0, 0, width, height)
}

/**
 * The text in the first QR code found, or undefined.
 *
 * @param source A video frame, an image, or a canvas.
 * @param size Its intrinsic dimensions, which a video does not carry on itself.
 */
export async function decodeQr(
  source: CanvasImageSource,
  size: { width: number; height: number },
): Promise<string | undefined> {
  if (size.width === 0 || size.height === 0) return undefined

  const detector = nativeDetector()
  if (detector) {
    try {
      const [hit] = await detector.detect(source)
      if (hit?.rawValue) return hit.rawValue
    } catch {
      // Fall through to jsQR - a detector that throws is no worse than none
    }
  }

  const pixels = pixelsOf(source, size.width, size.height)
  if (!pixels) return undefined

  // Codes printed on a panel door are read at an angle and in poor light, so
  // both inversions are tried rather than only the usual dark-on-light.
  return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" })?.data
}

/**
 * The text in the first QR code in a picture the engineer picked.
 *
 * @param file An image file.
 * @returns The decoded text, or undefined when the picture holds no code.
 */
export async function decodeQrFile(file: File): Promise<string | undefined> {
  const bitmap = await createImageBitmap(file)
  try {
    return await decodeQr(bitmap, { width: bitmap.width, height: bitmap.height })
  } finally {
    bitmap.close()
  }
}
