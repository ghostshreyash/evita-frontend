/** Shared shapes for the two activity-details screens */

export type EvidenceItem = {
  id: string
  /** `thermal` renders differently so a TIC capture is never mistaken for a photo */
  kind: "photo" | "thermal" | "document"
  label: string
  caption: string
  /** Size for a document, capture time for an image */
  meta: string
  /** EVITA: the captured image itself, for a preview on the tablet (not sent to the API) */
  src?: string
}

export type TimelineStep = { step: string; at?: string; note?: string }
