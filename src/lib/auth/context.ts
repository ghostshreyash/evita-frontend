import { createContext, use } from "react"

import type { AuthSession, AuthUser, OtpChallenge, ResetContext } from "./types"

export type AuthContextValue = {
  session: AuthSession | null
  user: AuthUser | null
  /** Completes login once an OTP has been verified. */
  signIn: (user: AuthUser, remember: boolean) => void
  signOut: () => void
  /** OTP challenge awaiting verification, handed between the auth screens. */
  challenge: OtpChallenge | null
  setChallenge: (challenge: OtpChallenge | null) => void
  /** Proof of a verified reset OTP, consumed by the new-password screen. */
  resetContext: ResetContext | null
  setResetContext: (context: ResetContext | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = use(AuthContext)
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>")
  return value
}
