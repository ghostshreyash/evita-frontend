/**
 * Auth for EVITA, over Cognito via `aws-amplify/auth`.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ EVITA cannot create a login. An ELPREMAR's account is made by OCC's      │
 * │ onboarding, which writes the Cognito user and the register's record      │
 * │ together. There is no sign-up here and no `registerUser` — signing in,   │
 * │ and resetting a forgotten password, is everything this file does.        │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * The pool is configured with e-mail OTP as the MFA factor, so signing in is two
 * calls: `signIn` with the password returns a challenge, `confirmSignIn` with
 * the code completes it. Cognito owns the code, the attempt limit, the expiry
 * and the lockout — nothing here validates anything.
 *
 * Cognito proving the password is only half of it. The other half is the EVITA
 * API confirming the control centre onboarded this person: see `app-user.ts`.
 * A Cognito account that is not an ELPREMAR is signed straight back out here
 * rather than being left holding live tokens.
 *
 * One thing to know about Amplify: the challenge is NOT a token you can pass
 * around. Amplify holds the in-flight auth state internally, so `verifyOtp`
 * ignores `challenge.id` and simply answers whatever challenge is open. A page
 * refresh mid-flow therefore drops it and the user starts again — which is what
 * `auth-context` already says it wants.
 */
import {
  confirmResetPassword,
  confirmSignIn,
  fetchAuthSession,
  resetPassword as cognitoResetPassword,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  updateMFAPreference,
} from "aws-amplify/auth"

import { beginSignOut } from "@/lib/api/client"

import { hasCognitoSession, openSession, resolveAppUser } from "./app-user"
import { cognitoConfigured } from "./cognito"
import { type RecoveryRequestInput } from "./requests"
import { AuthError, type AuthUser, type OtpChallenge, type OtpChannel, type OtpPurpose, type ResetContext } from "./types"

/** Digits in a code — keep in step with the Cognito verification message. */
export const OTP_LENGTH = 6
/** Client-side hint only; Cognito does not return the code's TTL. */
export const OTP_TTL_SECONDS = 5 * 60
/** How long the Resend button stays disabled after a send. */
export const RESEND_COOLDOWN_SECONDS = 30

export const CHANNEL_LABEL: Record<OtpChannel, string> = {
  sms: "SMS",
  email: "E-mail",
  voice: "Voice call",
}

/* ------------------------------------------------------------- display ---- */
/* Cognito returns destinations already masked, but it masks the domain as well.
   These cover the values the screens have to mask themselves. */

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

/**
 * What the code screen shows as the address the code went to.
 *
 * Cognito masks `codeDeliveryDetails.destination` itself, but it masks the
 * domain too ("o***@y***"), which leaves someone with more than one address
 * unable to tell which was used. The address is already known here, so mask it
 * locally and keep the domain readable; Cognito's string is only the fallback
 * for the paths with no username to hand.
 */
function emailSentTo(destination?: string, username?: string) {
  if (username?.includes("@")) return maskEmail(username)
  return destination ?? "your e-mail"
}

/* ----------------------------------------------------------- in flight --- */

/**
 * What the current sign-in attempt needs that Amplify does not hand back.
 *
 * `password` is held only so Resend can re-issue a code: Amplify has no
 * "resend MFA code" call, and the only way to make Cognito send another is to
 * start the sign-in again. It lives in a module variable for the life of the
 * challenge, never in storage, and is cleared the moment the flow ends.
 */
let flow: { username: string; password: string } | null = null

/** Forget the in-flight credentials — call on success, failure and sign-out */
export function clearAuthFlow() {
  flow = null
}

/** True while a sign-in is waiting for a forced password change */
export const hasPendingSignIn = () => flow !== null

/** The username a password reset is running for, needed by confirmResetPassword */
let resetFor: string | null = null

/**
 * Masked destinations for the account a challenge belongs to.
 *
 * Empty before a session exists, which is every sign-in: the tablet does not
 * know the engineer's number until the API has answered. The code screen's
 * "try another way" picker is gated on `challenge.availableChannels` anyway, and
 * the pool offers e-mail only.
 */
export function otpDestinations(user?: AuthUser): Partial<Record<OtpChannel, string>> {
  if (!user) return {}
  return { email: maskEmail(user.email), sms: maskPhone(user.mobile), voice: maskPhone(user.mobile) }
}

