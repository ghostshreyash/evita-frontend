import { Mail, MessageSquare, PhoneCall } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CHANNEL_LABEL, OTP_LENGTH } from "@/lib/auth/auth-service"
import type { OtpChallenge, OtpChannel } from "@/lib/auth/types"

const channelIcon: Record<OtpChannel, React.ReactNode> = {
  sms: <MessageSquare className="size-5" />,
  email: <Mail className="size-5" />,
  voice: <PhoneCall className="size-5" />,
}

const channelHint: Record<OtpChannel, string> = {
  sms: "Text message to your registered mobile number",
  email: "Code sent to your registered e-mail address",
  voice: "We call your mobile and read the code out",
}

/** "Try another way" — pick a different delivery channel for the same code. */
export function OtpChannelPicker({
  open,
  onOpenChange,
  challenge,
  destinations,
  onSelect,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: OtpChallenge
  /** Masked destination per channel, e.g. { sms: "+91 ••••• ••210" }. */
  destinations: Partial<Record<OtpChannel, string>>
  onSelect: (channel: OtpChannel) => void
  busy?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>How should we send your code?</DialogTitle>
          <DialogDescription>
            Choose another way to receive the {OTP_LENGTH}-digit verification code.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {challenge.availableChannels.map((channel) => {
            const current = channel === challenge.channel
            return (
              <Button
                key={channel}
                type="button"
                variant="outline"
                disabled={busy || current}
                onClick={() => onSelect(channel)}
                className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
              >
                <span className="text-primary">{channelIcon[channel]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {CHANNEL_LABEL[channel]}
                    {current ? <span className="ml-2 text-xs font-normal text-muted-foreground">(current)</span> : null}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {destinations[channel] ?? channelHint[channel]}
                  </span>
                </span>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
