/**
 * The mock EVITA server for the asset register.
 *
 * This branch has no backend, so this module is the server: it answers out of
 * `src/data`, holds what the wizard registers for the life of the tab, and
 * issues the Digital Asset ID the way the real one does.
 *
 * It still speaks the **server's** shapes - `ServerAsset`, `ServerParamSpec` -
 * and still leaves `toRecord` / `toProfile` the translating to do. That is
 * deliberate. The alternative is to return the screens' own types and change
 * `data/asset-store.ts` with them, which would spread this branch's difference
 * from `main` across the files most likely to be edited there. Keeping the seam
 * exactly where the real client put it means a rebase conflicts here and
 * nowhere else.
 *
 * What the mock does **not** do is pretend to be slow or unreliable. There is
 * one turn of the event loop per call, so the store's loading states are still
 * reached, and nothing fails at random: a demo that intermittently errors reads
 * as a bug in the app rather than as a simulation.
 */
import type { AssetCriticality } from "@/data/master-data"
import { assetProfileFor, assetRegister, buildAssetId, type AssetProfile, type AssetRecord } from "@/data/asset-data"
import { parametersFor, unitFor as sheetUnitFor, type ParamSpec } from "@/data/asset-parameters"
import { enterpriseRecords, profileFor } from "@/data/occ-tables"
import type { AssetFormValues } from "@/pages/assets/schemas"
import { ApiError, isSigningOut } from "@/lib/api/client"

/* ---------- What the server sends ---------- */

type Named = { name: string }

type ServerUpload = {
  id: string
  name: string
  originalName: string | null
  /** Null on this branch: a demo holds no files of its own - see `capturesOf` */
  fileUrl: string | null
  uploadedAt: string
}

/**
 * One asset as the API serves it.
 *
 * Trimmed to the fields `toRecord` and `toProfile` actually read. The real
 * response carries more - the QR reference, the cleaning schedule, the
 * nameplate identifiers - and inventing values for fields no screen opens
 * would be mock data nothing could ever contradict.
 */
export type ServerAsset = {
  digitalAssetId: string
  tag: string
  name: string
  description: string | null
  area: string
  category: Named
  enterprise: Named
  plant: Named | null
  department: Named | null
  subDepartment: Named | null
  criticality: string | null
  environment: string
  latitude: number | null
  longitude: number | null
  health: { score: number | null }
  parameters: { label: string; value: string; unit: string | null }[]
  images: ServerUpload[]
  documents: ServerUpload[]
  onboardedAt: string
}

/** One parameter the chosen asset type asks for, as the parameters endpoint gives it */
export type ServerParamSpec = {
  key: string
  label: string
  required: boolean
  kind: "number" | "text" | "choice"
  units: string[]
  options: string[]
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
 * screen in the app routes by.
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
    url: d.fileUrl ?? undefined,
  })),
  images: asset.images.map((i) => ({ id: i.id, name: i.name, url: i.fileUrl ?? undefined })),
})

/* ---------- The register the mock server holds ---------- */

/** `dd-MM-yyyy` back to the ISO the server would have sent */
const isoFromDmy = (d: string) => {
  const [dd, mm, yyyy] = d.split("-")
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd)).toISOString()
}

