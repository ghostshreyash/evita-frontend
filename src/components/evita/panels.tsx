import { ScanQrDialog } from "@/components/evita/scan-qr-dialog"
import { ReportIssueDialog } from "@/components/evita/report-issue-dialog"
import { SafetyDialog, SopDialog } from "@/components/evita/guidance-dialogs"
import { NotificationsSheet } from "@/components/evita/notifications-sheet"
import { closePanel, usePanel } from "@/lib/ui-store"

/**
 * The shared panels, mounted once in the app shell. Whichever screen calls
 * `openPanel` gets the same dialog; keyed on the panel so each opening starts
 * with a fresh form.
 */
export function Panels() {
  const panel = usePanel()
  const close = (open: boolean) => !open && closePanel()

  return (
    <>
      {panel?.kind === "scan" ? <ScanQrDialog open onOpenChange={close} /> : null}
      {panel?.kind === "issue" ? <ReportIssueDialog key={JSON.stringify(panel)} context={panel} onOpenChange={close} /> : null}
      {panel?.kind === "sop" ? <SopDialog key={panel.activity ?? "sop"} activity={panel.activity} onOpenChange={close} /> : null}
      {panel?.kind === "safety" ? <SafetyDialog onOpenChange={close} /> : null}
      {panel?.kind === "notifications" ? <NotificationsSheet onOpenChange={close} /> : null}
    </>
  )
}
