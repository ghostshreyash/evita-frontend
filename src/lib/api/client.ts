/**
 * The EVITA backend, as this app talks to it.
 *
 * Every response the API gives has the same envelope - `status`, `statusCode`,
 * `message` and either `data` or `details` - so unwrapping it belongs here
 * rather than at every call site.
 *
 * TODO(aws): attach the Cognito access token once authentication is configured.
 * The seam is `headers` below; nothing else needs to change.
 */

/** Where the API lives. Set `VITE_API_URL` to point at a deployed backend. */
export const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3100/api/v1"

/** One field the server refused, in the shape its `details` array uses */
export type ApiFieldError = { path: string; code?: string; message: string }

/**
 * A request the server rejected.
 *
 * `fields` is populated when the server returned per-field errors, which it
 * does for anything that failed validation - so a form can highlight exactly
 * what was wrong rather than showing one message for the whole submission.
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    // fetch only rejects when the request never arrived
    throw new ApiError(
      "Could not reach the server. Check the connection and try again.",
      0,
    )
  }

  let body: Envelope<T> | null = null
  try {
    body = (await response.json()) as Envelope<T>
  } catch {
    // A response with no JSON body at all - a proxy error page, usually
  }

  if (!response.ok || body?.status === "error") {
    throw new ApiError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
      fieldsOf(body?.details),
    )
  }

  return body?.data as T
}

/** A response whose body is the whole envelope, not just `data` - the paged list */
async function requestEnvelope<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`
  let response: Response

  try {
    response = await fetch(url, { ...init, headers: { Accept: "application/json", ...(init?.headers ?? {}) } })
  } catch {
    throw new ApiError("Could not reach the server. Check the connection and try again.", 0)
  }

  const body = (await response.json().catch(() => null)) as (Envelope<unknown> & T) | null

  if (!response.ok || body?.status === "error") {
    throw new ApiError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
      fieldsOf(body?.details),
    )
  }

  return body as T
}

export const apiGet = <T>(path: string) => request<T>(path)

export const apiGetEnvelope = <T>(path: string) => requestEnvelope<T>(path)

/**
 * A write. `FormData` is sent as multipart and must not carry a content type -
 * the browser sets the boundary - so only a plain object gets a JSON header.
 */
export const apiSend = <T>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) =>
  request<T>(path, {
    method,
    ...(body instanceof FormData
      ? { body }
      : body !== undefined
        ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }
        : {}),
  })

/** `/uploads/...` paths the API returns are relative to the server, not to this app */
export const fileUrl = (path?: string | null) =>
  !path ? undefined : path.startsWith("http") ? path : `${API_URL.replace(/\/api\/v1$/, "")}${path}`
