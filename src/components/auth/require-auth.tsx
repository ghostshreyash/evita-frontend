import { Navigate, Outlet, useLocation } from "react-router"

import { useAuth } from "@/lib/auth/context"

/**
 * Gate for the EVITA app.
 *
 * Someone who asked for a particular page goes to sign-in with that page in
 * `next`, so the one-time-code step can hand them straight back to it. Anyone
 * else simply gets the sign-in screen for this hostname.
 */
export function RequireAuth() {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    const wanted = `${location.pathname}${location.search}`
    if (wanted === "/") return <Navigate to="/login" replace />
    return <Navigate to={`/login?next=${encodeURIComponent(wanted)}`} replace />
  }
  return <Outlet />
}

/** Keeps signed-in users out of the auth screens. */
export function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  if (session) return <Navigate to="/" replace />
  return children
}
