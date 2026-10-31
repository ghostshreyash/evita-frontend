/**
 * The EVITA API client.
 *
 * This is the merge of two clients that grew in parallel: one that knew how to
 * authenticate and one that knew how to talk to the asset endpoints. The asset
 * one carried `TODO(aws): attach the Cognito access token once authentication
 * is configured`, and every route under `/api/v1` sits behind
 * `requireCognitoAuth` and `requireElpremar`, so those calls could never have
 * succeeded. Both surfaces are kept so neither side's callers had to change:
 *
 * - `apiGet` / `apiGetEnvelope` / `apiSend` / `fileUrl` - the asset modules
 * - `apiFetch` - the auth module, which wants a timeout per call
 *
 * Every call carries the Cognito access token as a bearer. Amplify refreshes
 * that token when it is close to expiry, so `accessToken()` is read per request
 * rather than captured once - a tablet left open overnight would otherwise send
 * a stale one.
 *
 * Nothing here sends a password, a one-time code or a database id: the backend
 * reads identity from the verified token, and anything the client asserted
 * about itself would not be trustworthy anyway. The refresh token never leaves
 * Amplify's storage - only the access token is ever put on a request.
 */
import { accessToken, refreshAccessToken } from "@/lib/auth/auth-service"

/*
 * Where the API lives.
 *
 * Empty means "this origin", which is how local work runs: the Vite dev server
 * proxies `/api` to the backend, so the browser sees a same-origin request and
 * CORS never applies. A deployed build sets the real host.
 *
 * A trailing `/api/v1` is tolerated and stripped, because that is how the
 * variable used to be written and a developer's existing `.env` will still say
 * it. Everything below appends the version itself.
 */
const RAW = (import.meta.env.VITE_API_URL as string | undefined) ?? ""
const ORIGIN = RAW.replace(/\/+$/, "").replace(/\/api\/v1$/, "")

/** The versioned base. Paths passed to this module are relative to it. */
export const API_URL = `${ORIGIN}/api/v1`

export type ApiFieldError = { path: string; code?: string; message: string }

/**
 * A request the server rejected.
 *
 * `fields` is populated when the server returned per-field errors, which it
 * does for anything that failed validation - so a form can highlight exactly
 * what was wrong rather than showing one message for the whole submission.
 *
 * Status 0 means the request never arrived, which on a tablet is usually no
 * signal rather than a server fault.
 */
export class ApiError extends Error {
  status: number
  fields: ApiFieldError[]

  constructor(message: string, status: number, fields: ApiFieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fields = fields
  }

  /** The message to put in front of the engineer: every field problem, or the summary */
  get readable() {
    return this.fields.length ? this.fields.map((f) => f.message).join(". ") : this.message
  }
}

type Envelope<T> = {
  status: "ok" | "error"
  statusCode: number
  message: string
  data?: T
  details?: ApiFieldError[] | string
}

/**
 * The server's `details`, when it carries per-field errors.
 *
 * It is an array for anything Zod rejected and a plain string for an error
 * raised deeper in - a tag already in use, a plant that belongs to another
 * enterprise - so only the array form becomes field errors.
 */
const fieldsOf = (details: Envelope<unknown>["details"]): ApiFieldError[] =>
  Array.isArray(details) ? details : []

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
 * Those have left the tablet, so this cannot un-send them - the server may
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

export const isSigningOut = () => signingOut

/**
 * What to do when Cognito can no longer produce a token - the refresh token has
 * expired or been revoked, so the session is genuinely over.
 *
 * A module-level handler rather than a hook because these functions are called
 * from plain modules, not components. `AuthProvider` registers the real one on
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

/* --------------------------------------------------------------- calls -- */

type ApiOptions = Omit<RequestInit, "body"> & {
  /** A plain object is sent as JSON; `FormData` is sent as multipart */
  body?: unknown
  /** False for an endpoint reachable before sign-in. None exist today. */
  auth?: boolean
  /**
   * False to accept a 401 as the answer instead of refreshing and retrying.
   * Sign-out needs this: refreshing there would mint a brand new token for a
   * session the engineer has just asked to end.
   */
  retryOn401?: boolean
  /** Abort after this many ms, so a hung API cannot stall the caller */
  timeoutMs?: number
  /** True to return the whole envelope rather than just `data` - the paged list */
  envelope?: boolean
}

