/**
 * How often an asset is cleaned, and when its next cleaning falls due.
 *
 * From the client on 12-10-2026: the interval depends on where the asset
 * stands. A panel in a controlled, air-conditioned room goes twelve months
 * between cleanings; the same panel in an open, non-AC environment goes six,
 * because that is how fast dust and carbon build up on it. The environment is
 * therefore asked for at onboarding, and the schedule falls out of it rather
 * than being typed.
 *
 * The client also said the interval is defined per asset type as well as per
 * environment ("yeh different asset type ke liye defined kiya diya hai"). Only
 * the two general figures were given, so those are the defaults and `byType`
 * holds the exceptions as they arrive.
 */
import { parseDmy } from "@/data/asset-data"

export const installEnvironments = ["Controlled / AC", "Uncontrolled / non-AC"] as const

export type InstallEnvironment = (typeof installEnvironments)[number]

/** What each environment means on site, shown against the choice */
export const environmentNote: Record<InstallEnvironment, string> = {
  "Controlled / AC": "Air-conditioned room, enclosed and filtered",
  "Uncontrolled / non-AC": "Open, naturally ventilated or exposed to the yard",
}

/** Months between scheduled cleanings. The client's general figures. */
const defaultInterval: Record<InstallEnvironment, number> = {
  "Controlled / AC": 12,
  "Uncontrolled / non-AC": 6,
}

/**
 * Asset types the client has given their own interval for.
 *
 * TODO(olivine): the per-asset-type schedule sheet. Until it arrives every type
 * falls back to the two general figures above.
 */
const byType: Partial<Record<string, Partial<Record<InstallEnvironment, number>>>> = {}

/** Months between cleanings for this asset type in this environment */
export function cleaningIntervalMonths(category: string, environment: string): number {
  const env = (installEnvironments as readonly string[]).includes(environment)
    ? (environment as InstallEnvironment)
    : "Uncontrolled / non-AC"
  return byType[category]?.[env] ?? defaultInterval[env]
}

/**
 * When the next cleaning falls due, counted from the last one.
 *
 * `from` and the result are both dd-MM-yyyy, the format every date in the field
 * app is held in.
 */
export function nextCleaningDue(from: string, category: string, environment: string): string {
  const start = parseDmy(from)
  if (Number.isNaN(start.getTime())) return ""
  const due = new Date(start)
  due.setMonth(due.getMonth() + cleaningIntervalMonths(category, environment))
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(due.getDate())}-${p(due.getMonth() + 1)}-${due.getFullYear()}`
}

/**
 * How long until the next cleaning, in whole days. Negative once it is overdue.
 *
 * The client asked for the alert a week out ("3 minus 1 week"), which is what
 * `cleaningSoon` reads.
 */
export function daysUntil(due: string, today = new Date()): number | undefined {
  const when = parseDmy(due)
  if (Number.isNaN(when.getTime())) return undefined
  const day = 24 * 60 * 60 * 1000
  return Math.round((when.setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / day)
}

/** A week out is when the client wants it flagged */
export const CLEANING_NOTICE_DAYS = 7
