import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Navigate, useLocation, useNavigate } from "react-router"
import { KeyRound, Lock, TriangleAlert } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { PasswordField } from "@/components/form/fields"
import { PasswordRequirements, PasswordStrength } from "@/components/form/password-requirements"
import { AuthCard, AuthNotice, AuthScreen, AuthSubmit } from "@/components/auth/auth-screen"
import { BrandStory } from "@/components/auth/brand-story"
import { useAuth } from "@/lib/auth/context"
import { completeNewPassword, hasPendingSignIn } from "@/lib/auth/auth-service"
import { AuthError } from "@/lib/auth/types"
import { newPasswordSchema, type NewPasswordValues } from "./schemas"

/**
 * Forced password change — the first screen of every ELPREMAR's first sign-in.
 *
 * OCC creates the account with a temporary password Cognito e-mails over, which
 * leaves it in FORCE_CHANGE_PASSWORD: the password is accepted but no session is
 * issued until it is replaced. This sits between the password step and the code
 * step, and the login screen routes here on `NewPasswordRequired`.
 *
 * Answering the challenge normally leads to the e-mail code, so this hands off
 * to `/login/verify` rather than signing anyone in itself. If the pool does not
 * enforce MFA, the session is complete here and it goes to the home screen.
 */
export function NewPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, setChallenge } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const state = (location.state ?? {}) as { remember?: boolean; next?: string }

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  })
  const password = form.watch("password")

  /*
   * Amplify holds the open challenge in memory, so a refresh here loses it and
   * there is nothing left to answer — back to the start of the sign-in.
   */
  if (!hasPendingSignIn()) return <Navigate to="/login" replace />

  async function onSubmit(values: NewPasswordValues) {
    setError(null)
    try {
      const result = await completeNewPassword(values.password, state.next)

      if ("challenge" in result) {
        setChallenge(result.challenge)
        navigate("/login/verify", { state: { remember: state.remember } })
        return
      }

      // No MFA on this pool: the session is already complete
      signIn(result.user, state.remember ?? false)
      navigate(state.next ?? "/", { replace: true })
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Could not set that password. Please try again.")
    }
  }

  return (
    <AuthScreen story={<BrandStory />}>
      <AuthCard
        title="Choose your password"
        description="Your account was set up with a temporary password. Pick your own to continue."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error ? <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice> : null}

          <div className="space-y-4">
            <PasswordField control={form.control} name="password" label="New password" required startIcon={<Lock />} />
            <PasswordStrength value={password} />
            <PasswordField
              control={form.control}
              name="confirmPassword"
              label="Confirm password"
              required
              startIcon={<Lock />}
            />
            <PasswordRequirements value={password} />
          </div>

          <AuthSubmit busy={form.formState.isSubmitting} className="mt-5">
            {form.formState.isSubmitting ? <Spinner /> : <KeyRound />} Set password & continue
          </AuthSubmit>
        </form>
      </AuthCard>
    </AuthScreen>
  )
}