/**
 * Fetch against the EVITA API with the bearer token attached.
 *
 * On a 401 the token is refreshed through Amplify and the request is retried
 * **once**. If the refresh itself fails the session is over and the expiry
 * handler signs the engineer out; if the retry comes back 401 with a freshly
 * minted token, that is the backend's own authorization decision and is
 * reported as a normal `ApiError` - signing someone out over it would eject
 * them from an app they are legitimately signed in to.
 *
 * Returns the envelope's `data` unless `envelope` is set. Throws `ApiError` on
 * a non-2xx so callers can branch on `status`; a network failure throws status
 * 0, which is how "no signal" and "backend not running" both show up.
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const {
    body,
    headers,
    auth = true,
    retryOn401 = true,
    timeoutMs,
    envelope = false,
    ...rest
  } = options

  /*
   * Checked before the token is read, and again after - `accessToken()` awaits,
   * and a sign-out starting in that gap would otherwise hand this request a
   * bearer from the session that was just ended.
   */
  const blocked = () => auth && signingOut
  if (blocked()) throw new ApiError("Signing out.", 401)

  const isForm = typeof FormData !== "undefined" && body instanceof FormData

  const send = async (token: string | null) => {
    const signals: AbortSignal[] = []
    if (timeoutMs) signals.push(AbortSignal.timeout(timeoutMs))
    if (auth) signals.push(inFlight.signal)
    const abort = signals.length ? AbortSignal.any(signals) : undefined
    try {
      return await fetch(`${API_URL}${path}`, {
        ...rest,
        ...(abort ? { signal: abort } : {}),
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          /*
           * Multipart must not carry a content type - the browser sets the
           * boundary. The asset onboarding posts photographs this way.
           */
          ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(body === undefined ? {} : { body: isForm ? (body as FormData) : JSON.stringify(body) }),
      })
    } catch (e) {
      // fetch only rejects when the request never arrived
      throw new ApiError(
        e instanceof Error && e.name === "TimeoutError"
          ? "The server took too long to answer. Check the connection and try again."
          : "Could not reach the server. Check the connection and try again.",
        0,
      )
    }
  }

  let token: string | null = null
  if (auth) {
    token = await accessToken()
    // The await above yields: a sign-out may have begun while it was pending
    if (blocked()) throw new ApiError("Signing out.", 401)
    if (!token) {
      sessionExpired()
      throw new ApiError("Not signed in.", 401)
    }
  }

  let response = await send(token)

  if (response.status === 401 && auth && retryOn401) {
    const fresh = await refreshAccessToken()
    // Refreshing awaits too, so the same race applies to the retry
    if (blocked()) throw new ApiError("Signing out.", 401)
    if (!fresh) {
      // Cognito will not issue another token: the session is over, not the request
      sessionExpired()
      throw new ApiError("Your session has expired. Please sign in again.", 401)
    }
    response = await send(fresh)
  }

  // 204 and friends have nothing to parse
  const text = await response.text()
  const parsed = (text ? safeJson(text) : null) as Envelope<T> | null

  if (!response.ok || parsed?.status === "error") {
    throw new ApiError(
      parsed?.message ?? `Request failed (${response.status})`,
      response.status,
      fieldsOf(parsed?.details),
    )
  }

  return (envelope ? parsed : parsed?.data) as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const apiGet = <T>(path: string) => apiFetch<T>(path)

/** A response whose body is the whole envelope, not just `data` - the paged list */
export const apiGetEnvelope = <T>(path: string) => apiFetch<T>(path, { envelope: true })

/**
 * A write. `FormData` is sent as multipart and must not carry a content type -
 * the browser sets the boundary - so only a plain object gets a JSON header.
 */
export const apiSend = <T>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) =>
  apiFetch<T>(path, { method, ...(body !== undefined ? { body } : {}) })

/** `/uploads/...` paths the API returns are relative to the server, not to this app */
export const fileUrl = (path?: string | null) =>
  !path ? undefined : path.startsWith("http") ? path : `${ORIGIN}${path}`