const numberOr = (value: string | undefined, fallback: number | null) => {
  if (!value?.trim()) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * The seeded register, in the server's own shape.
 *
 * Built off `assetRegister` and the profile each row reconstructs, so the list
 * and the detail screen agree without either being stored - the same property
 * the mock data has had all along.
 */
const seeded = (): ServerAsset[] =>
  assetRegister.map((row) => {
    const profile = assetProfileFor(row)
    const onboardedAt = isoFromDmy(row.onboarded)
    return {
      digitalAssetId: row.id,
      tag: row.tag,
      name: row.name,
      description: profile.details.description,
      area: row.area,
      category: { name: row.category },
      enterprise: { name: row.enterprise },
      plant: { name: row.plant },
      department: { name: row.department },
      subDepartment: { name: profile.details.subDepartment },
      criticality: row.criticality,
      environment: profile.details.environment,
      latitude: numberOr(profile.details.latitude, null),
      longitude: numberOr(profile.details.longitude, null),
      health: { score: row.health },
      parameters: profile.parameters.map((p) => ({ label: p.label, value: p.value, unit: p.unit ?? null })),
      images: profile.images.map((i) => ({
        id: i.id,
        name: i.name,
        originalName: null,
        fileUrl: null,
        uploadedAt: onboardedAt,
      })),
      documents: profile.documents.map((d) => ({
        id: d.id,
        name: d.name,
        originalName: d.file,
        fileUrl: null,
        uploadedAt: d.uploaded ? isoFromDmy(d.uploaded) : onboardedAt,
      })),
      onboardedAt,
    }
  })

/** The register for the life of the tab. An onboarding adds to it; a reload reseeds. */
const register: ServerAsset[] = seeded()

/** One turn of the event loop, so the store's loading state is still reached */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** The real client refuses to attach a token mid-sign-out; the mock refuses to answer */
function requireSession() {
  if (isSigningOut()) throw new ApiError("Signing out.", 401)
}

/* ---------- Reading ---------- */

/**
 * The whole register, newest first.
 *
 * The real call asks for one large page because the register screen filters,
 * sorts and pages on what it holds. There is nothing to page here, so the
 * ordering is all that is reproduced.
 */
export const fetchAssets = async () => {
  requireSession()
  await settle()
  const rows = [...register].sort((a, b) => b.onboardedAt.localeCompare(a.onboardedAt)).map(toRecord)
  return { rows }
}

/** One asset in full, by its Digital Asset ID */
export const fetchAsset = async (id: string): Promise<ServerAsset> => {
  requireSession()
  await settle()
  const asset = register.find((a) => a.digitalAssetId === id)
  if (!asset) throw new ApiError("That asset is not on the register.", 404)
  return asset
}

/** The sheet's specification for one parameter, as the endpoint gives it */
const toSpec = (spec: ParamSpec): ServerParamSpec => ({
  key: spec.key,
  label: spec.label,
  required: spec.required,
  kind: spec.kind,
  units: spec.units ? [...spec.units] : [],
  options: spec.options ? [...spec.options] : [],
})

/**
 * What step 2 must ask for this asset type, in the order the sheet gives it.
 *
 * Read from `data/asset-parameters.ts`, which is the client's sheet transcribed
 * - the same rows the real backend is seeded from, so the wizard asks for the
 * same things either way. A category the sheet has no row for falls back to its
 * Other row; `parametersFor` owns that rule and this does not second-guess it.
 */
export const fetchCategoryParameters = async (category: string) => {
  requireSession()
  await settle()
  return { name: category, parameters: parametersFor(category).map(toSpec) }
}

/* ---------- Writing ---------- */

/** The plant the wizard named, for the city the Digital Asset ID is built from */
function plantFor(enterprise: string, plant: string) {
  const house = enterpriseRecords.find((e) => e.name === enterprise)
  if (!house) return undefined
  const plants = profileFor(house).plants
  return plants.find((p) => p.name === plant) ?? plants[0]
}

/**
 * The specification as the server would store it: resolved against the asset
 * type's own parameter list, so only what that type asks for is kept, each with
 * the label and unit the sheet gives it.
 */
const parametersOf = (values: AssetFormValues) => {
  const answers = values.parameters ?? {}
  return parametersFor(values.category)
    .filter((spec) => answers[spec.key]?.trim())
    .map((spec) => ({
      label: spec.label,
      value: answers[spec.key].trim(),
      unit: sheetUnitFor(spec, answers) ?? null,
    }))
}

/**
 * The uploads as the server would answer with them.
 *
 * A picked file has no URL here - it never leaves the browser - so the name is
 * all that is recorded, and the detail screen shows the file itself back out of
 * `capturesOf`. An upload the record already held and that was not re-picked
 * keeps whatever the held profile knew about it.
 */
const uploadsOf = (
  values: AssetFormValues,
  kind: "images" | "documents",
  at: string,
  held?: AssetProfile,
): ServerUpload[] =>
  (values[kind] ?? []).map((upload) => {
    const previous = held?.[kind].find((u) => u.id === upload.id)
    return {
      id: upload.id,
      name: upload.name,
      originalName: upload.file?.name ?? heldFileName(previous),
      fileUrl: previous?.url ?? null,
      uploadedAt: at,
    }
  })

/** A held document remembers the file it came from; a held image does not */
const heldFileName = (held?: { name: string; file?: string }) => held?.file ?? null

/** What the wizard collected, in the shape the register holds */
function assetFrom(values: AssetFormValues, digitalAssetId: string, at: string, held?: AssetProfile): ServerAsset {
  const plant = plantFor(values.enterprise, values.plant)
  return {
    digitalAssetId,
    tag: values.tag,
    name: values.description?.trim() || values.tag,
    description: values.description?.trim() || null,
    area: values.area,
    category: { name: values.category },
    enterprise: { name: values.enterprise },
    plant: { name: values.plant },
    department: { name: values.department ?? "" },
    subDepartment: { name: values.subDepartment ?? "" },
    criticality: values.parameters?.criticality ?? "Medium",
    environment: values.environment,
    latitude: numberOr(values.latitude, numberOr(plant?.latitude, null)),
    longitude: numberOr(values.longitude, numberOr(plant?.longitude, null)),
    /*
     * No score: an asset is onboarded before it is inspected, and the register
     * reads a null score as "Onboarded" rather than as a health band. The
     * inspection raised alongside it is what eventually puts one here.
     */
    health: { score: null },
    parameters: parametersOf(values),
    images: uploadsOf(values, "images", at, held),
    documents: uploadsOf(values, "documents", at, held),
    onboardedAt: at,
  }
}

/**
 * Register a new asset.
 *
 * The Digital Asset ID is issued here rather than typed - enterprise, city and
 * category, with a running number inside that group - because it has to be
 * unique across every tablet working the site. That is the server's job, and on
 * this branch this is the server.
 */
export const createAsset = async (values: AssetFormValues): Promise<ServerAsset> => {
  requireSession()
  await settle()

  const plant = plantFor(values.enterprise, values.plant)
  if (!plant)
    throw new ApiError("That enterprise is not on the register.", 400, [
      { path: "enterprise", message: "Choose an enterprise you are posted to." },
    ])

  const digitalAssetId = buildAssetId({
    enterprise: values.enterprise,
    city: plant.city,
    category: values.category,
    existing: register.map(toRecord),
  })

  const asset = assetFrom(values, digitalAssetId, new Date().toISOString())
  register.unshift(asset)
  return asset
}

/**
 * Correct an asset already on the register.
 *
 * Its Digital Asset ID is not reissued: it is printed on the label stuck to the
 * panel door and quoted by every inspection taken against the asset, so it is
 * issued once and then belongs to the asset.
 */
export const updateAssetApi = async (
  id: string,
  values: AssetFormValues,
  held?: AssetProfile,
): Promise<ServerAsset> => {
  requireSession()
  await settle()

  const index = register.findIndex((a) => a.digitalAssetId === id)
  if (index < 0) throw new ApiError("That asset is not on the register.", 404)

  const existing = register[index]
  // The score belongs to the asset, not to the correction: an edit is not an inspection
  register[index] = { ...assetFrom(values, id, existing.onboardedAt, held), health: existing.health }
  return register[index]
}
