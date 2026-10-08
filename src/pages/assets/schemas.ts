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
const upload = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Give this upload a name").max(60, "Keep the name under 60 characters"),
  file,
})

export type AssetUpload = z.infer<typeof upload>

/** A number typed into a ratings box: digits with an optional decimal part */
const numeric = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, `${label} must be a number`)

const optionalNumeric = (label: string) => z.union([z.literal(""), numeric(label)]).optional()

export const assetSchema = z.object({
  /* ---------- Step 1: Asset Details ---------- */
  enterprise: required("Enterprise"),
  plant: required("Plant"),
  /* Both optional: a retail enterprise has no such tree */
  department: z.string().optional(),
  subDepartment: z.string().optional(),
  /* Free text - where in the plant to go and find it */
  address: z.string().trim().max(200, "Keep the address under 200 characters").optional(),
  area: required("Location / Area"),
  category: required("Asset Category"),
  tag: required("Asset Name").max(40, "Keep the name under 40 characters"),
  description: z.string().trim().max(200, "Keep the description under 200 characters").optional(),

  /*
   * Step 2: Technical Details.
   *
   * The electrical specification, keyed by parameter. Which parameters apply and
   * which are mandatory comes from the asset type, so the shape cannot be fixed
   * here; `missingParameters` checks it against the type when the step is left.
   */
  parameters: z.record(z.string(), z.string()),

  /** Mandatory, per the client's answer */
  operationalStatus: required("Operational status"),
  condition: required("Asset condition"),
  commissioned: z.string().optional(),
  load: optionalNumeric("Current load"),
  /* Defaults to the plant's coordinates; capturing them at the asset is optional */
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  warranty: optionalNumeric("Warranty period"),
  warrantyUnit: z.string().optional(),
  amc: z.string().optional(),
  nextDue: z.string().optional(),
  remarks: z.string().trim().max(200, "Keep remarks under 200 characters").optional(),

  /* ---------- Step 3: Images & Documents ---------- */
  /* At least one photograph: an asset record with no picture of the asset is
     of little use to the next engineer who has to find it. Documents are free. */
  images: z.array(upload).min(1, "Add at least one photograph of the asset"),
  documents: z.array(upload),
})

export type AssetFormValues = z.infer<typeof assetSchema>

/** Which fields each step owns, so a step validates only what it asked for */
export const stepFields: (keyof AssetFormValues)[][] = [
  [
    "enterprise", "plant", "department", "subDepartment", "address", "area",
    "category", "tag", "description",
  ],
  [
    "parameters",
    "operationalStatus", "condition", "commissioned", "load", "latitude", "longitude",
    "warranty", "warrantyUnit", "amc", "nextDue", "remarks",
  ],
  ["images", "documents"],
  [],
]

/** What step 3 is still waiting for; `complete` once the step can be left */
export function missingUploads(values: Pick<AssetFormValues, "images" | "documents">) {
  const images = values.images ?? []
  const documents = values.documents ?? []
  const unnamed = [...images, ...documents].filter((u) => !u.name.trim()).length
  return {
    images: images.length,
    documents: documents.length,
    unnamed,
    complete: images.length > 0 && unnamed === 0,
  }
}
