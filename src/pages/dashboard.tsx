import { useMemo } from "react"
import { format } from "date-fns"
import { CalendarDays, ClipboardList } from "lucide-react"

import { NextTask, QuickActions, UpcomingTasks } from "@/components/evita/home-hero"
import { EnterpriseSwitch } from "@/components/evita/enterprise-switch"
import { useCurrentElpremar } from "@/lib/me"
import { isThisWeek, useMyJobs } from "@/lib/work"

/**
 * The ELPREMAR's own screen: who they are, what they can start from here, and
 * the work in front of them. Nothing else - the register, the notifications and
 * the list of what is under way all have a section of their own on the tab bar,
 * and a second copy here only made the screen longer to scroll. The safety
 * reminder moved to the top bar, where it is on screen on every page.
 */
export function DashboardPage() {
  const me = useCurrentElpremar()
  const jobs = useMyJobs()

  // The week at a glance (Monday to Sunday), for the count on the header
  const week = useMemo(() => jobs.filter((j) => isThisWeek(j.date)), [jobs])

  return (
    <div className="space-y-5">
      {/* ---------- Welcome ---------- */}
      <section className="relative overflow-hidden rounded-2xl text-brand-navy-foreground shadow-sm">
        <img src="/brand/evita-login.jpg" alt="" className="absolute inset-0 size-full object-cover object-[center_30%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-navy/30" />

        <div className="relative p-5">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Hello, {me.name} 👋</h2>
          <p className="mt-0.5 text-sm font-medium text-white/90">
            {me.designation} · ELPREMAR <span className="tabular-nums">{me.id}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {/* Which customer's site this is, and the way to the engineer's others */}
            <EnterpriseSwitch className="bg-white/10 ring-white/25 hover:bg-white/20" />
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 tabular-nums ring-1 ring-white/25">
              <CalendarDays className="size-4" /> {format(new Date(), "EEE d MMM")}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-medium ring-1 ring-white/25">
              <ClipboardList className="size-4" /> {week.length} task{week.length === 1 ? "" : "s"} this week
            </span>
          </div>
        </div>
      </section>

      <QuickActions />

      {/* The one in hand, and the three after it */}
      <div className="grid gap-3 lg:grid-cols-2">
        <NextTask />
        <UpcomingTasks />
      </div>

    </div>
  )
}
