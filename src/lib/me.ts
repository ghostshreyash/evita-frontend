import { useMemo } from "react"

import { elpremarRecords } from "@/data/elpremar-data"
import { useAuth } from "@/lib/auth/context"

/**
 * The signed-in ELPREMAR's register entry: posting, department, certification.
 *
 * Matched on the employee id the API returns - `user.id` is the ELP-xxxx the
 * register knows them by - and on the name for the seeded roster, which has no
 * real employee ids. Falls back to the first of the roster so the screens
 * always have a record to render.
 *
 * TODO: the rest of this comes from GET /api/v1/auth/me too. The call already
 * returns the designation and every active posting; this still reads the local
 * roster for the department, certification and the posting itself.
 */
export function useCurrentElpremar() {
  const { user } = useAuth()
  return useMemo(
    () =>
      elpremarRecords.find((e) => e.id === user?.id) ??
      elpremarRecords.find((e) => e.name === user?.name) ??
      elpremarRecords[0],
    [user]
  )
}
