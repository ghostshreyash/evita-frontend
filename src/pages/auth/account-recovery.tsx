import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "react-router"
import { ArrowLeft, LifeBuoy, LogIn, Phone, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { TextField, TextareaField } from "@/components/form/fields"
import { AuthAside, AuthCard, AuthNotice, AuthScreen, AuthSubmit } from "@/components/auth/auth-screen"
import { AuthResult } from "@/components/auth/auth-result"
import { submitRecovery } from "@/lib/auth/auth-service"
import { AuthError } from "@/lib/auth/types"
import { recoverySchema, type RecoveryValues } from "./schemas"

/**
 * Last-resort recovery: the registered mobile and e-mail are both unreachable,
 * so the helpdesk verifies identity out of band and restores access manually.
 */
export function AccountRecoveryPage() {
  const [reference, setReference] = useState("")
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RecoveryValues>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { fullName: "", employeeId: "", registeredEmail: "", alternateContact: "", reason: "" },
  })

  async function onSubmit(values: RecoveryValues) {
    setError(null)
    try {
      const { reference: ref } = await submitRecovery(values)
      setReference(ref)
      window.scrollTo({ top: 0 })
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "We could not raise your request. Please try again.")
    }
  }

  if (reference) {
    return (
      <AuthScreen>
        <AuthCard emblem={false} title="Recovery request raised">
          <AuthResult
            tone="pending"
            icon={LifeBuoy}
            title="The helpdesk is on it"
            description="Our team will verify your identity and restore access to your account."
            reference={reference}
            referenceLabel="Support ticket"
            notes={[
              "You will be contacted on the alternate number or e-mail you provided.",
              "Keep your Employee / User ID handy for verification.",
              "Typical response time is one working day.",
            ]}
          >
            <Button size="lg" asChild className="h-11 w-full text-base font-semibold">
              <Link to="/login">
                <LogIn /> Back to sign in
              </Link>
            </Button>
          </AuthResult>
        </AuthCard>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen width="wide">
      <AuthCard
       
        emblem={false}
        title="Account recovery"
        description="Use this when you can no longer receive codes on your registered mobile number or e-mail address."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error ? <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice> : null}

          <AuthNotice variant="info" icon={<LifeBuoy className="size-4" />}>
            These details go to the OLIVINE helpdesk, who will verify your identity before restoring access. Nothing is
            changed on your account until then.
          </AuthNotice>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="fullName" label="Full name" required autoComplete="name" />
            <TextField
              control={form.control}
              name="employeeId"
              label="Employee / User ID"
              required
              placeholder="e.g. ELP-1001"
            />
            <TextField
              control={form.control}
              name="registeredEmail"
              label="Registered e-mail"
              type="email"
              required
              placeholder="The address on your account"
            />
            <TextField
              control={form.control}
              name="alternateContact"
              label="Alternate contact"
              required
              placeholder="Mobile or e-mail we can reach you on"
              description="Must be different from the details on the account."
            />
            <TextareaField
              control={form.control}
              name="reason"
              label="What happened?"
              required
              rows={3}
              className="sm:col-span-2"
              placeholder="e.g. Mobile number changed and the registered e-mail mailbox is closed."
            />
          </div>

          <AuthSubmit busy={form.formState.isSubmitting} className="mt-5">
            {form.formState.isSubmitting ? <Spinner /> : <LifeBuoy />} Raise recovery request
          </AuthSubmit>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <Phone className="size-3.5" /> Urgent? Call the 24×7 helpdesk on 1800 123 4567
          </p>
        </form>
      </AuthCard>

      <AuthAside>
        <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-brand-gold">
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </AuthAside>
    </AuthScreen>
  )
}
