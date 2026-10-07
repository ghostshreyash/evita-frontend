import { z } from "zod"

import { required } from "@/lib/validation"

/**
 * Asset onboarding, as the four mockup steps capture it.
 *
 * One schema for the whole wizard rather than four: the values live in a single
 * form so a step can be reopened without the later ones losing what was typed.
 * Each step validates only its own fields, through `stepFields` below.
 *
 * Two fields appear twice in the mockups — Year of Manufacture and Asset
 * Criticality are on both step 1 and step 2. They are asked once here, on step
 * 1, and step 2 shows what was chosen rather than asking again.
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
  area: required("Location / Area"),
  department: required("Department"),
  /* Optional: retail enterprises are not organised into sub-departments */
  subDepartment: z.string().optional(),
  category: required("Asset Category"),
  tag: required("Asset Name / Tag ID").max(40, "Keep the tag under 40 characters"),
  description: z.string().trim().max(200, "Keep the description under 200 characters").optional(),
  manufacturer: z.string().optional(),
  model: z.string().trim().max(60).optional(),
  serial: z.string().trim().max(60).optional(),
  year: z.union([z.literal(""), z.string().regex(/^(19|20)\d{2}$/, "Enter a four-digit year")]).optional(),
  installed: z.string().optional(),
  criticality: required("Asset Criticality"),

  /*
   * Step 2: Technical Details.
   *
   * Which fields carry a * follows the approved mockup: the ratings a nameplate
   * always shows are mandatory, and the ones that only apply to some asset types
   * - vector group, impedance, insulation class, tap changer, oil type - are not.
   *
   * Note this is wider than the client's written answer, which named only eight
   * mandatory fields across the whole wizard and no rating among them. The
   * mockup is being followed here; if the answer governs instead, the six
   * ratings below and Asset Condition drop back to optional.
   */
  primaryVoltage: numeric("Rated voltage (primary)"),
  primaryVoltageUnit: required("Unit"),
  secondaryVoltage: numeric("Rated voltage (secondary)"),
  secondaryVoltageUnit: required("Unit"),
  capacity: numeric("Rated power / capacity"),
  capacityUnit: required("Unit"),
  frequency: required("Frequency"),
  phase: required("Phase"),
  cooling: required("Cooling type"),
  vectorGroup: z.string().optional(),
  impedance: optionalNumeric("Impedance"),
  insulation: z.string().optional(),
  tapChanger: z.string().optional(),
  oilType: z.string().optional(),

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
    "enterprise", "plant", "area", "department", "subDepartment", "category", "tag",
    "description", "manufacturer", "model", "serial", "year", "installed", "criticality",
  ],
  [
    "primaryVoltage", "primaryVoltageUnit", "secondaryVoltage", "secondaryVoltageUnit",
    "capacity", "capacityUnit", "frequency", "phase", "cooling", "vectorGroup",
    "impedance", "insulation", "tapChanger", "oilType",
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
