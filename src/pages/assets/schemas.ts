import { z } from "zod"

import { required } from "@/lib/validation"

/**
 * Asset onboarding, as the four steps capture it.
 *
 * One schema for the whole wizard rather than four: the values live in a single
 * form so a step can be reopened without the later ones losing what was typed.
 * Each step validates only its own fields, through `stepFields` below.
 *
 * The electrical specification is NOT declared here. What an asset is asked for
 * depends on what it is - see data/asset-parameters.ts, transcribed from the
 * client's onboarding sheet - so step 2 stores its answers in `parameters`,
 * keyed by parameter, and validates them against that type's specification
 * through `missingParameters` rather than against a fixed list of fields.
 */

const file = z.custom<File>((v) => v instanceof File)

/**
 * One photograph or document, named by the engineer who captured it.
 *
 * The client confirmed on 07-10-2026 that what is available varies from asset to
 * asset, so there is no fixed set of slots to fill: an upload is a file plus
 * whatever the engineer calls it.
 */
/**
 * The one photograph every asset must carry, as the onboarding sheet asks.
 *
 * Held as a reserved id rather than as a name, so it keeps its slot however the
 * engineer names the rest and can never be duplicated or renamed away.
 */
export const FRONT_VIEW = "front-view"

const upload = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Give this upload a name").max(60, "Keep the name under 60 characters"),
  file,
})

export type AssetUpload = z.infer<typeof upload>

export const assetSchema = z.object({
  /* ---------- Step 1: Asset Details ---------- */
  enterprise: required("Enterprise"),
  plant: required("Plant"),
  /* Both optional: a retail enterprise has no such tree */
  department: z.string().optional(),
  subDepartment: z.string().optional(),
  /* Free text, not a list: whatever gets the next engineer to the asset */
  area: required("Location / Area").max(200, "Keep the location under 200 characters"),
  category: required("Asset Category"),
  tag: required("Asset Name").max(40, "Keep the name under 40 characters"),
  description: z.string().trim().max(200, "Keep the description under 200 characters").optional(),
  /* Defaults to the plant's coordinates; capturing them at the asset is optional */
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  /*
   * Step 2: Technical Details.
   *
   * The electrical specification, keyed by parameter. Which parameters apply and
   * which are mandatory comes from the asset type, so the shape cannot be fixed
   * here; `missingParameters` checks it against the type when the step is left.
   */
  parameters: z.record(z.string(), z.string()),

  /*
   * Operational status is mandatory per the client's answer, and the
   * commissioning date is the one date the parameter sheet keeps. Asset
   * condition, current load, warranty, AMC and the next general check are gone:
   * no OLIVINE document asks for them at onboarding.
   */
  operationalStatus: required("Operational status"),
  commissioned: z.string().optional(),

  /* ---------- Step 3: Images & Documents ---------- */
  /* The front view is mandatory, per the onboarding sheet's Asset Photograph.
     Everything beyond it is as much or as little as the asset has. */
  images: z.array(upload).refine((list) => list.some((u) => u.id === FRONT_VIEW), {
    message: "Add the front view photograph of the asset",
  }),
  documents: z.array(upload),
})

export type AssetFormValues = z.infer<typeof assetSchema>

/** Which fields each step owns, so a step validates only what it asked for */
export const stepFields: (keyof AssetFormValues)[][] = [
  [
    "enterprise", "plant", "department", "subDepartment", "area",
    "category", "tag", "description", "latitude", "longitude",
  ],
  ["parameters", "operationalStatus", "commissioned"],
  ["images", "documents"],
  [],
]

/** What step 3 is still waiting for; `complete` once the step can be left */
export function missingUploads(values: Pick<AssetFormValues, "images" | "documents">) {
  const images = values.images ?? []
  const documents = values.documents ?? []
  const unnamed = [...images, ...documents].filter((u) => !u.name.trim()).length
  const front = images.some((u) => u.id === FRONT_VIEW)
  return {
    front,
    images: images.length,
    documents: documents.length,
    unnamed,
    complete: front && unnamed === 0,
  }
}
