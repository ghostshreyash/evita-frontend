import { useMemo } from "react"

import { elpremarRecords } from "@/data/elpremar-data"
import { useAuth } from "@/lib/auth/context"

/**
 * The signed-in ELPREMAR's register entry: posting, department, certification.
 * Matched by name for the demo, falling back to the first of the roster.
 * TODO: comes from GET /me once the API exists.
 */
export function useCurrentElpremar() {
  const { user } = useAuth()
  return useMemo(() => elpremarRecords.find((e) => e.name === user?.name) ?? elpremarRecords[0], [user])
}