const pause = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Build the challenge the screens render.
 *
 * `expiresAt` is a client-side countdown only — Cognito does not return the
 * code's TTL, so this is the pool's configured expiry mirrored in
 * `OTP_TTL_SECONDS`. Keep the two in step or the countdown lies.
 */
function challengeFrom(
  purpose: OtpPurpose,
  sentTo: string,
  next?: string,
  channel: OtpChannel = "email"
): OtpChallenge {
  const now = Date.now()
  return {
    id: `cognito-${purpose}`,
    purpose,
    channel,
    sentTo,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
    availableChannels: [channel],
    next,
  }
}

/** A missing pool is a deployment mistake, not a credentials problem — say so */
function requireCognito() {
  if (!cognitoConfigured)
    throw new AuthError(
      "Sign-in is not configured for this tablet. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID.",
      "NotConfigured"
    )
}

/** Turn whatever Amplify threw into the typed error the screens already expect */
function asAuthError(e: unknown, fallback: string): AuthError {
  const err = e as { name?: string; message?: string }
  return new AuthError(err?.message || fallback, err?.name || "unknown")
}

/**
 * Answer Cognito's "which factor?" step.
 *
 * A pool with both e-mail and SMS MFA enabled asks the user to choose after a
 * correct password. EVITA is built around the e-mail code, so it answers on the
 * engineer's behalf rather than adding a screen nobody needs.
 */
async function chooseEmailFactor(purpose: OtpPurpose, next?: string): Promise<OtpChallenge> {
  const { nextStep } = await confirmSignIn({ challengeResponse: "EMAIL" })

  if (nextStep?.signInStep !== "CONFIRM_SIGN_IN_WITH_EMAIL_CODE")
    throw new AuthError(
      `Expected an e-mail code after choosing the factor, got ${nextStep?.signInStep}.`,
      nextStep?.signInStep ?? "unknown"
    )

  const sentTo = emailSentTo(nextStep.codeDeliveryDetails?.destination, flow?.username)
  return challengeFrom(purpose, sentTo, next)
}

/* ------------------------------------------------------- login & the OTP -- */

/**
 * Step 1 of login. A correct password does not create a session — Cognito
 * answers with the e-mail OTP challenge that step 2 confirms.
 *
 * The identifier is the engineer's work e-mail: that is the username OCC gave
 * the Cognito account when it onboarded them.
 */
export async function signIn(email: string, password: string, next?: string): Promise<OtpChallenge> {
  requireCognito()
  const username = email.trim().toLowerCase()
  try {
    const { nextStep } = await cognitoSignIn({ username, password })

    switch (nextStep.signInStep) {
      case "CONFIRM_SIGN_IN_WITH_EMAIL_CODE": {
        flow = { username, password }
        return challengeFrom("login", emailSentTo(nextStep.codeDeliveryDetails?.destination, username), next)
      }

      /* Both e-mail and SMS MFA on the pool, so Cognito asks which to use */
      case "CONTINUE_SIGN_IN_WITH_MFA_SELECTION":
        flow = { username, password }
        return chooseEmailFactor("login", next)

      /*
       * Cognito did not ask: this account already has SMS as its preferred
       * factor, so the text has been sent. There is no way to move an open
       * challenge to e-mail, so accept the code rather than dead-end the login —
       * `preferEmailMfa` then makes e-mail preferred for next time.
       */
      case "CONFIRM_SIGN_IN_WITH_SMS_CODE": {
        flow = { username, password }
        const sentTo = nextStep.codeDeliveryDetails?.destination ?? maskPhone(username)
        return challengeFrom("login", sentTo, next, "sms")
      }

      /*
       * The normal first sign-in for an ELPREMAR. OCC creates the account with
       * AdminCreateUser, which leaves it in FORCE_CHANGE_PASSWORD on the
       * temporary password Cognito e-mailed, and no session is issued until it
       * is replaced. The login screen turns this code into the new-password
       * screen rather than showing it as an error.
       */
      case "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED":
        flow = { username, password }
        throw new AuthError(
          "This account is still on its temporary password. Set your own to continue.",
          "NewPasswordRequired"
        )

      case "RESET_PASSWORD":
        throw new AuthError("This password must be reset before you can sign in.", "PasswordResetRequired")

      /*
       * Cognito accepted the password without asking for a code, so MFA is not
       * being enforced for this account. EVITA's login is two-step by design, so
       * rather than letting someone in through a half-flow, end the session and
       * say why. Set MFA to required on the pool and this stops being reachable.
       */
      case "DONE":
        await cognitoSignOut()
        throw new AuthError(
          "This account signed in without a verification code. Enable e-mail MFA for it before using EVITA.",
          "MfaNotEnforced"
        )

      default:
        throw new AuthError(
          `Unsupported sign-in step: ${nextStep.signInStep}. Check the pool's MFA configuration.`,
          nextStep.signInStep
        )
    }
  } catch (e) {
    if (e instanceof AuthError) throw e
    clearAuthFlow()
    throw asAuthError(e, "Could not sign in.")
  }
}

