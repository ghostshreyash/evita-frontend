import { z } from "zod"

/** Shared validation rules, matching the password requirements shown in the mockups */
export const required = (label = "This field") => z.string().trim().min(1, `${label} is required`)

export const optionalEmail = z.union([z.literal(""), z.email("Enter a valid email address")]).optional()

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ]{10,15}$/, "Enter a valid phone number")

export const passwordRules = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Include uppercase and lowercase letters", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "Include at least one number", test: (v: string) => /\d/.test(v) },
  { label: "Include at least one special character (e.g. @ # $ % ^ &)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export const password = z
  .string()
  .refine((v) => passwordRules.every((r) => r.test(v)), "Password does not meet the requirements")

export const username = z
  .string()
  .trim()
  .min(6, "Username must be at least 6 characters")
  .regex(/^[a-z0-9._]+$/i, "Use letters, numbers, dots or underscores only")

/** Today as yyyy-MM-dd, the value a date input expects */
export const today = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
