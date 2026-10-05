import { Navigate, useLocation, useNavigate } from "react-router"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AuthCard, AuthScreen } from "@/components/auth/auth-screen"
import { BrandStory } from "@/components/auth/brand-story"
import { OtpForm } from "@/components/auth/otp-form"
import { useAuth } from "@/lib/auth/context"
import { otpDestinations, verifyOtp } from "@/lib/auth/auth-service"

/**
 * Sign in — step 2 of 2.
 *
 * The same screen as the password step: same story panel, same card in the
 * same place, with the code replacing the credentials. Reached only with a live
 * challenge, so a refresh returns to step 1 rather than stranding the engineer
 * on a code that no longer exists.
 */
export function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { challenge, setChallenge, signIn } = useAuth()

  if (!challenge || challenge.purpose !== "login") return <Navigate to="/login" replace />

  const remember = (location.state as { remember?: boolean } | null)?.remember ?? false

  return (
    <AuthScreen story={<BrandStory />}>
      <AuthCard title="Two-step verification" description="One more step to keep your account secure.">
        <OtpForm
          challenge={challenge}
          onChallengeChange={setChallenge}
          destinations={otpDestinations()}
          verifyLabel="Verify & continue"
          onVerify={async (code) => {
            const user = await verifyOtp(challenge, code)
            signIn(user, remember)
            navigate(challenge.next ?? "/", { replace: true })
          }}
        />
      </AuthCard>

      <div className="mt-4 text-center">
        <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => navigate("/login")}>
          <ArrowLeft /> Back to sign in
        </Button>
      </div>
    </AuthScreen>
  )
}
