/**
 * Who the engineer signing in is, on a branch with no Cognito and no API.
 *
 * On `main` this file merges two sources: Cognito's attributes for the name and
 * contact details, and the EVITA API's ELPREMAR record for the employee id and
 * the postings. Here there is one source - the mock register - and that is
 * actually the more useful arrangement for a demo: `useCurrentElpremar` matches
 * the signed-in user back onto `elpremarRecords` by id, so signing in as an
 * engineer on the roster gives you *their* day, their postings and their
 * register rather than a generic one.
 *
 * What is deliberately **not** reproduced is the gate. On `main` a Cognito
 * account with no ELPREMAR record is turned away, because the only proof
 * someone was onboarded is a row in the OCC database. There is no database
 * here, so there is nothing to check against and an unknown e-mail signs in as
 * the first engineer on the roster instead of being refused - a demo nobody can
 * open is not a demo.
 */
import { elpremarProfileFor, elpremarRecords, type ElpremarRecord } from "@/data/elpremar-data"
import type { AuthUser } from "./types"

/** Up to two letters for the avatar fallback */
function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

/**
 * The register entry as the session holds it.
 *
 * `id` is the ELP-xxxx employee id, which is what the rest of the app knows an
 * engineer by - `lib/me.ts` looks the full record back up with it. The contact
 * details come from the same generated profile the ELPREMAR screens show, so
 * the address a one-time code is "sent" to is the one on their record.
 */
function toAuthUser(record: ElpremarRecord): AuthUser {
  const profile = elpremarProfileFor(record)
  return {
    id: record.id,
    name: record.name,
    initials: initialsFor(record.name),
    role: "ELPREMAR",
    roles: ["ELPREMAR"],
    email: profile.account.email,
    mobile: `${profile.basic.phoneCode}${profile.basic.phone}`,
  }
}

/**
 * The engineer an identifier names, if it names one.
 *
 * Either the full work e-mail or the `firstname.lastname` in front of it, since
 * that is how the roster's addresses are built and typing the whole thing on a
 * tablet is a chore. Inactive engineers are passed over: an ELPREMAR is Active
 * or Inactive and an inactive one has no business signing in, so the lookup
 * behaves as the register says rather than letting a deactivated account
 * through on a name match.
 */
export function lookupAccount(identifier: string): AuthUser | undefined {
  const id = identifier.trim().toLowerCase()
  if (!id) return undefined

  const match = elpremarRecords
    .filter((e) => e.status === "active")
    .find((record) => {
      const email = elpremarProfileFor(record).account.email.toLowerCase()
      return email === id || email.split("@")[0] === id
    })

  return match ? toAuthUser(match) : undefined
}

/**
 * Who to sign in as, for an identifier that may name nobody.
 *
 * An address off the roster still gets in, as the first engineer on it. That is
 * the one place this branch is deliberately more permissive than `main`, where
 * an account with no ELPREMAR record behind it is refused - a demo whose front
 * door needs a seeded e-mail address is not much of a demo.
 */
export const accountFor = (identifier: string): AuthUser =>
  lookupAccount(identifier) ?? toAuthUser(elpremarRecords.find((e) => e.status === "active") ?? elpremarRecords[0])
