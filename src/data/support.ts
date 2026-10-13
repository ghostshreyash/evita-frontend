/**
 * How to reach OLIVINE support from the tablet.
 *
 * PLACEHOLDER. No OLIVINE document gives a support number, address or hours -
 * the FAQ sheet answers "what if the chatbot cannot solve my problem" with
 * "raise a ticket" and names nobody. These stand in so the Contact screen has
 * something to dial, and they are held here as one value so the real details
 * replace them in a single place.
 *
 * The email domain matches the one the ELPREMAR register issues addresses on.
 *
 * TODO(olivine): replace with the published support line, address and hours.
 */
export const olivineSupport = {
  phone: "+91 80 4000 1200",
  /** Digits only, for the tel: link */
  phoneDial: "+918040001200",
  email: "support@olivineglobalsystems.com",
  hours: "Mon – Sat, 08:00 – 20:00 IST",
  /** What the channel is actually for, so a ticket is not raised by telephone */
  note: "For anything that needs tracking, raise a ticket instead - the call line does not create one.",
} as const
