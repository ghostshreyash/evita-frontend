import type { AssetCriticality } from "@/data/master-data"
import type { AssetProfile, AssetRecord } from "@/data/asset-data"
import type { AssetFormValues } from "@/pages/assets/schemas"
import { apiGet, apiGetEnvelope, apiSend, fileUrl } from "@/lib/api/client"

/**
 * The asset register, as the EVITA backend serves it.
 *
 * The server speaks in nested objects and ISO dates; the screens read flat
 * strings and `dd-MM-yyyy`. Both shapes already existed, so the translation
 * lives here rather than being spread through the pages - a screen should not
 * have to know which of the two it is holding.
 */

/* ---------- What the server sends ---------- */

type Named = { id: string; code?: string; name: string }

type ServerUpload = {
  id: string
  kind: "IMAGE" | "DOCUMENT"
  name: string
  fileUrl: string
  originalName: string | null
  mimeType: string | null
  sizeBytes: number | null
  uploadedAt: string
}

export type ServerAsset = {
  id: string
  digitalAssetId: string
  qrCodeRef: string | null
  tag: string
  name: string
  description: string | null
  area: string
  category: Named
  enterprise: Named & { shortName: string }
  plant: (Named & { city: string | null }) | null
  department: Named | null
  subDepartment: Named | null
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  criticality: string | null
  status: string | null
  environment: string
  latitude: number | null
  longitude: number | null
  health: { score: number | null; label: string; tone: string }
  cleaning: {
    intervalMonths: number
    lastCleanedAt: string | null
    nextCleaningDueAt: string
    daysRemaining: number | null
    isOverdue: boolean
    isDueSoon: boolean
  }
  parameters: { id: string; key: string; label: string; value: string; unit: string | null }[]
  images: ServerUpload[]
  documents: ServerUpload[]
  onboardedAt: string
}

export type AssetKpis = {
  total: number
  healthy: number
  attention: number
  critical: number
  onboarded: number
  categories: number
}

/** One parameter the chosen asset type asks for, as `/asset-categories/:id/parameters` gives it */
export type ServerParamSpec = {
  id: string
  key: string
  label: string
  required: boolean
  kind: "number" | "text" | "choice"
  unit: string | null
  units: string[]
  options: string[]
  sortOrder: number
}

/* ---------- Translating it ---------- */

/** ISO timestamp to the `dd-MM-yyyy` every date in the field app is held in */
const dmy = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/**
 * One register row.
 *
 * `id` is the Digital Asset ID rather than the database UUID: it is what the
 * label on the panel door carries, what the QR code encodes and what every
 * screen in the app routes by. The API accepts either, so the UUID is never
 * needed on this side.
 */
export const toRecord = (asset: ServerAsset): AssetRecord => ({
  id: asset.digitalAssetId,
  tag: asset.tag,
  name: asset.name,
  category: asset.category.name,
  area: asset.area,
  plant: asset.plant?.name ?? "",
  enterprise: asset.enterprise.name,
  department: asset.department?.name ?? "",
  criticality: (asset.criticality ?? "Medium") as AssetCriticality,
  onboarded: dmy(asset.onboardedAt),
  health: asset.health.score,
})

/** Everything onboarding captured, as the detail screen reads it */
export const toProfile = (asset: ServerAsset): AssetProfile => ({
  details: {
    enterprise: asset.enterprise.name,
    plant: asset.plant?.name ?? "",
    area: asset.area,
    department: asset.department?.name ?? "",
    subDepartment: asset.subDepartment?.name ?? "",
    category: asset.category.name,
    tag: asset.tag,
    description: asset.description ?? "",
    latitude: asset.latitude === null ? "" : String(asset.latitude),
    longitude: asset.longitude === null ? "" : String(asset.longitude),
    environment: asset.environment,
  },
  parameters: asset.parameters.map((p) => ({
    label: p.label,
    value: p.value,
    unit: p.unit ?? undefined,
  })),
  documents: asset.documents.map((d) => ({
    id: d.id,
    name: d.name,
    file: d.originalName ?? d.name,
    uploaded: dmy(d.uploadedAt),
    url: fileUrl(d.fileUrl),
  })),
  images: asset.images.map((i) => ({ id: i.id, name: i.name, url: fileUrl(i.fileUrl) })),
})

