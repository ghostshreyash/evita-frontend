/**
 * Where a one-time code goes by default.
 *
 * Everyone signing in to EVITA is an ELPREMAR on site with a phone and usually
 * no mail client, so the first code goes by SMS. The OCC console sends desk
 * roles theirs by e-mail; that split lives in occ-frontend's copy of this file.
 *
 * The other channel stays available on the code screen, so this only decides
 * where the first code is sent, never where it can be sent.
 *
 * TODO(aws): the authoritative channel comes from the user's Cognito attributes
 * and MFA preference; this is what the client assumes until it does.
 */
import type { OtpChannel } from "./types"

export function defaultChannelFor(_role: string): OtpChannel {
  return "sms"
}

/** The other way round, for the "send it to my …" link on the code screen */
export const fallbackChannelFor = (channel: OtpChannel): OtpChannel => (channel === "email" ? "sms" : "email")
