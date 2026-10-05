import { useState } from "react"
import { toast } from "sonner"
import { Mail, MessageSquare, PhoneCall, RefreshCw, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { AuthNotice, AuthSubmit } from "@/components/auth/auth-screen"
import { OtpChannelPicker } from "@/components/auth/otp-channel-picker"
import { formatDuration, useCountdown } from "@/hooks/use-countdown"
import { AuthError, type OtpChallenge, type OtpChannel } from "@/lib/auth/types"
import { CHANNEL_LABEL, OTP_LENGTH, resendOtp, switchOtpChannel } from "@/lib/auth/auth-service"
import { fallbackChannelFor } from "@/lib/auth/otp-policy"

const channelIcon: Record<OtpChannel, React.ReactNode> = {
  sms: <MessageSquare className="size-5" />,
  email: <Mail className="size-5" />,
  voice: <PhoneCall className="size-5" />,
}

const sentVerb: Record<OtpChannel, string> = {
  sms: "sent by SMS to",
  email: "sent by e-mail to",
  voice: "read out in a call to",
}

/**
 * The one-time-code step, shared by login, password reset and access requests.
 *
 * Presentation only: AWS issues and checks the code. The screen collects the
 * digits, counts down the expiry the backend gave it, and offers the three ways
 * out when the SMS does not arrive — resend, e-mail instead, or another channel.
 */
export function OtpForm({
  challenge,
  onChallengeChange,
  onVerify,
  verifyLabel = "Verify & continue",
  destinations,
  recoveryHref = "/account-recovery",
}: {
  challenge: OtpChallenge
  onChallengeChange: (challenge: OtpChallenge) => void
  /** Resolve to continue; reject with an AuthError to show its message. */
  onVerify: (code: string) => Promise<void>
  verifyLabel?: string
  destinations?: Partial<Record<OtpChannel, string>>
  /** Set to null to hide the recovery link (e.g. on access requests). */
  recoveryHref?: string | null
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [sending, setSending] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lastSubmitted, setLastSubmitted] = useState("")

  const expiry = useCountdown(challenge.expiresAt)
  const cooldown = useCountdown(challenge.resendAvailableAt)

  // A new code (resend or channel switch) clears the previous attempt.
  const issued = `${challenge.id}:${challenge.channel}:${challenge.expiresAt}`
  const [trackedIssue, setTrackedIssue] = useState(issued)
  if (trackedIssue !== issued) {
    setTrackedIssue(issued)
    setCode("")
    setError(null)
    setLastSubmitted("")
  }

  async function verify(value: string) {
    if (busy) return
    setLastSubmitted(value)
    setBusy(true)
    setError(null)
    try {
      await onVerify(value)
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "We could not verify that code. Please try again.")
      setCode("")
      setLastSubmitted("")
    } finally {
      setBusy(false)
    }
  }

  // Submit as soon as the last digit lands — no extra click for the common case.
  function handleChange(value: string) {
    setCode(value)
    if (error) setError(null)
    if (value.length === OTP_LENGTH && value !== lastSubmitted && !expiry.expired) void verify(value)
  }

  async function send(action: () => Promise<OtpChallenge>, message: string) {
    setSending(true)
    setError(null)
    try {
      onChallengeChange(await action())
      toast.success(message)
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "We could not send a new code. Please try again.")
    } finally {
      setSending(false)
      setPickerOpen(false)
    }
  }

  const resend = () =>
    send(() => resendOtp(challenge), `A new code has been ${sentVerb[challenge.channel]} ${challenge.sentTo}.`)

  const sendToChannel = (channel: OtpChannel) =>
    send(() => switchOtpChannel(challenge, channel), `Code sent by ${CHANNEL_LABEL[channel].toLowerCase()}.`)

  /*
   * The other way of reaching this person, offered as one link. Which one it is
   * depends on where the code went: an e-mail-first role is offered their phone,
   * an SMS-first role is offered their inbox.
   */
  const other = fallbackChannelFor(challenge.channel)
  const otherAvailable = challenge.availableChannels.includes(other)
  const otherLabel = other === "email" ? "Send to e-mail instead" : "Send to phone instead"

  return (
    <div>
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          {channelIcon[challenge.channel]}
        </span>
        <p className="min-w-0 text-sm text-muted-foreground">
          Code {sentVerb[challenge.channel]}{" "}
          <span className="font-semibold tracking-wide text-foreground">{challenge.sentTo}</span>
        </p>
      </div>

      {error ? <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice> : null}
      {!error && expiry.expired ? (
        <AuthNotice variant="warning" icon={<TriangleAlert className="size-4" />}>
          This code has expired. Request a new one below.
        </AuthNotice>
      ) : null}

      <div className="flex justify-center">
        <InputOTP
          maxLength={OTP_LENGTH}
          value={code}
          onChange={handleChange}
          disabled={busy}
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          aria-label={`${OTP_LENGTH}-digit verification code`}
          aria-invalid={Boolean(error)}
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: OTP_LENGTH }, (_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className={cn(
                  "size-14 rounded-xl border bg-background text-2xl font-semibold transition-all duration-200",
                  "first:rounded-l-xl last:rounded-r-xl",
                  "data-[active=true]:scale-105 data-[active=true]:border-primary data-[active=true]:ring-primary/30",
                  code.length > i && "border-primary/50 bg-primary/5"
                )}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      <p aria-live="polite" className="mt-3 text-center text-xs text-muted-foreground">
        {expiry.expired ? "Code expired" : `Expires in ${formatDuration(expiry.remaining)}`}
      </p>

      <AuthSubmit busy={busy} disabled={code.length !== OTP_LENGTH || expiry.expired} className="mt-5">
        {busy ? <Spinner /> : null} {verifyLabel}
      </AuthSubmit>

      <div className="mt-5 border-t pt-4 text-center text-sm">
        <p className="text-muted-foreground">Didn&apos;t receive the code?</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {cooldown.expired ? (
            <button
              type="button"
              onClick={resend}
              disabled={sending}
              className="inline-flex min-h-11 items-center gap-1.5 px-2 font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              {sending ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />} Resend code
            </button>
          ) : (
            <span aria-live="polite" className="text-muted-foreground">
              Resend available in {formatDuration(cooldown.remaining)}
            </span>
          )}

          {otherAvailable ? (
            <button
              type="button"
              onClick={() => sendToChannel(other)}
              disabled={sending}
              className="inline-flex min-h-11 items-center gap-1.5 px-2 font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              {other === "email" ? <Mail className="size-3.5" /> : <MessageSquare className="size-3.5" />} {otherLabel}
            </button>
          ) : null}

          {challenge.availableChannels.length > 1 ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={sending}
              className="min-h-11 px-2 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            >
              Try another way
            </button>
          ) : null}
        </div>

        {recoveryHref ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Can&apos;t access your phone or e-mail?{" "}
            <a href={recoveryHref} className="text-primary underline-offset-4 hover:underline">
              Recover your account
            </a>
          </p>
        ) : null}
      </div>

      <OtpChannelPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        challenge={challenge}
        destinations={destinations ?? {}}
        onSelect={sendToChannel}
        busy={sending}
      />
    </div>
  )
}
