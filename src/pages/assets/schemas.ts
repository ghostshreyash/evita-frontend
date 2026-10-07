import { z } from "zod"

import { required } from "@/lib/validation"
import { assetDocumentTypes, assetImageSlots } from "@/data/master-data"

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
   * Only Operational Status is mandatory here. The client's answer lists the
   * mandatory fields exactly - Enterprise, Plant, Location/Area, Department,
   * Asset Category, Asset Tag/Name, Asset Criticality and Operational Status -
   * and no rating is among them, so a panel whose nameplate is unreadable can
   * still be registered and completed later.
   */
  primaryVoltage: optionalNumeric("Rated voltage (primary)"),
  primaryVoltageUnit: z.string().optional(),
  secondaryVoltage: optionalNumeric("Rated voltage (secondary)"),
  secondaryVoltageUnit: z.string().optional(),
  capacity: optionalNumeric("Rated power / capacity"),
  capacityUnit: z.string().optional(),
  frequency: z.string().optional(),
  phase: z.string().optional(),
  cooling: z.string().optional(),
  vectorGroup: z.string().optional(),
  impedance: optionalNumeric("Impedance"),
  insulation: z.string().optional(),
  tapChanger: z.string().optional(),
  oilType: z.string().optional(),

  /** Mandatory, per the client's answer */
  operationalStatus: required("Operational status"),
  condition: z.string().optional(),
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
  images: z.record(z.string(), file.optional()),
  documents: z.record(z.string(), file.optional()),
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

/** Image slots that must carry a photograph before step 3 can be left */
export const requiredImageSlots = assetImageSlots.filter((s) => s.required).map((s) => s.key)

/** Documents that must be attached before step 3 can be left */
export const requiredDocumentTypes = assetDocumentTypes.filter((d) => d.required).map((d) => d.key)

/** What step 3 is still waiting for; empty once the step is complete */
export function missingUploads(values: Pick<AssetFormValues, "images" | "documents">) {
  const images = requiredImageSlots.filter((key) => !values.images?.[key])
  const documents = requiredDocumentTypes.filter((key) => !values.documents?.[key])
  return { images, documents, complete: images.length === 0 && documents.length === 0 }
}
