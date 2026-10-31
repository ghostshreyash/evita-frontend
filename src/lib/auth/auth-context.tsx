import { useCallback, useEffect, useMemo, useState } from "react"

import { endSignOut } from "@/lib/api/client"

import { AuthContext, type AuthContextValue } from "./context"
import { currentUser, signOutCognito } from "./auth-service"
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

  /*
   * On `main` the stored session is only a convenience for the first paint: the
   * tokens behind it are Amplify's and can expire or be revoked, and the
   * ELPREMAR record behind those can be deactivated in OCC, so boot re-asks
   * both and drops anything they no longer recognise.
   *
   * On this branch there is nothing to re-ask. `currentUser` therefore answers
   * `unconfirmed` after a reload, which means "keep what was stored" — the
   * stored session is the only record of who signed in. The effect stays so the
   * shape matches `main` and so a session opened in this tab is still refreshed
   * from the one place that knows it.
   */
  useEffect(() => {
    let cancelled = false

    void currentUser().then((boot) => {
      if (cancelled) return
      // Nothing could be confirmed: leave the stored session exactly as it is
      if (boot.status === "unconfirmed") return

      setSession((current) => {
        if (boot.status === "refused") {
          if (current) writeStoredSession(null)
          return null
        }
        const next: AuthSession = { ...(current ?? { issuedAt: Date.now(), remember: true }), user: boot.user }
        writeStoredSession(next)
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  /** Drops this tab's session without touching Cognito */
  const clearLocalSession = useCallback(() => {
    writeStoredSession(null)
    setSession(null)
    setChallenge(null)
    setResetContext(null)
  }, [])

  const signIn = useCallback((user: AuthUser, remember: boolean) => {
    /*
     * The sign-out block stays up from the last logout until here, so a new
     * session is what lifts it. Both ways in — the code screen and the forced
     * password change — complete through this one call.
     */
    endSignOut()
    const next: AuthSession = { user, issuedAt: Date.now(), remember }
    writeStoredSession(next)
    setSession(next)
    setChallenge(null)
  }, [])

  const signOut = useCallback(async () => {
    /*
     * Clear this tab first so the app is unusable straight away, then wait for
     * the tokens themselves to go. Returning before that resolved was the bug
     * in the OCC console: a reload in the gap found the tokens still in storage
     * and signed the user back in.
     */
    clearLocalSession()
    await signOutCognito()
  }, [clearLocalSession])

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
