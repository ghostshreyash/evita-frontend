import { useSyncExternalStore } from "react"

import {
  assetProfileFor,
  assetRegister,
  buildAssetId,
  type AssetProfile,
  type AssetRecord,
} from "@/data/asset-data"
import { assetDocumentTypes, assetImageSlots, healthBandFor, type AssetCriticality } from "@/data/master-data"
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
 */
export function profileFrom(
  values: AssetFormValues,
  dates: { installed: string; onboarded: string }
): AssetProfile {
  return {
    details: {
      enterprise: values.enterprise,
      plant: values.plant,
      area: values.area,
      department: values.department,
      subDepartment: values.subDepartment ?? "",
      category: values.category,
      tag: values.tag,
      description: values.description ?? "",
      manufacturer: values.manufacturer ?? "",
      model: values.model ?? "",
      serial: values.serial ?? "",
      year: values.year ?? "",
      installed: dates.installed,
      criticality: values.criticality,
    },
    technical: {
      primaryVoltage: values.primaryVoltage,
      primaryVoltageUnit: values.primaryVoltageUnit,
      secondaryVoltage: values.secondaryVoltage,
      secondaryVoltageUnit: values.secondaryVoltageUnit,
      capacity: values.capacity,
      capacityUnit: values.capacityUnit,
      frequency: values.frequency,
      phase: values.phase,
      cooling: values.cooling,
      vectorGroup: values.vectorGroup ?? "",
      impedance: values.impedance ?? "",
      insulation: values.insulation ?? "",
      tapChanger: values.tapChanger ?? "",
      oilType: values.oilType ?? "",
    },
    operational: {
      condition: values.condition,
      commissioned: toDmy(values.commissioned),
      load: values.load ?? "",
      locationInPlant: values.locationInPlant,
      latitude: values.latitude ?? "",
      longitude: values.longitude ?? "",
      criticality: values.criticality,
      warranty: values.warranty ?? "",
      warrantyUnit: values.warrantyUnit ?? "",
      amc: values.amc ?? "",
      nextDue: toDmy(values.nextDue),
      remarks: values.remarks ?? "",
    },
    documents: assetDocumentTypes
      .filter((d) => values.documents?.[d.key])
      .map((d) => ({ type: d.label, file: values.documents[d.key]!.name, uploaded: dates.onboarded })),
    images: assetImageSlots
      .filter((s) => values.images?.[s.key])
      .map((s) => ({ slot: s.key, label: s.label, caption: `${values.tag} - ${s.label.toLowerCase()}` })),
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
    voltage: values.primaryVoltage,
    voltageUnit: values.primaryVoltageUnit,
    category: values.category,
    existing: rows,
  })
  const onboarded = today()
  const installed = toDmy(values.installed) || onboarded

  const record: AssetRecord = {
    id,
    tag: values.tag,
    name: values.description?.trim() || values.tag,
    category: values.category,
    area: values.area,
    plant: values.plant,
    enterprise: values.enterprise,
    department: values.department,
    criticality: values.criticality as AssetCriticality,
    manufacturer: values.manufacturer || "",
    model: values.model || "",
    serial: values.serial || "",
    year: Number(values.year) || new Date(Date.parse(values.installed || "") || Date.now()).getFullYear(),
    installed,
    onboarded,
    // Never inspected, so there is no score to show yet - not a placeholder one
    health: null,
    // Registered on the tablet; the next sync is what puts it on the server
    status: "pending_sync",
  }

  profiles = { ...profiles, [id]: profileFrom(values, { installed, onboarded }) }

  captures = { ...captures, [id]: { images: { ...values.images }, documents: { ...values.documents } } }
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
  pendingSync: list.filter((a) => a.status === "pending_sync").length,
  categories: new Set(list.map((a) => a.category)).size,
})
