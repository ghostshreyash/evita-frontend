import { useMemo, useState, useSyncExternalStore } from "react"
import { format, formatDistanceToNowStrict, isToday, parse } from "date-fns"

import { useMaintenanceDetails } from "@/data/maintenance-store"
import { useTicketRows } from "@/data/ticket-store"
import { useCurrentElpremar } from "@/lib/me"
import { actionFor, parseDay, useMyJobs, when } from "@/lib/work"
import { workStatus } from "@/lib/status"

/**
 * What the ELPREMAR is told about: work booked to them, OCC's verdict on
 * maintenance they submitted, and progress on tickets they raised.
 *
 * Derived from the same books the screens show, so a notification can never
 * point at work that does not exist. Read state is kept on the tablet.
 * TODO: replace with the notifications API / Web Push once the backend exists.
 */
export type Notice = {
  id: string
  title: string
  detail: string
  at: number
  /** Where tapping it goes; empty when there is no screen for it */
  to: string
  tone: "info" | "success" | "critical" | "warning"
}

const READ_KEY = "evita.notifications.read"

function readIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[]
  } catch {
    return []
  }
}

let read = new Set(readIds())
let version = 0
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

function persist() {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read].slice(-300)))
  } catch {
    // Read state simply resets next visit
  }
  version++
  listeners.forEach((l) => l())
}

export const markRead = (id: string) => {
  read = new Set(read).add(id)
  persist()
}

export const markAllRead = (ids: string[]) => {
  read = new Set([...read, ...ids])
  persist()
}

/** `dd-MM-yyyy HH:mm` → epoch ms */
const stamp = (s: string) => parse(s, "dd-MM-yyyy HH:mm", new Date()).getTime()

export function useNotifications() {
  const me = useCurrentElpremar()
  const jobs = useMyJobs()
  const maintenance = useMaintenanceDetails()
  const tickets = useTicketRows()
  useSyncExternalStore(subscribe, () => version)
  // Fixed when the screen opens; the list is rebuilt whenever the books change anyway
  const [now] = useState(() => Date.now())

  const notices = useMemo(() => {
    const list: Notice[] = []

    for (const job of jobs) {
      const at = when(job)
      // Booked work shows from the day before it is due, once there is something to do
      if (actionFor(job) === "start" && at - now < 3 * 86_400_000)
        list.push({
          id: `assigned:${job.id}`,
          title: `New task assigned: ${job.activity}`,
          detail: `${job.asset} · ${job.plant} · ${format(parseDay(job.date), "d MMM")}`,
          at: Math.min(at - 86_400_000, now),
          to: `/my-tasks/${job.id}`,
          tone: "info",
        })

      const review = job.kind === "maintenance" ? maintenance[job.id]?.review : undefined
      if (review)
        list.push({
          id: `review:${job.id}:${review.at}`,
          title: review.outcome === "approved" ? `Approved: ${job.asset}` : `Sent back for correction: ${job.asset}`,
          detail: review.outcome === "approved" ? `${job.id} signed off by ${review.by}` : review.remarks,
          at: stamp(review.at),
          to: `/my-tasks/${job.id}`,
          tone: review.outcome === "approved" ? "success" : "critical",
        })
    }

    for (const t of tickets.filter((t) => t.raisedBy === me.name))
      list.push({
        id: `ticket:${t.id}:${t.status}`,
        title: `${t.id} ${workStatus[t.status].label.toLowerCase()}: ${t.subject}`,
        detail: `${t.category} · ${t.plant}`,
        at: stamp(t.lastUpdated),
        // No ticket screen in EVITA yet: tapping only marks it read
        to: "",
        tone: t.status === "closed" ? "success" : "warning",
      })

    return list.filter((n) => n.at <= now + 86_400_000).sort((a, b) => b.at - a.at).slice(0, 30)
  }, [jobs, maintenance, tickets, me, now])

  return {
    notices: notices.map((n) => ({ ...n, unread: !read.has(n.id) })),
    unread: notices.filter((n) => !read.has(n.id)).length,
  }
}

/** "Just now", "2h ago" for recent, "10:24" earlier today, "Fri 9 Oct" otherwise */
export function noticeTime(at: number) {
  const now = new Date().getTime()
  if (at > now) return format(at, "d MMM, HH:mm")
  if (now - at < 60_000) return "Just now"
  if (isToday(at)) return now - at < 3 * 3_600_000 ? `${formatDistanceToNowStrict(at)} ago` : format(at, "HH:mm")
  return format(at, "EEE d MMM")
}
