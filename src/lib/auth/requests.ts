/** Payload for the recovery form, queued for the helpdesk to verify by hand. */

export type RecoveryRequestInput = {
  fullName: string
  employeeId: string
  registeredEmail: string
  alternateContact: string
  reason: string
}
