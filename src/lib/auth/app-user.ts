/**
 * The signed-in engineer, and the check that they are one.
 *
 * Two sources, and the split matters:
 *
 * - **Cognito** carries the name, e-mail and mobile — attributes OCC wrote when
 *   it created the account.
 * - **The EVITA API** carries the ELPREMAR record: the employee id the field
 *   and the register both use, the designation, the postings.
 *
 * The API call is **not** best-effort here, and that is the difference from the
 * OCC console. EVITA is for ELPREMARs the control centre onboarded, and the only
 * thing that proves someone was onboarded is a record in the OCC database — the
 * Cognito role attribute is set at creation and would be just as true of an
 * account that reached the pool some other way. So a sign-in that cannot reach
 * the API, or that the API refuses, is not a sign-in. The backend enforces the
 * same rule on every later call; this is what turns it into a message the
 * engineer can act on rather than a screen full of failed requests.
 */
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from "aws-amplify/auth"

import { ApiError, apiFetch } from "@/lib/api/client"
import { AuthError, type AuthUser } from "./types"

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

/** What the Cognito attributes say about the person signing in */
async function cognitoProfile() {
  const [{ userId }, attrs] = await Promise.all([getCurrentUser(), fetchUserAttributes()])
  const name = attrs.name ?? attrs.email ?? "ELPREMAR"

  return {
    subject: userId,
    name,
    initials: initialsFor(name),
    email: attrs.email ?? "",
    mobile: attrs.phone_number ?? "",
  }
}

/**
 * The ELPREMAR record, as `GET /api/v1/auth/me` and `POST /api/v1/auth/session`
 * both answer it.
 *
 * `postings` is every active enterprise/plant assignment. An ELPREMAR is not
 * posted to one customer, so the tablet shows one posting at a time and scopes
 * its whole book of work to it — see the scope section in CLAUDE.md. Nothing
 * reads it yet; the register and the work book are still local mock data.
 */
type ElpremarRecord = {
  /** The employee id, e.g. "ELP-2009" */
  id: string
  userId: string
  email: string
  phone: string | null
  role: string
  roles: string[]
  designation: string | null
  elpremarRoles: string[]
  status: string
  postings: {
    enterpriseId: string
    enterpriseName: string
    plantId: string
    plantName: string
    departmentId: string | null
    departmentName: string | null
  }[]
}

/**
 * Ask the API who this is, and turn its refusals into something readable.
 *
 * A 403 is the authorisation answer — this Cognito account has no ELPREMAR
 * record, does not hold the role, or has been deactivated — and the backend's
 * own message says which, so it is passed straight through. Anything else is a
 * server or network problem, and must not read as "you are not an ELPREMAR".
 */
async function fetchElpremar(path: string, method: "GET" | "POST"): Promise<ElpremarRecord> {
  try {
    return await apiFetch<ElpremarRecord>(path, { method, timeoutMs: 15000 })
  } catch (e) {
    if (e instanceof ApiError && e.status === 403) throw new AuthError(e.message, "NotElpremar")
    if (e instanceof ApiError && e.status === 0)
      throw new AuthError(
        "Could not reach the EVITA server to confirm your account. Check the connection and try again.",
        "ApiUnreachable"
      )
    throw new AuthError(
      e instanceof ApiError ? e.message : "Could not confirm your account. Please try again.",
      "ProfileUnavailable"
    )
  }
}

/** Cognito's attributes with the ELPREMAR record laid over them */
function merge(cognito: Awaited<ReturnType<typeof cognitoProfile>>, record: ElpremarRecord): AuthUser {
  return {
    id: record.id,
    name: cognito.name,
    initials: cognito.initials,
    role: record.role,
    roles: record.roles,
    // The register's number is the one to show; Cognito's is the fallback
    email: record.email || cognito.email,
    mobile: record.phone ?? cognito.mobile,
  }
}

/**
 * Open the session. Called once, when the one-time code has been accepted.
 *
 * `POST /auth/session` stamps the sign-in and answers with the record. It
 * creates nothing — OCC's `/auth/sync` provisions a user from the token, and
 * EVITA deliberately has no equivalent.
 */
export async function openSession(): Promise<AuthUser> {
  const [cognito, record] = await Promise.all([
    cognitoProfile(),
    fetchElpremar("/auth/session", "POST"),
  ])
  return merge(cognito, record)
}

/**
 * The profile on boot, for a session Amplify still holds tokens for.
 *
 * Read from the API again rather than from the stored session, so an ELPREMAR
 * deactivated in OCC since they last opened the tablet is turned away at the
 * next launch instead of carrying on with a profile that was true yesterday.
 */
export async function resolveAppUser(): Promise<AuthUser> {
  const [cognito, record] = await Promise.all([cognitoProfile(), fetchElpremar("/auth/me", "GET")])
  return merge(cognito, record)
}

/** The session this tablet holds, or null when there is no usable one */
export async function hasCognitoSession(): Promise<boolean> {
  try {
    const session = await fetchAuthSession()
    return Boolean(session.tokens?.idToken)
  } catch {
    return false
  }
}
