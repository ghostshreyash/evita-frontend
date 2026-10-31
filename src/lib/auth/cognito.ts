/**
 * Amplify configuration for EVITA.
 *
 * Imported once from `main.tsx`, before anything renders — Amplify must be
 * configured before the first `aws-amplify/auth` call, and a module import is
 * the only ordering guarantee that survives bundling.
 *
 * The pool is **the same one OCC provisions into**. EVITA has no sign-up: an
 * ELPREMAR's login is created by the control centre's onboarding, and the only
 * thing this app can do with the pool is sign someone in and reset a password.
 *
 * The pool and client ids are not secrets: they ship in the bundle either way.
 * Nothing here may hold an AWS access key or an app-client secret — the client
 * is configured as a public client for exactly that reason.
 *
 * Kept in step with occ-frontend's copy of this file.
 */
import { Amplify } from "aws-amplify"
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito"
import { defaultStorage, sessionStorage } from "aws-amplify/utils"

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID

/** False in a demo build with no pool configured, which keeps the app bootable */
export const cognitoConfigured = Boolean(userPoolId && userPoolClientId)

if (cognitoConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        // OCC creates the account with the engineer's e-mail as the username
        loginWith: { email: true },
      },
    },
  })
} else if (import.meta.env.DEV) {
  console.warn(
    "[auth] VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID are unset — " +
      "sign-in will fail. Set them in .env.local to talk to Cognito."
  )
}

/**
 * Where Amplify keeps its tokens.
 *
 * `defaultStorage` is localStorage: the session survives a browser restart,
 * which is what "Remember Me" means — and on a tablet handed to one engineer
 * that is the normal case. Without it the tokens live in sessionStorage and die
 * with the tab, which is what a shared tablet wants.
 *
 * Both are readable by script, so this is XSS-exposed by construction — the
 * trade every SPA-side Cognito integration makes. Moving the refresh token to
 * an httpOnly cookie means putting the API in front of Cognito; worth doing
 * before this holds anything regulated.
 */
export function setTokenStorage(remember: boolean) {
  cognitoUserPoolsTokenProvider.setKeyValueStorage(remember ? defaultStorage : sessionStorage)
}
