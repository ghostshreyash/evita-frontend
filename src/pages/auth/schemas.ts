import { z } from "zod"

import { password, phone, required } from "@/lib/validation"

/**
 * EVITA sign in. The identifier is the engineer's work e-mail address: that is
 * the username OCC gives the Cognito account when it onboards them, and there
 * is no other way for an account to exist.
 */
export const portalLoginSchema = z.object({
  identifier: z.email("Enter the work e-mail address on your EVITA-AI account"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean(),
})
export type PortalLoginValues = z.infer<typeof portalLoginSchema>

/** Account recovery starts from either the registered e-mail or mobile number. */
export const identifySchema = z.object({
  method: z.enum(["mobile", "email"]),
  identifier: required("This field"),
})
  .refine(
    (v) => (v.method === "email" ? z.email().safeParse(v.identifier).success : phone.safeParse(v.identifier).success),
    { path: ["identifier"], message: "Enter the registered mobile number or e-mail address" }
  )
export type IdentifyValues = z.infer<typeof identifySchema>

export const newPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
export type NewPasswordValues = z.infer<typeof newPasswordSchema>

export const recoverySchema = z.object({
  fullName: required("Full name"),
  employeeId: required("Employee / User ID"),
  registeredEmail: z.email("Enter the e-mail address on your EVITA-AI account"),
  alternateContact: required("Alternate contact"),
  reason: required("Details").max(500),
})
export type RecoveryValues = z.infer<typeof recoverySchema>

/** Step labels for the password-reset flow, shared by its three screens. */
export const RESET_STEPS = ["Identify", "Verify", "New password", "Done"]
