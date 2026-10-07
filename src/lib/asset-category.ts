import { assetCategories } from "@/data/master-data"

/**
 * The master category a job's asset name belongs to: "MCC - Unit 2" → MCC
 * (Motor Control Center). Job names use the short form the mockups show.
 */
export function categoryFor(assetName: string) {
  const prefix = assetName.split(" - ")[0].trim().toLowerCase()
  return (
    assetCategories.find((c) => c.toLowerCase() === prefix) ??
    assetCategories.find((c) => c.toLowerCase().startsWith(prefix)) ??
    assetCategories.find((c) => c.toLowerCase().includes(prefix)) ??
    "Other"
  )
}
