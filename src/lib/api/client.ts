/**
 * The EVITA backend, as the tablet talks to it.
 *
 * Every call carries the Cognito access token as a bearer. Amplify refreshes
 * that token when it is close to expiry, so `accessToken()` is read per request
 * rather than captured once — a tablet left open all shift would otherwise send
 * a stale one.
 *
 * Nothing here sends a password, an OTP, the Cognito sub or a database id: the
 * backend reads identity from the verified token, and anything the client
 * asserted about itself would not be trustworthy anyway. The refresh token never
 * leaves Amplify's storage — only the access token is ever put on a request.
 *
 * Ported from occ-frontend's copy, with two differences: every response here is
 * unwrapped from the backend's `{ status, statusCode, message, data }` envelope,
 * and there is no sign-out call to make an exception for — EVITA's sign-out is
 * Amplify's alone.
 */
import { accessToken, refreshAccessToken } from "@/lib/auth/auth-service"

/*
 * Undefined means nobody configured an API; empty means "this origin", which is
 * how local work runs (the Vite proxy forwards /api and CORS never applies).
 * The two must stay distinguishable, so this does not collapse to a falsy test.
 */
const RAW = import.meta.env.VITE_API_URL as string | undefined
const BASE = RAW === undefined ? undefined : RAW.replace(/\/+$/, "")

/** A non-2xx response, carrying the status so callers can branch on 403 vs 401 */
export class ApiError extends Error {
  readonly status: number
  /** The parsed envelope, whose `details` holds per-field errors where there are any */
  readonly body: unknown

  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** False for endpoints reachable before sign-in */
  auth?: boolean
  /** False to accept a 401 as the answer instead of refreshing and retrying */
  retryOn401?: boolean
  /** Abort after this many ms, so a hung API cannot stall the caller */
  timeoutMs?: number
}

/** The envelope every route answers with */
type Envelope<T> = {
  status: "ok" | "error"
  statusCode: number
  message: string
  data?: T
  details?: unknown
}

/* ------------------------------------------------------------ sign-out -- */

/**
 * Whether a sign-out is in progress.
 *
 * Clearing the Cognito tokens is asynchronous, so for a short window the old
 * access token is still valid and still readable. Anything that starts a
 * request in that window would attach a token belonging to a session the
 * engineer has already ended. The flag is set synchronously at the top of the
 * sign-out so there is no gap between the tap and the block taking effect.
 *
 * It stays set until the next successful sign-in: once the tokens are gone
 * there is no session to authenticate against anyway, so refusing authenticated
 * calls is the correct answer right through to the new one.
 */
let signingOut = false

/**
 * Aborts the requests that were already in the air when sign-out began.
 *
 * Those have left the tablet, so this cannot un-send them — the server may
 * still act on them. What it does buy is that their responses are never applied
 * to a signed-out app. Replaced on each new session, because an aborted
 * controller stays aborted.
 */
let inFlight = new AbortController()

/** Blocks authenticated requests and cancels the ones already running */
export function beginSignOut() {
  signingOut = true
  inFlight.abort(new DOMException("Signed out", "AbortError"))
}

/** Reopens the client for a new session. Called when a sign-in completes. */
export function endSignOut() {
  signingOut = false
  inFlight = new AbortController()
}

/**
 * What to do when Cognito can no longer produce a token — the refresh token has
 * expired or been revoked, so the session is genuinely over.
 *
 * A module-level handler rather than a hook because `apiFetch` is called from
 * plain functions, not components. `AuthProvider` registers the real one on
 * mount; until then an expiry is only logged.
 */
let onSessionExpired: (() => void) | null = null

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler
}

function sessionExpired() {
  if (onSessionExpired) onSessionExpired()
  else console.warn("[api] session expired before a handler was registered.")
}

/**
 * Fetch against the EVITA API with the bearer token attached, unwrapped from
 * the response envelope.
 *
 * On a 401 the token is refreshed through Amplify and the request is retried
 * **once**. If the refresh itself fails the session is over and the expiry
 * handler signs the engineer out; if the retry comes back 401 with a freshly
 * minted token, that is the backend's own decision and is reported as a normal
 * `ApiError` — signing someone out over it would log them out of an app they
 * are legitimately signed in to.
 *
 * Throws `ApiError` on a non-2xx so callers can branch on `status`; a network
 * failure throws status 0, which is how "backend not running" shows up.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (BASE === undefined) throw new ApiError(0, "VITE_API_URL is not set for this environment.")

  const { body, headers, auth = true, retryOn401 = true, timeoutMs, ...rest } = options

  /*
   * Checked before the token is read, and again after — `accessToken()` awaits,
   * and a sign-out starting in that gap would otherwise hand this request a
   * bearer from the session that was just ended.
   */
  const blocked = () => auth && signingOut
  if (blocked()) throw new ApiError(401, "Signing out.")

  const send = async (token: string | null) => {
    const signals: AbortSignal[] = []
    if (timeoutMs) signals.push(AbortSignal.timeout(timeoutMs))
    /*
     * Only authenticated calls. An unauthenticated one carries no token, so it
     * has nothing to leak — and since the block stays up until the next
     * sign-in, cancelling those would leave the password reset dead for anyone
     * who had signed out earlier in the session.
     */
    if (auth) signals.push(inFlight.signal)
    const abort = signals.length ? AbortSignal.any(signals) : undefined
    try {
      return await fetch(`${BASE}${path}`, {
        ...rest,
        ...(abort ? { signal: abort } : {}),
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
    } catch (e) {
      throw new ApiError(0, e instanceof Error ? e.message : "Could not reach the API.")
    }
  }

  let token: string | null = null
  if (auth) {
    token = await accessToken()
    // The await above yields: a sign-out may have begun while it was pending
    if (blocked()) throw new ApiError(401, "Signing out.")
    if (!token) {
      sessionExpired()
      throw new ApiError(401, "Not signed in.")
    }
  }

  let response = await send(token)

  if (response.status === 401 && auth && retryOn401) {
    const fresh = await refreshAccessToken()
    // Refreshing awaits too, so the same race applies to the retry
    if (blocked()) throw new ApiError(401, "Signing out.")
    if (!fresh) {
      // Cognito will not issue another token: the session is over, not the request
      sessionExpired()
      throw new ApiError(401, "Your session has expired. Please sign in again.")
    }
    response = await send(fresh)
  }

  // 204 and friends have nothing to parse
  const text = await response.text()
  const parsed = (text ? safeJson(text) : null) as Envelope<T> | null

  if (!response.ok || parsed?.status === "error") {
    const message = parsed?.message ?? `${response.status} ${response.statusText}`
    throw new ApiError(response.status, message, parsed)
  }

  return parsed?.data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}