/**
 * Re-issue the code.
 *
 * Amplify has no resend for an MFA challenge, so this restarts the sign-in,
 * which makes Cognito send a fresh one. That is why the password is held for
 * the life of the challenge.
 */
export async function resendOtp(challenge: OtpChallenge): Promise<OtpChallenge> {
  if (!flow) throw new AuthError("That sign-in has expired. Please start again.", "FlowExpired")
  try {
    const { nextStep } = await cognitoSignIn({ username: flow.username, password: flow.password })
    const sentTo =
      nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_EMAIL_CODE"
        ? (nextStep.codeDeliveryDetails?.destination ?? challenge.sentTo)
        : challenge.sentTo
    return challengeFrom(challenge.purpose, sentTo, challenge.next, challenge.channel)
  } catch (e) {
    throw asAuthError(e, "Could not send another code.")
  }
}

/**
 * Deliver the code by the other factor.
 *
 * Cognito's factor choice happens once per sign-in, so there is no way to move
 * an open challenge across. Like Resend, this restarts the sign-in with the held
 * credentials and answers the selection with the other factor instead.
 */
export async function switchOtpChannel(challenge: OtpChallenge, channel: OtpChannel): Promise<OtpChallenge> {
  if (!flow) throw new AuthError("That sign-in has expired. Please start again.", "FlowExpired")
  if (channel === "voice") throw new AuthError("Voice delivery is not configured.", "ChannelUnavailable")

  try {
    const { nextStep } = await cognitoSignIn({ username: flow.username, password: flow.password })

    if (nextStep.signInStep !== "CONTINUE_SIGN_IN_WITH_MFA_SELECTION")
      throw new AuthError("This account cannot change delivery method.", "ChannelUnavailable")

    const confirmed = await confirmSignIn({ challengeResponse: channel === "sms" ? "SMS" : "EMAIL" })
    const step = confirmed.nextStep

    const expected = channel === "sms" ? "CONFIRM_SIGN_IN_WITH_SMS_CODE" : "CONFIRM_SIGN_IN_WITH_EMAIL_CODE"
    if (step?.signInStep !== expected)
      throw new AuthError(`Could not send the code by ${CHANNEL_LABEL[channel]}.`, step?.signInStep ?? "unknown")

    return {
      ...challengeFrom(challenge.purpose, step.codeDeliveryDetails?.destination ?? challenge.sentTo, challenge.next, channel),
      availableChannels: challenge.availableChannels,
    }
  } catch (e) {
    if (e instanceof AuthError) throw e
    throw asAuthError(e, "Could not change the delivery method.")
  }
}

/**
 * The second half of the gate: the engineer has proved who they are, now the
 * API says whether they are an ELPREMAR the control centre onboarded.
 *
 * A refusal leaves Cognito holding a valid session for an account that may not
 * use EVITA, so the tokens are cleared before the error is re-thrown. Without
 * that, the next page load would rehydrate a session the API will refuse on
 * every call.
 */
async function openElpremarSession(): Promise<AuthUser> {
  try {
    return await openSession()
  } catch (e) {
    await cognitoSignOut().catch(() => {})
    clearAuthFlow()
    throw e
  }
}

