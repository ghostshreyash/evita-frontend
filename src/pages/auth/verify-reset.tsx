import { Link, Navigate, useNavigate } from "react-router"
import { ArrowLeft } from "lucide-react"

import { AuthAside, AuthCard, AuthScreen } from "@/components/auth/auth-screen"
import { AuthSteps } from "@/components/auth/auth-steps"
import { OtpForm } from "@/components/auth/otp-form"
import { useAuth } from "@/lib/auth/context"
import { RESET_STEPS } from "./schemas"

/**
 * Step 2 of password reset.
 *
 * The code is not checked here: Cognito verifies it together with the new
 * password, so the entered code travels to the next screen in the reset context.
 */
export function VerifyResetPage() {
  const navigate = useNavigate()
  const { challenge, setChallenge, setResetContext } = useAuth()

  if (!challenge || challenge.purpose !== "password-reset") return <Navigate to="/forgot-password" replace />

  return (
    <AuthScreen>
      <AuthCard
       
        emblem={false}
        title="Verify it's you"
        description="Enter the code we sent so you can choose a new password."
        above={<AuthSteps steps={RESET_STEPS} current={1} />}
      >
        <OtpForm
          challenge={challenge}
          onChallengeChange={setChallenge}
          verifyLabel="Continue"
          onVerify={async (code) => {
            setResetContext({ challengeId: challenge.id, code, sentTo: challenge.sentTo })
            navigate("/reset-password")
          }}
        />
      </AuthCard>

      <AuthAside>
        <Link to="/forgot-password" className="inline-flex items-center gap-1.5 hover:text-brand-gold">
          <ArrowLeft className="size-4" /> Use a different account
        </Link>
      </AuthAside>
    </AuthScreen>
  )
}
