import { useMemo, useSyncExternalStore } from "react"

import {
  assetProfileFor,
  assetRegister,
  buildAssetId,
  type AssetProfile,
  type AssetRecord,
} from "@/data/asset-data"
import { healthBandFor, type AssetCriticality } from "@/data/master-data"
import { parametersFor, unitFor } from "@/data/asset-parameters"
/*
 * These two stores reference each other: registering an asset raises its
 * inspection, and finishing an inspection scores the asset. The cycle is safe
 * because neither call happens while the modules are evaluating - both are
 * inside functions - and `npx esbuild … && node` on every data module is the
 * check that keeps it that way. See the verifying section of CLAUDE.md.
 */
import { addInspectionForAsset } from "@/data/inspection-store"
import type { AssetFormValues } from "@/pages/assets/schemas"
import { useScope } from "@/lib/scope"

/**
 * One copy of the asset register, shared by the list, the onboarding wizard and
 * the detail screen so an asset registered on this tablet shows up everywhere at
 * once. Stands in for the query cache until these rows come from the API.
 *
 * An asset onboarded here keeps the profile the engineer actually typed, rather
 * than the seeded one the register generates — `profiles` holds those, and the
 * photographs they uploaded sit beside them in `captures` for the session.
 */

let rows: AssetRecord[] = assetRegister
/** Profiles for assets onboarded in this session, keyed by asset id */
let profiles: Record<string, AssetProfile> = {}
/** The files picked during onboarding, so the detail screen can show them back */
let captures: Record<string, { images: Record<string, File | undefined>; documents: Record<string, File | undefined> }> = {}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

/**
  * The register for the enterprise the engineer is working in.
  *
  * `rows` holds every posting's assets so an onboarding can join any of them;
  * the screens only ever see one enterprise at a time - see lib/scope.
  */
export function useAssetRows() {
  const all = useSyncExternalStore(subscribe, () => rows)
  const { enterprise } = useScope()
  return useMemo(() => all.filter((a) => a.enterprise === enterprise), [all, enterprise])
}


export const findAsset = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/**
 * The profile behind one asset: what was typed if it was onboarded here, and the
 * seeded reconstruction otherwise. Both shapes are identical, so the detail
 * screen never needs to know which it got.
 */
export const profileOf = (asset: AssetRecord) => profiles[asset.id] ?? assetProfileFor(asset)

/** The photographs and documents uploaded for one asset, if it was onboarded here */
export const capturesOf = (id: string) => captures[id]

/** `dd-MM-yyyy` for today — the stamp an onboarding records */
function today() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/**
 * Everything the wizard collected, in the shape the detail screens read.
 *
 * Built before the asset exists so the review step can render exactly what the
 * detail screen will, and reused by `onboardAsset` so the two can never drift.
 *
 * The specification is resolved against the asset type's own parameter list, so
 * only the parameters that type actually asks for are stored, each with the
 * label and unit the sheet gives it.
 */
export function profileFrom(values: AssetFormValues, dates: { onboarded: string }): AssetProfile {
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
    parameters: parametersFor(values.category)
      .filter((spec) => answers[spec.key]?.trim())
      .map((spec) => ({ label: spec.label, value: answers[spec.key].trim(), unit: unitFor(spec, answers) })),
    documents: (values.documents ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      file: d.file?.name ?? d.name,
      uploaded: dates.onboarded,
    })),
    images: (values.images ?? []).map((i) => ({ id: i.id, name: i.name })),
  }
}

/**
 * Register a new asset from what the wizard collected.
 *
 * The Asset ID is built here rather than typed — enterprise, plant, voltage
 * class and category, with a running number inside that group — so two assets
 * can never be handed the same one. Returns the finished record, which is what
 * the Asset ID & QR screen is built from.
 */
