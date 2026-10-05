import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router"
import { ArrowRight, Info, Lock, ShieldAlert, TriangleAlert, UserRound } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { PasswordField, TextField } from "@/components/form/fields"
import { AuthCard, AuthNotice, AuthScreen, AuthSubmit } from "@/components/auth/auth-screen"
import { BrandStory } from "@/components/auth/brand-story"
import { brand } from "@/config/brand"
import { useAuth } from "@/lib/auth/context"
import { signIn } from "@/lib/auth/auth-service"
import { AuthError } from "@/lib/auth/types"
import { portalLoginSchema, type PortalLoginValues } from "./schemas"

/** Why the visitor was sent back here, set by the guard or by signing out. */
const reasons: Record<string, string> = {
  expired: "Your session has expired. Please sign in again.",
  "signed-out": "You have been signed out.",
  reset: "Password updated. Sign in with your new password.",
}

/**
 * Sign in — step 1 of 2. The ELPREMAR signs in with their username; the
 * one-time code that follows is the same flow the OCC console uses.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setChallenge } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const next = params.get("next") ?? undefined
  const reason = reasons[params.get("reason") ?? ""]
  const { login } = brand

  const form = useForm<PortalLoginValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  })

  async function onSubmit(values: PortalLoginValues) {
    setError(null)
    try {
      setChallenge(await signIn(values.identifier, values.password, next))
      navigate("/login/verify", { state: { remember: values.remember } })
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Sign in failed. Please try again.")
    }
  }

  return (
    <AuthScreen story={<BrandStory />}>
      <AuthCard title={login.heading} description={login.description}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error ? (
            <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice>
          ) : reason ? (
            <AuthNotice variant="info" icon={<Info className="size-4" />}>
              {reason}
            </AuthNotice>
          ) : null}

          <div className="space-y-4">
            <TextField
              control={form.control}
              name="identifier"
              label={login.identifierLabel}
              required
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={login.identifierPlaceholder}
              startIcon={<UserRound />}
              clearable
              inputClassName="h-12 text-base"
            />
            <PasswordField
              control={form.control}
              name="password"
              label="Password"
              required
              startIcon={<Lock />}
              placeholder="Enter your password"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-base">
            {/* The whole label is the hit area, not just the 20px box */}
            <Label htmlFor="remember" className="-my-2 flex min-h-11 cursor-pointer items-center gap-3 font-normal">
              <Checkbox
                id="remember"
                className="size-5"
                checked={form.watch("remember")}
                onCheckedChange={(v) => form.setValue("remember", v === true)}
              />
              Remember me
            </Label>
            <Link
              to="/forgot-password"
              className="-my-2 flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <AuthSubmit busy={form.formState.isSubmitting} className="mt-5">
            {form.formState.isSubmitting ? <Spinner /> : null}
            {login.submitLabel}
            {form.formState.isSubmitting ? null : <ArrowRight />}
          </AuthSubmit>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-info-soft px-3 py-3 text-sm text-info-soft-foreground">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
            <span>
              <span className="block font-semibold">{login.notice.title}</span>
              {login.notice.body}
            </span>
          </div>
        </form>
      </AuthCard>
    </AuthScreen>
  )
}
