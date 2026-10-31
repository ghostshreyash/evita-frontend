/**
 * What is left of the EVITA API client on the demo branch.
 *
 * This branch has **no backend**. `src/lib/api/assets.ts` stands in for the
 * server and answers out of the mock register, so there is no `fetch`, no
 * bearer token and no Amplify anywhere in this app - see that file's header for
 * why the server's own shapes are still spoken.
 *
 * Two things survived, because they are not about the network:
 *
 * - **`ApiError`**, with its per-field `fields`. The onboarding wizard reads it
 *   to highlight exactly which parameter was refused, and the mock server
 *   rejects the same things the real one does, so that path stays exercised.
 * - **The sign-out block.** A write started before the engineer logged out must
 *   not be applied afterwards. That is as true of a mock answer resolved on a
 *   timer as it is of a request in the air.
 *
 * Kept deliberately small: when this branch is rebased on `main`, this file and
 * `assets.ts` are the two that will conflict, and everything else comes across
 * untouched.
 */

export type ApiFieldError = { path: string; code?: string; message: string }

/**
 * A request the server rejected.
 *
 * `fields` is populated when the server returned per-field errors, which it
 * does for anything that failed validation - so a form can highlight exactly
 * what was wrong rather than showing one message for the whole submission.
 *
 * Status 0 means the request never arrived, which on a tablet is usually no
 * signal rather than a server fault. Nothing on this branch raises it.
 */
export class ApiError extends Error {
  status: number
  fields: ApiFieldError[]

  constructor(message: string, status: number, fields: ApiFieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.fields = fields
    this.status = status
  }

  /** The message to put in front of the engineer: every field problem, or the summary */
  get readable() {
    return this.fields.length ? this.fields.map((f) => f.message).join(". ") : this.message
  }
}

/* ------------------------------------------------------------ sign-out -- */

/**
 * Whether a sign-out is in progress.
 *
 * Set synchronously at the top of the sign-out, so there is no gap between the
 * tap and the block taking effect, and cleared when the next sign-in completes.
 * The mock server checks it before answering: a call that was already pending
 * when the engineer logged out resolves into a signed-out app otherwise, and
 * would write a row they are no longer entitled to see.
 */
let signingOut = false

/** Blocks writes against a session the engineer has just ended */
export function beginSignOut() {
  signingOut = true
}

/** Reopens the client for a new session. Called when a sign-in completes. */
export function endSignOut() {
  signingOut = false
}

export const isSigningOut = () => signingOut