export function onboardAsset(
  values: AssetFormValues,
  site: { city: string },
  /** Who registered it, so the inspection it owes is raised in their name */
  by: string
): { record: AssetRecord; inspection: string } {
  const id = buildAssetId({
    enterprise: values.enterprise,
    city: site.city,
    category: values.category,
    existing: rows,
  })
  const onboarded = today()

  const record: AssetRecord = {
    id,
    tag: values.tag,
    name: values.description?.trim() || values.tag,
    category: values.category,
    area: values.area,
    plant: values.plant,
    enterprise: values.enterprise,
    department: values.department ?? "",
    // Criticality is the one parameter every asset type carries
    criticality: (values.parameters?.criticality ?? "Medium") as AssetCriticality,
    onboarded,
    // Never inspected, so there is no score to show yet - not a placeholder one
    health: null,
  }

  profiles = { ...profiles, [id]: profileFrom(values, { onboarded }) }

  captures = { ...captures, [id]: capturesFrom(values) }
  rows = [record, ...rows]
  emit()

  /*
   * A newly registered asset owes an inspection, so it gets one here and then.
   *
   * It is raised rather than started: the engineer has just finished typing a
   * nameplate and may be moving to the next panel, so the inspection goes on
   * the book as Open with Start against it. The id exists from this moment,
   * which is what lets the asset be found on the Inspections page rather than
   * only from the asset itself.
   */
  const inspection = addInspectionForAsset(record, by, { start: false })
  return { record, inspection }
}

/** The picked files, keyed by upload, for the detail screen to show back */
const capturesFrom = (values: AssetFormValues) => ({
  images: Object.fromEntries((values.images ?? []).map((i) => [i.id, i.file])),
  documents: Object.fromEntries((values.documents ?? []).map((d) => [d.id, d.file])),
})

/**
 * What the wizard would have collected for an asset already on the register,
 * so it can be reopened and corrected.
 *
 * The specification is stored by label rather than by key - that is the shape
 * the detail screens read - so it is resolved back against the type's own
 * parameter list here. A parameter the type no longer asks for simply drops.
 */
export function valuesFrom(asset: AssetRecord): AssetFormValues {
  const profile = profileOf(asset)
  const held = captures[asset.id]
  const parameters: Record<string, string> = {}
  for (const spec of parametersFor(profile.details.category)) {
    const answer = profile.parameters.find((p) => p.label === spec.label)
    if (answer) parameters[spec.key] = answer.value
  }
  return {
    ...profile.details,
    parameters,
    images: profile.images.map((i) => ({ id: i.id, name: i.name, file: held?.images[i.id] })),
    documents: profile.documents.map((d) => ({ id: d.id, name: d.name, file: held?.documents[d.id] })),
  }
}

/**
 * Correct an asset already on the register.
 *
 * The Asset ID is not reissued. It encodes the enterprise, the site and the
 * type, but it is also printed on the label stuck to the panel door and quoted
 * by every inspection taken against the asset - so it is issued once and then
 * belongs to the asset, whatever is corrected about it afterwards. The
 * onboarding date stays for the same reason: it records when the asset joined
 * the register, not when its record was last touched.
 */
export function updateAsset(id: string, values: AssetFormValues): AssetRecord | undefined {
  const existing = rows.find((r) => r.id === id)
  if (!existing) return undefined

  const record: AssetRecord = {
    ...existing,
    tag: values.tag,
    name: values.description?.trim() || values.tag,
    category: values.category,
    area: values.area,
    plant: values.plant,
    enterprise: values.enterprise,
    department: values.department ?? "",
    criticality: (values.parameters?.criticality ?? existing.criticality) as AssetCriticality,
  }

  profiles = { ...profiles, [id]: profileFrom(values, { onboarded: existing.onboarded }) }
  captures = { ...captures, [id]: capturesFrom(values) }
  rows = rows.map((r) => (r.id === id ? record : r))
  emit()
  return record
}

/**
 * The health an inspection left on an asset.
 *
 * The score belongs to the asset, not to the record that produced it: the
 * register, the reports and every card that reads a band are all asking the
 * asset, and until this was written they went on saying "not inspected yet"
 * about a panel that had just been inspected.
 */
export function setAssetHealth(id: string, health: number) {
  rows = rows.map((r) => (r.id === id ? { ...r, health } : r))
  emit()
}

/** Counts for the tiles above the register, recomputed as assets are added */
export const kpisFor = (list: readonly AssetRecord[]) => ({
  total: list.length,
  // Only scored assets land in a band; the unscored ones are the pending-sync tally
  healthy: list.filter((a) => a.health !== null && healthBandFor(a.health).tone === "healthy").length,
  attention: list.filter((a) => a.health !== null && healthBandFor(a.health).tone === "attention").length,
  critical: list.filter((a) => a.health !== null && healthBandFor(a.health).tone === "critical").length,
  categories: new Set(list.map((a) => a.category)).size,
})
