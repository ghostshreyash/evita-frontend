/**
 * Authentication types for EVITA.
 *
 * These describe the data the screens render; the codes themselves are issued,
 * delivered and verified by AWS (Cognito + SNS/SES). Nothing here generates or
 * checks an OTP — see `auth-service.ts` for the integration points.
 */

/** Where a one-time code is delivered. SMS is primary; e-mail is the fallback. */
export type OtpChannel = "sms" | "email" | "voice"

/** What the user is proving by entering the code — drives copy and the next screen. */
export type OtpPurpose = "login" | "password-reset" | "contact-verification"

export type AuthUser = {
  id: string
  name: string
  initials: string
  role: string
  email: string
  mobile: string
}

export type AuthSession = {
  user: AuthUser
  issuedAt: number
  /** "Remember Me" keeps the session in localStorage instead of sessionStorage. */
  remember: boolean
}

/**
 * An OTP challenge as returned by the backend. The client only displays it:
 * AWS owns the code, the attempt limits and the expiry.
 */
export type OtpChallenge = {
  /** Cognito session / challenge reference, echoed back when verifying. */
  id: string
  purpose: OtpPurpose
  channel: OtpChannel
  /** Already masked by the backend for display, e.g. "+91 ••••• ••210". */
  sentTo: string
  /** Epoch ms the code stops being accepted — shown as a countdown. */
  expiresAt: number
  /** Epoch ms before which Resend stays disabled. */
  resendAvailableAt: number
  /** Channels with a destination on file, offered under "Try another way". */
  availableChannels: OtpChannel[]
  /** Where to go once verified — carried through the OTP screen. */
  next?: string
}

/**
 * Carried from the reset OTP screen to the new-password screen. Cognito's
 * confirmForgotPassword takes the code and the new password together, so the
 * code travels with it rather than being verified on its own.
 */
export type ResetContext = {
  challengeId: string
  /** The code the user entered, submitted with the new password. */
  code: string
  /** Masked destination the code went to, shown on the reset screen. */
  sentTo: string
}

export class AuthError extends Error {
  /** Backend error code, e.g. "NotAuthorizedException" or "CodeMismatchException". */
  readonly code: string

  constructor(message: string, code = "unknown") {
    super(message)
    this.name = "AuthError"
    this.code = code
  }
}