/* ---------- Reading ---------- */

/**
 * One page of the register.
 *
 * The register screen filters, sorts and pages on what it holds, so this asks
 * for as much as the API will give at once. `limit` is capped at 100 server
 * side - a plant with more assets than that needs the screen moved onto
 * server-side paging, which is a change to the screen rather than to this call.
 */
export const fetchAssets = async () => {
  const body = await apiGetEnvelope<{ data: ServerAsset[]; kpis: AssetKpis }>(
    "/assets?limit=100&sortBy=onboardedAt&sortOrder=desc",
  )
  return { rows: body.data.map(toRecord), assets: body.data, kpis: body.kpis }
}

/** One asset in full. Accepts the Digital Asset ID or the UUID. */
export const fetchAsset = (id: string) =>
  apiGet<ServerAsset>(`/assets/${encodeURIComponent(id)}`)

/** What step 2 must ask for this asset type, in the order the client's sheet gives it */
export const fetchCategoryParameters = (category: string) =>
  apiGet<{ id: string; code: string; name: string; parameters: ServerParamSpec[] }>(
    `/asset-categories/${encodeURIComponent(category)}/parameters`,
  )

/** The asset types the onboarding grid offers */
export const fetchCategories = () =>
  apiGet<{ id: string; code: string; name: string; shortCode: string; parameterCount: number }[]>(
    "/asset-categories",
  )

/* ---------- Writing ---------- */

/**
 * The wizard's values as `multipart/form-data`.
 *
 * Multipart rather than JSON because step 3 carries real files. The server
 * reads step 3 back from the indexed field names used here.
 *
 * An upload the record already holds has no `file` - it was captured on another
 * device, or in an earlier session - so its stored path is sent instead, which
 * is what the server expects when correcting an asset.
 */
const toFormData = (values: AssetFormValues, held?: AssetProfile) => {
  const form = new FormData()

  const put = (key: string, value?: string | null) => {
    if (value !== undefined && value !== null && value !== "") form.append(key, value)
  }

  put("enterprise", values.enterprise)
  put("plant", values.plant)
  put("department", values.department)
  put("subDepartment", values.subDepartment)
  put("area", values.area)
  put("category", values.category)
  put("tag", values.tag)
  put("description", values.description)
  put("environment", values.environment)

  // Both or neither: the server refuses half a position
  if (values.latitude && values.longitude) {
    put("latitude", values.latitude)
    put("longitude", values.longitude)
  }

  form.append("parameters", JSON.stringify(values.parameters ?? {}))

  const heldUrl = (id: string, kind: "images" | "documents") =>
    held?.[kind].find((u) => u.id === id)?.url

  const appendList = (kind: "images" | "documents") => {
    for (const [index, upload] of (values[kind] ?? []).entries()) {
      form.append(`${kind}[${index}][name]`, upload.name)
      if (upload.file) {
        form.append(`${kind}[${index}][file]`, upload.file)
        continue
      }
      // Already on the server: send back the path it was stored under
      const url = heldUrl(upload.id, kind)
      const stored = url?.replace(/^https?:\/\/[^/]+/, "")
      if (stored) form.append(`${kind}[${index}][file]`, stored)
    }
  }

  appendList("images")
  appendList("documents")

  return form
}

/** Register a new asset. The Digital Asset ID comes back from the server. */
export const createAsset = (values: AssetFormValues) =>
  apiSend<ServerAsset>("/assets", "POST", toFormData(values))

/** Correct an asset already on the register. Its Digital Asset ID is not reissued. */
export const updateAssetApi = (id: string, values: AssetFormValues, held?: AssetProfile) =>
  apiSend<ServerAsset>(`/assets/${encodeURIComponent(id)}`, "PATCH", toFormData(values, held))

/** Take an asset off the active register. Nothing is hard-deleted. */
export const deactivateAsset = (id: string) =>
  apiSend<{ id: string; digitalAssetId: string; tag: string }>(
    `/assets/${encodeURIComponent(id)}`,
    "DELETE",
  )