/** Verify the code. Cognito decides correct, expired, or account locked. */
export async function verifyOtp(_challenge: OtpChallenge, code: string): Promise<AuthUser> {
  try {
    // Amplify holds the open challenge; the id is not replayed back to it
    const { isSignedIn } = await confirmSignIn({ challengeResponse: code })
    if (!isSignedIn) throw new AuthError("That code was not accepted.", "NotSignedIn")
  } catch (e) {
    if (e instanceof AuthError) throw e
    throw asAuthError(e, "That code is not valid.")
  }

  /*
   * Outside the catch above on purpose: the API's refusal is not a bad code and
   * must keep its own message rather than being reported as one.
   */
  const user = await openElpremarSession()
  await preferEmailMfa()
  clearAuthFlow()
  return user
}

/**
 * Answer a `NEW_PASSWORD_REQUIRED` challenge.
 *
 * Cognito puts the accounts OCC creates in FORCE_CHANGE_PASSWORD and refuses a
 * session until the temporary password is replaced, so this is on the path of
 * every ELPREMAR's first sign-in. Answering it can land in two places, so both
 * are returned: either the account still owes an MFA code, or it is signed in
 * already (a pool with MFA optional).
 */
export async function completeNewPassword(
  newPassword: string,
  next?: string
): Promise<{ challenge: OtpChallenge } | { user: AuthUser }> {
  let challenge: OtpChallenge | null = null

  try {
    const { isSignedIn, nextStep } = await confirmSignIn({ challengeResponse: newPassword })
    const step = nextStep?.signInStep

    // The usual path: password accepted, now prove the e-mail
    if (step === "CONFIRM_SIGN_IN_WITH_EMAIL_CODE") {
      const sentTo = emailSentTo(nextStep.codeDeliveryDetails?.destination, flow?.username)
      challenge = challengeFrom("login", sentTo, next)
    } else if (step === "CONTINUE_SIGN_IN_WITH_MFA_SELECTION") {
      /* The same selection step can follow a password change */
      challenge = await chooseEmailFactor("login", next)
    } else if (!isSignedIn) {
      throw new AuthError(`Unexpected step after setting the password: ${step}.`, step ?? "unknown")
    }
  } catch (e) {
    if (e instanceof AuthError) throw e
    throw asAuthError(e, "Could not set that password.")
  }

  if (challenge) return { challenge }

  // No MFA on this pool: the session is complete, so the API decides next
  const user = await openElpremarSession()
  clearAuthFlow()
  return { user }
}

/**
 * Make e-mail this account's preferred MFA factor.
 *
 * EVITA is built around the e-mail code. Without a preference Cognito asks which
 * factor to use on every sign-in, and if SMS is preferred it sends a text
 * instead. Setting it once, after the first successful sign-in, means later
 * logins go straight to the e-mail code with no selection step.
 *
 * Needs an authenticated session, so it can only run here — and a failure is
 * not worth failing the sign-in over.
 */
async function preferEmailMfa() {
  try {
    // DISABLED on SMS, not just NOT_PREFERRED: while EVITA is e-mail-only,
    // Cognito should have no text option to fall back to for this account
    await updateMFAPreference({ email: "PREFERRED", sms: "DISABLED" })
  } catch (e) {
    console.warn("[auth] could not set e-mail as the preferred MFA factor.", e)
  }
}

/**
 * End the session: clear the Cognito tokens.
 *
 * Amplify revokes the refresh token with Cognito, so no new access token can be
 * minted. An access token already issued stays valid until it expires — there
 * is no server-side revocation yet, which is why `beginSignOut` cancels the
 * requests already in the air and blocks any new ones from attaching the
 * outgoing token.
 */
export async function signOutCognito() {
  /*
   * Synchronous and first: from this point no other request may pick up the
   * outgoing token, and anything already running is cancelled. Everything below
   * is asynchronous, so leaving this any later reopens the window it closes.
   */
  beginSignOut()
  clearAuthFlow()

  try {
    await cognitoSignOut()
  } catch (e) {
    /*
     * The tokens may still be in storage, which would let the next page load
     * rehydrate the session. Loud on purpose: a sign-out that did not take is
     * the one failure here the engineer must not be left unaware of.
     */
    console.error("[auth] Cognito sign-out failed; tokens may remain in storage.", e)
  }
}

