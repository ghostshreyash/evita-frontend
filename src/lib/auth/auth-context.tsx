import { useCallback, useMemo, useState } from "react"

import { AuthContext, type AuthContextValue } from "./context"
import type { AuthSession, AuthUser, OtpChallenge, ResetContext } from "./types"

const STORAGE_KEY = "evita.session"

/**
 * Session storage policy: "Remember Me" persists across browser restarts in
 * localStorage, otherwise the session dies with the tab (sessionStorage).
 * Pending OTP challenges and reset tokens are deliberately kept in memory only —
 * a refresh mid-flow sends the user back to the start, which is what we want.
 */
function readStoredSession(): AuthSession | null {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw) as AuthSession
    } catch {
      // Corrupt or unavailable storage: treat as signed out.
    }
  }
  return null
}

function writeStoredSession(session: AuthSession | null) {
  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    if (session) {
      const store = session.remember ? localStorage : sessionStorage
      store.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  } catch {
    // Private-mode browsers: the session simply stays in memory.
  }
}



export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(readStoredSession)
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)
  const [resetContext, setResetContext] = useState<ResetContext | null>(null)

  const signIn = useCallback((user: AuthUser, remember: boolean) => {
    const next: AuthSession = { user, issuedAt: Date.now(), remember }
    writeStoredSession(next)
    setSession(next)
    setChallenge(null)
  }, [])

  const signOut = useCallback(() => {
    // TODO: POST /auth/logout to revoke the refresh token server-side.
    writeStoredSession(null)
    setSession(null)
    setChallenge(null)
    setResetContext(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      signIn,
      signOut,
      challenge,
      setChallenge,
      resetContext,
      setResetContext,
    }),
    [session, signIn, signOut, challenge, resetContext]
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
