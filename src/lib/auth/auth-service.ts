/**
 * Auth integration points for EVITA.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ The OTP itself is NOT implemented here. Codes are issued, delivered and   │
 * │ verified by AWS (Cognito user pools, SNS for SMS, SES for e-mail). Every  │
 * │ function below is a placeholder that lets the screens navigate during the │
 * │ demo; replace each body with the AWS call marked `TODO(aws)`.             │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Nothing in this file validates a code, counts attempts or locks an account —
 * those are server-side policies configured in Cognito.
 */
import type { RecoveryRequestInput } from "./requests"
import type { AuthUser, OtpChallenge, OtpChannel, OtpPurpose, ResetContext } from "./types"
import { defaultChannelFor } from "./otp-policy"

/** Digits in a code — keep in step with the Cognito verification message. */
export const OTP_LENGTH = 6
/** Client-side hint only; the authoritative expiry comes back on the challenge. */
export const OTP_TTL_SECONDS = 5 * 60
/** How long the Resend button stays disabled after a send. */
export const RESEND_COOLDOWN_SECONDS = 30

export const CHANNEL_LABEL: Record<OtpChannel, string> = {
  sms: "SMS",
  email: "E-mail",
  voice: "Voice call",
}

/* ------------------------------------------------------------- display ---- */
/* The backend returns destinations already masked. These helpers cover the
   placeholder responses below and any value the UI has to mask locally. */

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

/* ------------------------------------------------------------ demo data --- */

/** Stand-in for the profile Cognito returns in the ID token. */
export const demoUser: AuthUser = {
  id: "ELP-1001",
  name: "Suresh Kumar",
  initials: "SK",
  role: "ELPREMAR",
  email: "suresh.kumar@olivineglobal.com",
  mobile: "+919876543210",
}

/**
 * A few ELPREMARs from the shared roster (`elpremarRoster` in master-data), so
 * signing in as `amit.sharma` shows Amit's day rather than Suresh's. Any other
 * username falls back to `demoUser`.
 * TODO(aws): this whole directory goes away — Cognito returns the real profile.
 */
export const demoAccounts: AuthUser[] = [
  demoUser,
  { id: "ELP-1008", name: "Amit Sharma", initials: "AS", role: "ELPREMAR", email: "amit.sharma@olivineglobal.com", mobile: "+919812345678" },
  { id: "ELP-1015", name: "Ramesh Patil", initials: "RP", role: "ELPREMAR", email: "ramesh.patil@olivineglobal.com", mobile: "+919823456710" },
]

/** ELPREMARs sign in as firstname.lastname; the e-mail works too */
const accountFor = (identifier: string) => {
  const id = identifier.trim().toLowerCase()
  return demoAccounts.find((a) => a.email.toLowerCase() === id || a.email.split("@")[0] === id) ?? demoUser
}

/**
 * The account the live challenge belongs to. Cognito carries this in its session;
 * here it is held between step 1 and step 2 so the code screen masks the right
 * destinations and the session ends up as the right person.
 */
let pending: AuthUser = demoUser

/** Masked destinations for the account a challenge belongs to */
export function otpDestinations(user: AuthUser = pending): Partial<Record<OtpChannel, string>> {
  return { email: maskEmail(user.email), sms: maskPhone(user.mobile), voice: maskPhone(user.mobile) }
}

const pause = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

function placeholderChallenge(
  purpose: OtpPurpose,
  channel: OtpChannel,
  sentTo: string,
  next?: string
): OtpChallenge {
  const now = Date.now()
  return {
    id: `chl_${Math.random().toString(36).slice(2, 10)}`,
    purpose,
    channel,
    sentTo,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
    availableChannels: ["email", "sms", "voice"],
    next,
  }
}

/* ------------------------------------------------------- login & the OTP -- */

/**
 * Step 1 of login. A correct password does not create a session — it returns the
 * OTP challenge that step 2 verifies.
 *
 * TODO(aws): CognitoIdentityProvider.initiateAuth (USER_PASSWORD_AUTH) and return
 * the SMS_MFA / CUSTOM_CHALLENGE session as the challenge id.
 */
export async function signIn(identifier: string, _password: string, next?: string): Promise<OtpChallenge> {
  await pause()
  pending = accountFor(identifier)
  // Field engineers are on site with a phone, so the first code goes by SMS
  const channel = defaultChannelFor(pending.role)
  return placeholderChallenge("login", channel, destinationFor(pending, channel), next)
}

/** The masked destination a channel delivers to for this account */
const destinationFor = (user: AuthUser, channel: OtpChannel) =>
  channel === "email" ? maskEmail(user.email) : maskPhone(user.mobile)

/**
 * TODO(aws): re-issue the code on the same channel (initiateAuth again, or a
 * custom-auth Lambda that re-sends through SNS/SES).
 */
export async function resendOtp(challenge: OtpChallenge): Promise<OtpChallenge> {
  await pause(400)
  const now = Date.now()
  return {
    ...challenge,
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
  }
}

/**
 * Fallback delivery: send the same challenge somewhere else when the SMS does
 * not arrive.
 *
 * TODO(aws): custom-auth Lambda picks the channel (SNS for sms/voice, SES for
 * e-mail) and returns the masked destination.
 */
export async function switchOtpChannel(challenge: OtpChallenge, channel: OtpChannel): Promise<OtpChallenge> {
  await pause(400)
  const now = Date.now()
  return {
    ...challenge,
    channel,
    sentTo: destinationFor(pending, channel),
    expiresAt: now + OTP_TTL_SECONDS * 1000,
    resendAvailableAt: now + RESEND_COOLDOWN_SECONDS * 1000,
  }
}

/**
 * Verify a code. AWS decides whether it is correct, expired, or whether the
 * account is now locked; this placeholder always succeeds so the demo can walk
 * the flow.
 *
 * TODO(aws): respondToAuthChallenge({ ChallengeName, Session, ChallengeResponses })
 * and reject with the Cognito error so the screen can show it.
 */
export async function verifyOtp(_challenge: OtpChallenge, _code: string): Promise<AuthUser> {
  await pause()
  return pending
}

/* -------------------------------------------------------- password reset -- */

/**
 * Start recovery from an e-mail address or mobile number.
 *
 * TODO(aws): forgotPassword — Cognito sends the confirmation code and returns
 * the masked destination in CodeDeliveryDetails.
 */
export async function requestPasswordReset(identifier: string): Promise<OtpChallenge> {
  await pause()
  const email = identifier.includes("@")
  return placeholderChallenge("password-reset", email ? "email" : "sms", email ? maskEmail(identifier) : maskPhone(identifier))
}

/**
 * TODO(aws): confirmForgotPassword({ Username, ConfirmationCode, Password }).
 * Cognito verifies the code and sets the password in one call, which is why the
 * reset context carries the code the user entered on the previous screen.
 */
export async function resetPassword(_context: ResetContext, _password: string): Promise<void> {
  await pause()
}

/* ------------------------------------------------- access & recovery ------ */

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