/**
 * What boot made of the session this tablet had stored.
 *
 * Three answers, not two, and that is the difference from the OCC console.
 * Signing *in* has to be authoritative — nobody gets a session the API has not
 * confirmed. Re-opening a tablet is not the same thing: an engineer in a plant
 * basement with no signal still has valid Cognito tokens and a day's work to
 * get on with, and logging them out over a failed request would be a fault, not
 * a safeguard. A refusal is final; an unreachable API is not.
 */
export type BootSession =
  /** Cognito and the API both agree; this is the current profile */
  | { status: "confirmed"; user: AuthUser }
  /** No usable session, or the API says this is not an ELPREMAR — sign out */
  | { status: "refused" }
  /** Cognito still has tokens but the API could not be asked — keep what was stored */
  | { status: "unconfirmed" }

/**
 * Re-check the stored session against Cognito and the API.
 *
 * A stored session cannot outlive the tokens behind it, nor the ELPREMAR record
 * behind those: an account deactivated in OCC since the tablet was last opened
 * is signed out here rather than being let back in. Every API call is enforced
 * server-side regardless, so an `unconfirmed` session is not a way around the
 * gate — only a way not to lose the screen over a dropped connection.
 */
export async function currentUser(): Promise<BootSession> {
  if (!(await hasCognitoSession())) return { status: "refused" }

  try {
    return { status: "confirmed", user: await resolveAppUser() }
  } catch (e) {
    // The API refused this account outright, so the tokens are no use
    if (e instanceof AuthError && e.code === "NotElpremar") {
      await cognitoSignOut().catch(() => {})
      return { status: "refused" }
    }
    console.warn("[auth] could not confirm the session on boot; keeping the stored one.", e)
    return { status: "unconfirmed" }
  }
}

/** The access token for an API call, refreshed by Amplify when it needs to be */
export async function accessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

/**
 * Force Amplify to mint a new access token from the refresh token.
 *
 * Used by the API client when a call comes back 401 despite having sent a token
 * Amplify considered current — the clock skewed, or the token was revoked.
 * Returns null when the refresh token itself is finished, which is the client's
 * signal that the session is over rather than the request.
 *
 * Concurrent callers share one refresh: a page that fires several requests at
 * once would otherwise send several refresh calls for the same expiry, and
 * Cognito counts those against the pool's request limits.
 */
let refreshing: Promise<string | null> | null = null

export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true })
      return session.tokens?.accessToken?.toString() ?? null
    } catch {
      // Refresh token expired or revoked - the caller signs the engineer out
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/* -------------------------------------------------------- password reset -- */

/**
 * Start recovery. Cognito sends the confirmation code and reports where it went.
 *
 * The username is held because `confirmResetPassword` needs it again on the
 * next screen and `ResetContext` does not carry it.
 */
export async function requestPasswordReset(identifier: string): Promise<OtpChallenge> {
  requireCognito()
  const username = identifier.trim().toLowerCase()
  try {
    const { nextStep } = await cognitoResetPassword({ username })
    resetFor = username
    return challengeFrom("password-reset", emailSentTo(nextStep.codeDeliveryDetails?.destination, username))
  } catch (e) {
    /*
     * Cognito deliberately reveals nothing about whether an account exists, and
     * neither should the screen — report the same thing either way.
     */
    const err = e as { name?: string }
    if (err?.name === "UserNotFoundException") {
      resetFor = username
      return challengeFrom("password-reset", maskEmail(username))
    }
    throw asAuthError(e, "Could not start the reset.")
  }
}

/**
 * Cognito verifies the code and sets the password in one call, which is why the
 * reset context carries the code the user entered on the previous screen.
 */
export async function resetPassword(context: ResetContext, password: string): Promise<void> {
  if (!resetFor) throw new AuthError("That reset has expired. Please start again.", "FlowExpired")
  try {
    await confirmResetPassword({ username: resetFor, confirmationCode: context.code, newPassword: password })
    resetFor = null
  } catch (e) {
    throw asAuthError(e, "Could not set that password.")
  }
}

/* ------------------------------------------------------------- recovery -- */

/**
 * Last resort when the registered mobile and e-mail are both unreachable: the
 * OLIVINE helpdesk verifies identity out of band.
 *
 * TODO(aws): POST to the support desk API and return the real ticket number.
 */
export async function submitRecovery(_request: RecoveryRequestInput): Promise<{ reference: string }> {
  await pause()
  return { reference: `TK-${Math.floor(1000 + Math.random() * 8999)}` }
}
