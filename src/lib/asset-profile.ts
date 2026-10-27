import type { AssetProfile } from "@/data/asset-data"
import { unitFor, type ServerParamSpec } from "@/lib/api/use-category-parameters"
import type { AssetFormValues } from "@/pages/assets/schemas"

/**
 * Everything the wizard has collected, in the shape the detail screens read.
 *
 * Built on this side so the review step can render exactly what the detail
 * screen will, before the asset exists. Once it is registered the server
 * returns the stored record and that is what every screen reads instead - this
 * is only ever the preview.
 *
 * The specification is resolved against the asset type's own parameter list, so
 * only the parameters that type actually asks for appear, each with the label
 * and unit the client's sheet gives it.
 */
export function profileFrom(
  values: AssetFormValues,
  specs: ServerParamSpec[],
  onboarded: string,
): AssetProfile {
  const answers = values.parameters ?? {}

  return {
    details: {
      enterprise: values.enterprise,
      plant: values.plant,
      area: values.area,
      department: values.department ?? "",
      subDepartment: values.subDepartment ?? "",
      category: values.category,
      tag: values.tag,
      description: values.description ?? "",
      latitude: values.latitude ?? "",
      longitude: values.longitude ?? "",
      environment: values.environment,
    },
    parameters: specs
      .filter((spec) => answers[spec.key]?.trim())
      .map((spec) => ({
        label: spec.label,
        value: answers[spec.key].trim(),
        unit: unitFor(spec, answers),
      })),
    documents: (values.documents ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      file: d.file?.name ?? d.name,
      uploaded: onboarded,
    })),
    images: (values.images ?? []).map((i) => ({ id: i.id, name: i.name })),
  }
}

/** `dd-MM-yyyy` for today — the stamp an onboarding records */
export function today() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}
