/**
 * Which other channel the code screen may offer.
 *
 * Where the *first* code goes is Cognito's decision, not the client's: the pool
 * has e-mail OTP as its MFA factor and the challenge comes back saying where it
 * was sent. This only names the other way of reaching the same person, and the
 * link is shown solely when `challenge.availableChannels` says that way exists.
 */
import type { OtpChannel } from "./types"

/** The other way round, for the "send it to my …" link on the code screen */
export const fallbackChannelFor = (channel: OtpChannel): OtpChannel => (channel === "email" ? "sms" : "email")
