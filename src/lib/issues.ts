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
 * it through Open, In Progress and Closed. Those three are OCC's states, and
 * from a tablet they answer a question nobody is asking: what the engineer
 * wants to know is whether the thing they reported has been dealt with. So the
 * screen shows two states, the same way the task book settled on one finished
 * state rather than carrying OCC's sign-off as a status of its own.
 *
 * Scoped by name, which is how `raiseTicket` stamps a reporter and how the
 * notifications already find an engineer's own tickets.
 */

/** Pending is everything still with the desk; Completed is everything settled */
export type IssueState = "pending" | "completed"

export const issueStates: IssueState[] = ["pending", "completed"]

export const issueStateLook: Record<IssueState, { label: string; badge: "warning" | "success"; stripe: string }> = {
  pending: { label: "Pending", badge: "warning", stripe: "bg-attention" },
  completed: { label: "Completed", badge: "success", stripe: "bg-healthy" },
}

/**
 * Which of the two a ticket is in. Closed is the end of a ticket's life;
 * Completed is carried as well because the shared status map has it and a
 * reopened ticket is back with the desk, so it is pending again.
 */
export const issueStateOf = (status: WorkStatus): IssueState =>
  status === "closed" || status === "completed" ? "completed" : "pending"

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
