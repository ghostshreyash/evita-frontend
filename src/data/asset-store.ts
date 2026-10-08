import { useSyncExternalStore } from "react"

import {
  assetProfileFor,
  assetRegister,
  buildAssetId,
  type AssetProfile,
  type AssetRecord,
} from "@/data/asset-data"
import { healthBandFor, type AssetCriticality } from "@/data/master-data"
import { parametersFor } from "@/data/asset-parameters"
import type { AssetFormValues } from "@/pages/assets/schemas"

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

export const useAssetRows = () => useSyncExternalStore(subscribe, () => rows)

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

/** `yyyy-MM-dd` from a date field back to the `dd-MM-yyyy` the register holds */
const toDmy = (iso?: string) => {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return y && m && d ? `${d}-${m}-${y}` : iso
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
      address: values.address ?? "",
      category: values.category,
      tag: values.tag,
      description: values.description ?? "",
    },
    parameters: parametersFor(values.category)
      .filter((spec) => answers[spec.key]?.trim())
      .map((spec) => ({ label: spec.label, value: answers[spec.key].trim(), unit: spec.unit })),
    operational: {
      operationalStatus: values.operationalStatus,
      condition: values.condition ?? "",
      commissioned: toDmy(values.commissioned),
      load: values.load ?? "",
      latitude: values.latitude ?? "",
      longitude: values.longitude ?? "",
      criticality: answers.criticality ?? "",
      warranty: values.warranty ?? "",
      warrantyUnit: values.warrantyUnit ?? "",
      amc: values.amc ?? "",
      nextDue: toDmy(values.nextDue),
      remarks: values.remarks ?? "",
    },
    documents: (values.documents ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      file: d.file.name,
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
export function onboardAsset(values: AssetFormValues, site: { city: string }): AssetRecord {
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

  captures = {
    ...captures,
    [id]: {
      images: Object.fromEntries((values.images ?? []).map((i) => [i.id, i.file])),
      documents: Object.fromEntries((values.documents ?? []).map((d) => [d.id, d.file])),
    },
  }
  rows = [record, ...rows]
  emit()
  return record
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
