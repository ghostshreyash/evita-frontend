/**
 * Auth for EVITA on the demo branch: no Cognito, no API, no pool.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Any password signs in, and any six-digit code is accepted. This branch   │
 * │ exists to show the app without a backend standing behind it, so the      │
 * │ sign-in is a walk-through of the real screens rather than a check of     │
 * │ anything. Nothing here is a security control and none of it should ever  │
 * │ be merged towards `main`.                                                │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * The flow itself is the real one, and that is the point: two steps, a code
 * screen with a live countdown, Resend on a cooldown, "try another way", the
 * forgotten-password path and the helpdesk recovery form. Every screen is
 * reachable and every error the screens know how to render can still be raised
 * - what is missing is a Cognito pool deciding which.
 *
 * EVITA still cannot create a login. An ELPREMAR's account is made by OCC's
 * onboarding, and there is no sign-up here any more than there is on `main` -
 * which on this branch means the roster in `data/elpremar-data.ts` is the
 * directory. See `app-user.ts` for who an identifier resolves to.
 */
import { beginSignOut } from "@/lib/api/client"

import { accountFor, lookupAccount } from "./app-user"
import { type RecoveryRequestInput } from "./requests"
import { AuthError, type AuthUser, type OtpChallenge, type OtpChannel, type OtpPurpose, type ResetContext } from "./types"

/** Digits in a code. The screens size the input from this. */
export const OTP_LENGTH = 6
/** How long a code stays valid - the countdown on the code screen */
export const OTP_TTL_SECONDS = 5 * 60
/** How long the Resend button stays disabled after a send. */
export const RESEND_COOLDOWN_SECONDS = 30

export const CHANNEL_LABEL: Record<OtpChannel, string> = {
  sms: "SMS",
  email: "E-mail",
  voice: "Voice call",
}

/* ------------------------------------------------------------- display ---- */

/** "+919876543210" → "+91 ••••• ••210" */
export function maskPhone(mobile: string) {
  const digits = mobile.replace(/\D/g, "")
  const cc = digits.length > 10 ? `+${digits.slice(0, digits.length - 10)} ` : ""
  return `${cc}••••• ••${digits.slice(-3)}`
}

/** "suresh.kumar@tatasteel.com" → "su••••@tatasteel.com" */
export function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@")
  return `${local.slice(0, 2)}${"•".repeat(Math.max(local.length - 2, 2))}@${domain}`
}

/** The masked destination a channel delivers to for this account */
const destinationFor = (user: AuthUser, channel: OtpChannel) =>
  channel === "email" ? maskEmail(user.email) : maskPhone(user.mobile)

/* ----------------------------------------------------------- in flight --- */

/**
 * The account the open challenge belongs to.
 *
 * Cognito carries this in its own session; here it is held between step 1 and
 * step 2 so the code screen masks the right destinations and the session ends
 * up as the right engineer. In memory only, so a refresh mid-flow sends them
 * back to the password step - which is what `auth-context` already says it
 * wants.
 */
let flow: AuthUser | null = null

/** Forget the in-flight sign-in - call on success, failure and sign-out */
export function clearAuthFlow() {
  flow = null
}

/** True while a sign-in is waiting for a forced password change */
export const hasPendingSignIn = () => flow !== null

/** Who this tab signed in as, for `currentUser` on a soft navigation */
let signedIn: AuthUser | null = null

/** The account a password reset is running for */
let resetFor: AuthUser | null = null

/**
 * Masked destinations for the account a challenge belongs to.
 *
 * Called with no argument from the code screen, which does not know whose
 * challenge it is holding - the in-flight account answers for it. Empty before
 * a sign-in has started, which is the only time there is nobody to mask.
 */
export function otpDestinations(user?: AuthUser): Partial<Record<OtpChannel, string>> {
  const who = user ?? flow
  if (!who) return {}
  return { email: maskEmail(who.email), sms: maskPhone(who.mobile), voice: maskPhone(who.mobile) }
}

/** Long enough that the screens' pending states are visible, short enough not to annoy */
const pause = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Challenge references, counted rather than random.
 *
 * Mock values in this codebase are deterministic so nothing moves between
 * reloads - see the mock data rules in CLAUDE.md. A reference is not data a
 * screen reads, but a counter costs nothing and keeps the rule unbroken.
 */
let references = 0
const reference = (prefix: string) => `${prefix}-${String(++references).padStart(4, "0")}`

/**
 * Build the challenge the screens render.
 *
 * Both channels are offered under "try another way": the pool on `main` is
 * e-mail-only, but the picker is a screen worth being able to walk through, and
 * `switchOtpChannel` below honours the choice. Voice is not offered - nothing
 * delivers it on `main` either.
 */
function challengeFrom(purpose: OtpPurpose, sentTo: string, channel: OtpChannel, next?: string): OtpChallenge {
  const now = Date.now()
  return {
    id: reference(`chl-${purpose}`),
    purpose,
    channel,
    sentTo,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
    availableChannels: ["email", "sms"],
    next,
  }
}

/* ------------------------------------------------------- login & the OTP -- */

/**
 * Step 1 of login. A password does not create a session - it returns the
 * one-time code challenge that step 2 confirms.
 *
 * The identifier is the engineer's work e-mail, which is the username OCC gives
 * the account when it onboards them. Any password is accepted here; what the
 * identifier decides is *whose* day the tablet then shows.
 */
export async function signIn(email: string, password: string, next?: string): Promise<OtpChallenge> {
  await pause()
  if (!password) throw new AuthError("Enter your password.", "NotAuthorizedException")
  flow = accountFor(email)
  return challengeFrom("login", destinationFor(flow, "email"), "email", next)
}

