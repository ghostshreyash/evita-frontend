import { useMemo } from "react"

import type { TicketRow } from "@/data/occ-tables"
import type { TicketDetail } from "@/data/ticket-detail"
import { useTicketDetails, useTicketRows } from "@/data/ticket-store"
import { useCurrentElpremar } from "@/lib/me"
import type { WorkStatus } from "@/lib/status"

/**
 * The issues this ELPREMAR has reported, as the field reads them.
 *
 * An issue is a support ticket - Report an Issue raises one, and the desk works
 * it through **Open, In Progress and Completed**. All three are shown: the
 * engineer who reported a fault wants to know whether anyone has picked it up,
 * not only whether it is finished, and "in progress" is the answer to that.
 *
 * The same three in EMMS-E, on the same rows - see `ticketStatuses`.
 *
 * Scoped by name, which is how `raiseTicket` stamps a reporter and how the
 * notifications already find an engineer's own tickets.
 */

/** The three states a reported issue runs through */
export type IssueState = "open" | "in_progress" | "completed"

export const issueStates: IssueState[] = ["open", "in_progress", "completed"]

export const issueStateLook: Record<IssueState, { label: string; badge: "critical" | "warning" | "success"; stripe: string }> = {
  open: { label: "Open", badge: "critical", stripe: "bg-critical" },
  in_progress: { label: "In Progress", badge: "warning", stripe: "bg-attention" },
  completed: { label: "Completed", badge: "success", stripe: "bg-healthy" },
}

/**
 * Which of the three a ticket is in.
 *
 * `closed` and `reopened` are folded in rather than shown: the shared status
 * map carries them for OCC's own console, and a ticket that came back is with
 * the desk again, which from the field is simply Open.
 */
export const issueStateOf = (status: WorkStatus): IssueState =>
  status === "completed" || status === "closed" ? "completed" : status === "in_progress" ? "in_progress" : "open"

/** One reported issue: its row, which of the two states it is in, and what it holds */
export type ReportedIssue = {
  row: TicketRow
  state: IssueState
  detail?: TicketDetail
}

/** `dd-MM-yyyy HH:mm` or `dd-MM-yyyy` → sortable number, newest largest */
const order = (stamp: string) => {
  const [date, time = "00:00"] = stamp.split(" ")
  const [d = "01", m = "01", y = "1970"] = date.split("-")
  return Number(`${y}${m}${d}${time.replace(":", "")}`)
}

export function useMyReportedIssues(): ReportedIssue[] {
  const me = useCurrentElpremar()
  const rows = useTicketRows()
  const details = useTicketDetails()

  return useMemo(
    () =>
      rows
        .filter((row) => row.raisedBy === me.name)
        /* Newest first: the one just raised is the one being looked for */
        .sort((a, b) => order(b.lastUpdated) - order(a.lastUpdated) || b.id.localeCompare(a.id))
        .map((row) => ({ row, state: issueStateOf(row.status), detail: details[row.id] })),
    [rows, details, me]
  )
}
