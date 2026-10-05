import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from "react-router"
import { ArrowLeft, KeyRound, Mail, Smartphone, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { Spinner } from "@/components/ui/spinner"
import { TextField } from "@/components/form/fields"
import { AuthAside, AuthCard, AuthNotice, AuthScreen, AuthSubmit } from "@/components/auth/auth-screen"
import { AuthSteps } from "@/components/auth/auth-steps"
import { useAuth } from "@/lib/auth/context"
import { requestPasswordReset } from "@/lib/auth/auth-service"
import { AuthError } from "@/lib/auth/types"
import { RESET_STEPS, identifySchema, type IdentifyValues } from "./schemas"

/** Step 1 of password reset: find the account by registered mobile or e-mail. */
export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { setChallenge } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<IdentifyValues>({
    resolver: zodResolver(identifySchema),
    defaultValues: { method: "mobile", identifier: "" },
  })
  const method = form.watch("method")

  async function onSubmit(values: IdentifyValues) {
    setError(null)
    try {
      setChallenge(await requestPasswordReset(values.identifier))
      navigate("/forgot-password/verify")
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "We could not start the reset. Please try again.")
    }
  }

  return (
    <AuthScreen>
      <AuthCard
       
        emblem={false}
        title="Forgot your password?"
        description="We will send a one-time code to confirm it is you."
        above={<AuthSteps steps={RESET_STEPS} current={0} />}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error ? <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice> : null}

          <div
            role="radiogroup"
            aria-label="Where should we send the code?"
            className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1"
          >
            {(
              [
                { value: "mobile", label: "Registered mobile", icon: Smartphone },
                { value: "email", label: "Registered e-mail", icon: Mail },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={method === value}
                onClick={() => {
                  form.setValue("method", value)
                  form.setValue("identifier", "")
                  form.clearErrors()
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  method === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <TextField
            control={form.control}
            name="identifier"
            label={method === "mobile" ? "Mobile number" : "E-mail address"}
            type={method === "mobile" ? "tel" : "email"}
            inputMode={method === "mobile" ? "tel" : "email"}
            autoComplete={method === "mobile" ? "tel" : "email"}
            placeholder={method === "mobile" ? "+91 98765 43210" : "you@company.com"}
            startIcon={method === "mobile" ? <Smartphone /> : <Mail />}
            inputClassName="h-11"
            description={
              method === "mobile"
                ? "The mobile number registered on your account."
                : "The e-mail address registered on your account."
            }
          />

          <AuthSubmit busy={form.formState.isSubmitting} className="mt-5">
            {form.formState.isSubmitting ? <Spinner /> : <KeyRound />} Send verification code
          </AuthSubmit>
        </form>
      </AuthCard>

      <AuthAside>
        <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-brand-gold">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
        <span className="mx-2 opacity-40">|</span>
        <Link to="/account-recovery" className="font-semibold text-brand-gold underline-offset-4 hover:underline">
          No access to either?
        </Link>
      </AuthAside>
    </AuthScreen>
  )
}