/** Re-issue the code. Same account, same channel, a fresh countdown. */
export async function resendOtp(challenge: OtpChallenge): Promise<OtpChallenge> {
  if (!flow) throw new AuthError("That sign-in has expired. Please start again.", "FlowExpired")
  await pause()
  return challengeFrom(challenge.purpose, destinationFor(flow, challenge.channel), challenge.channel, challenge.next)
}

/** Deliver the code the other way. Voice is not configured, here or on `main`. */
export async function switchOtpChannel(challenge: OtpChallenge, channel: OtpChannel): Promise<OtpChallenge> {
  if (!flow) throw new AuthError("That sign-in has expired. Please start again.", "FlowExpired")
  if (channel === "voice") throw new AuthError("Voice delivery is not configured.", "ChannelUnavailable")
  await pause()
  return challengeFrom(challenge.purpose, destinationFor(flow, channel), channel, challenge.next)
}

/**
 * Verify the code.
 *
 * There is no code to be wrong, so anything of the right length is accepted and
 * the only refusal left is the expiry - which is real, and is worth keeping:
 * the countdown running out is a state the screen has to handle, and letting a
 * dead challenge through would hide it.
 */
export async function verifyOtp(challenge: OtpChallenge, code: string): Promise<AuthUser> {
  if (!flow) throw new AuthError("That sign-in has expired. Please start again.", "FlowExpired")
  await pause()

  if (code.trim().length !== OTP_LENGTH)
    throw new AuthError(`Enter the ${OTP_LENGTH}-digit code.`, "CodeMismatchException")
  if (Date.now() > challenge.expiresAt)
    throw new AuthError("That code has expired. Ask for a new one.", "ExpiredCodeException")

  signedIn = flow
  clearAuthFlow()
  return signedIn
}

/**
 * Answer a forced password change.
 *
 * On `main` this is on the path of every ELPREMAR's first sign-in: OCC creates
 * the account on a temporary password and Cognito issues no session until it is
 * replaced. Nothing raises `NewPasswordRequired` on this branch, so the screen
 * is reachable only by going to it directly - but it still works, and still
 * lands on the code step the way the real one does.
 */
export async function completeNewPassword(
  newPassword: string,
  next?: string
): Promise<{ challenge: OtpChallenge } | { user: AuthUser }> {
  if (!flow) throw new AuthError("That sign-in has expired. Please start again.", "FlowExpired")
  await pause()
  if (!newPassword) throw new AuthError("Enter a new password.", "InvalidPasswordException")
  return { challenge: challengeFrom("login", destinationFor(flow, "email"), "email", next) }
}

/**
 * End the session.
 *
 * `beginSignOut` first and synchronously: from that point the mock server
 * refuses to answer, so a write the engineer started before logging out cannot
 * land afterwards. On `main` the same call cancels the requests already in the
 * air, for the same reason.
 */
export async function signOutCognito() {
  beginSignOut()
  clearAuthFlow()
  signedIn = null
  resetFor = null
}

/**
 * What boot made of the session this tablet had stored.
 *
 * Three answers on `main`, and all three are still meaningful here even though
 * only two are reachable. `confirmed` is a soft navigation inside a session
 * this tab opened. A reload is `unconfirmed`: there is no server to ask who the
 * stored session belongs to, and the stored session is therefore the best
 * answer there is - which is exactly what `unconfirmed` tells `auth-context` to
 * keep. Nothing returns `refused`, because nothing on this branch can withdraw
 * an account.
 */
export type BootSession =
  /** This tab opened the session; here is the profile it holds */
  | { status: "confirmed"; user: AuthUser }
  /** No usable session, or the account has been withdrawn - sign out */
  | { status: "refused" }
  /** Nothing to confirm against - keep whatever the tablet stored */
  | { status: "unconfirmed" }

export async function currentUser(): Promise<BootSession> {
  if (signedIn) return { status: "confirmed", user: signedIn }
  return { status: "unconfirmed" }
}

/* -------------------------------------------------------- password reset -- */

/**
 * Start recovery.
 *
 * Reveals nothing about whether the account exists, the way Cognito does not:
 * an identifier nobody on the roster matches still reports a code sent, and it
 * reports it to **the address that was typed**. Falling back to a roster
 * engineer's address here would both read as a leak and tell the person they
 * had guessed wrong - the one thing this screen must not do.
 */
export async function requestPasswordReset(identifier: string): Promise<OtpChallenge> {
  await pause()
  const known = lookupAccount(identifier)
  resetFor = known ?? accountFor(identifier)
  const sentTo = known ? destinationFor(known, "email") : maskEmail(identifier.trim().toLowerCase())
  return challengeFrom("password-reset", sentTo, "email")
}

/**
 * Set the new password. The code the engineer entered on the previous screen
 * travels with it, because Cognito verifies and sets in one call and the
 * screens are built around that.
 */
export async function resetPassword(_context: ResetContext, password: string): Promise<void> {
  if (!resetFor) throw new AuthError("That reset has expired. Please start again.", "FlowExpired")
  await pause()
  if (!password) throw new AuthError("Enter a new password.", "InvalidPasswordException")
  resetFor = null
}

/* ------------------------------------------------------------- recovery -- */

/**
 * Last resort when the registered mobile and e-mail are both unreachable: the
 * OLIVINE helpdesk verifies identity out of band. Nothing is queued on this
 * branch - the reference is for the screen to show back.
 */
export async function submitRecovery(_request: RecoveryRequestInput): Promise<{ reference: string }> {
  await pause()
  return { reference: reference("TK") }
}
