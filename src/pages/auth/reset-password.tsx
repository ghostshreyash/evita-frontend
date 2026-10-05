import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, Navigate } from "react-router"
import { Lock, LogIn, ShieldCheck, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { PasswordField } from "@/components/form/fields"
import { PasswordRequirements, PasswordStrength } from "@/components/form/password-requirements"
import { AuthCard, AuthNotice, AuthScreen, AuthSubmit } from "@/components/auth/auth-screen"
import { AuthResult } from "@/components/auth/auth-result"
import { AuthSteps } from "@/components/auth/auth-steps"
import { useAuth } from "@/lib/auth/context"
import { resetPassword } from "@/lib/auth/auth-service"
import { AuthError } from "@/lib/auth/types"
import { RESET_STEPS, newPasswordSchema, type NewPasswordValues } from "./schemas"

/**
 * Step 3 of password reset — also the screen an administrator-created account
 * lands on the first time it signs in.
 */
export function ResetPasswordPage() {
  const { resetContext, setResetContext } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const form = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  })
  const password = form.watch("password")

  if (!resetContext && !done) return <Navigate to="/forgot-password" replace />

  async function onSubmit(values: NewPasswordValues) {
    if (!resetContext) return
    setError(null)
    try {
      await resetPassword(resetContext, values.password)
      setResetContext(null)
      setDone(true)
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "We could not update your password. Please try again.")
    }
  }

  if (done) {
    return (
      <AuthScreen>
        <AuthCard emblem={false} title="Password updated" above={<AuthSteps steps={RESET_STEPS} current={3} />}>
          <AuthResult
            title="Your password has been changed"
            description="Use your new password the next time you sign in."
            notes={[
              "All other sessions have been signed out.",
              "A confirmation has been sent to your registered e-mail address.",
            ]}
          >
            <Button size="lg" asChild className="h-11 w-full text-base font-semibold">
              <Link to="/login?reason=reset">
                <LogIn /> Back to sign in
              </Link>
            </Button>
          </AuthResult>
        </AuthCard>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen>
      <AuthCard
       
        emblem={false}
        title="Set a new password"
        description="Choose a strong password you have not used before."
        above={<AuthSteps steps={RESET_STEPS} current={2} />}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error ? <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice> : null}

          <p className="mb-4 text-xs text-muted-foreground">
            Verified with the code sent to <span className="font-semibold text-foreground">{resetContext?.sentTo}</span>
          </p>

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
            {form.formState.isSubmitting ? <Spinner /> : <ShieldCheck />} Update password
          </AuthSubmit>
        </form>
      </AuthCard>
    </AuthScreen>
  )
}
