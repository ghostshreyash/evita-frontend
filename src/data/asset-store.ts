import { useEffect, useSyncExternalStore } from "react"

import type { AssetProfile, AssetRecord } from "@/data/asset-data"
import {
  createAsset as createAssetApi,
  fetchAsset,
  fetchAssets,
  toProfile,
  toRecord,
  updateAssetApi,
  type ServerAsset,
} from "@/lib/api/assets"
import type { AssetFormValues } from "@/pages/assets/schemas"

/**
 * One copy of the asset register, shared by the list, the onboarding wizard and
 * the detail screen so an asset registered on this tablet shows up everywhere
 * at once.
 *
 * The rows come from the EVITA backend. This is the cache in front of it: the
 * register is fetched once and then kept in step as assets are registered and
 * corrected, so a screen reads it synchronously the way it always has and only
 * the screens that need to show progress ask for `status`.
 *
 * Profiles are kept beside the rows rather than inside them. The list only
 * needs the row; the detail screen needs everything onboarding captured, and
 * fetching that per asset keeps the list response small.
 */

type Status = "idle" | "loading" | "ready" | "error"

let rows: AssetRecord[] = []
let status: Status = "idle"
let error: string | undefined
/** Full profiles, by Digital Asset ID, for assets whose detail has been read */
let profiles: Record<string, AssetProfile> = {}
/** The files picked during onboarding, so the detail screen can show them back
 *  without waiting for the round trip to the server they were just sent to */
let captures: Record<string, { images: Record<string, File | undefined>; documents: Record<string, File | undefined> }> = {}

/** A new object each time, so `useSyncExternalStore` sees the change */
type Snapshot = { rows: AssetRecord[]; status: Status; error?: string }
let snapshot: Snapshot = { rows, status, error }

const listeners = new Set<() => void>()
const emit = () => {
  snapshot = { rows, status, error }
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

const getSnapshot = () => snapshot

/** Remember one asset's full record, from whichever call returned it */
const remember = (asset: ServerAsset) => {
  const record = toRecord(asset)
  profiles = { ...profiles, [record.id]: toProfile(asset) }
  rows = [record, ...rows.filter((r) => r.id !== record.id)]
  return record
}

/**
 * Load the register, once.
 *
 * Guarded rather than reference-counted: every screen that shows assets calls
 * `useAssets()`, and the first one through does the fetch.
 */
export async function loadAssets(force = false) {
  if (!force && (status === "loading" || status === "ready")) return
  status = "loading"
  error = undefined
  emit()

  try {
    const { rows: loaded } = await fetchAssets()
    rows = loaded
    status = "ready"
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Could not load the asset register"
    status = "error"
  }
  emit()
}

/**
 * The register, with how it is getting on.
 *
 * Screens that render a list use this; the ones that only read a row already
 * loaded can keep using `useAssetRows`.
 */
export function useAssets() {
  const state = useSyncExternalStore(subscribe, getSnapshot)
  useEffect(() => {
    void loadAssets()
  }, [])
  return state
}

/** The rows alone - the shape every screen read before the API existed */
export function useAssetRows() {
  return useAssets().rows
}

export const findAsset = (id?: string) => (id ? rows.find((r) => r.id === id) : undefined)

/**
 * The profile behind one asset: everything onboarding captured.
 *
 * Undefined until the asset's detail has been read, which `useAssetProfile`
 * does. The list never needs it.
 */
export const profileOf = (asset: AssetRecord): AssetProfile | undefined => profiles[asset.id]

/** The photographs and documents uploaded for one asset in this session */
export const capturesOf = (id: string) => captures[id]

/**
 * One asset in full, fetched on demand.
 *
 * The register row arrives with the list, but the specification, the
 * photographs and the documents do not - so the detail screen asks for them.
 */
export function useAssetProfile(id?: string) {
  const state = useAssets()
  const profile = id ? profiles[id] : undefined

  useEffect(() => {
    if (!id || profiles[id]) return
    let cancelled = false
    void fetchAsset(id)
      .then((asset) => {
        if (cancelled) return
        remember(asset)
        emit()
      })
      .catch(() => {
        // The row may simply not exist; the screen already handles that
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return { profile, status: state.status, error: state.error }
}

/**
 * Register a new asset from what the wizard collected.
 *
 * The Digital Asset ID is issued by the server, not built here - it has to be
 * unique across every tablet working the site, which only the server can
 * guarantee. The finished record is what the Asset ID & QR screen is built from.
 */
export async function onboardAsset(values: AssetFormValues): Promise<AssetRecord> {
  const asset = await createAssetApi(values)
  const record = remember(asset)
  captures = { ...captures, [record.id]: capturesFrom(values) }
  emit()
  return record
}

/** The picked files, keyed by upload, for the detail screen to show back at once */
const capturesFrom = (values: AssetFormValues) => ({
  images: Object.fromEntries((values.images ?? []).map((i) => [i.id, i.file])),
  documents: Object.fromEntries((values.documents ?? []).map((d) => [d.id, d.file])),
})

/**
 * What the wizard would have collected for an asset already on the register,
 * so it can be reopened and corrected.
 *
 * The specification is stored by label - that is the shape the detail screens
 * read - so it is resolved back against the type's parameter list by the caller,
 * which is the only place that knows what the type asks for.
 */
export function valuesFrom(profile: AssetProfile, keyFor: (label: string) => string | undefined): AssetFormValues {
  const parameters: Record<string, string> = {}
  for (const answer of profile.parameters) {
    const key = keyFor(answer.label)
    if (key) parameters[key] = answer.value
  }
  return {
    ...profile.details,
    parameters,
    images: profile.images.map((i) => ({ id: i.id, name: i.name })),
    documents: profile.documents.map((d) => ({ id: d.id, name: d.name })),
  }
}

/**
 * Correct an asset already on the register.
 *
 * The Digital Asset ID is not reissued. It encodes the enterprise, the site and
 * the type, but it is also printed on the label stuck to the panel door and
 * quoted by every inspection taken against the asset - so it is issued once and
 * then belongs to the asset, whatever is corrected about it afterwards.
 */
export async function updateAsset(id: string, values: AssetFormValues): Promise<AssetRecord> {
  const asset = await updateAssetApi(id, values, profiles[id])
  const record = remember(asset)
  captures = { ...captures, [id]: capturesFrom(values) }
  emit()
  return record
}
