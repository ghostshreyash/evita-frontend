import { useNavigate } from "react-router"
import { ChevronRight, ClipboardCheck, ClipboardList, Plus, QrCode, TriangleAlert, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { openPanel } from "@/lib/ui-store"

/**
 * Everything the field needs, one tap from the home screen.
 *
 * At the top rather than down a column: on a tablet held at the panel door
 * these are what the engineer reaches for first, and the client asked for the
 * inspection to be startable from the front screen — "front screen pe ho
 * Start Inspection… usko layman form mein sabse easy rahega" (12-10-2026).
 *
 * Five, and every one of them does something. There is no Log Test Results
 * card because recording readings is the inspection itself, and no Sync card
 * because there is no button to press - records reach the server on their own,
 * and the top bar already shows whether they have.
 */
export function QuickActions() {
  const navigate = useNavigate()

  const actions: Action[] = [
    {
      icon: QrCode,
      title: "Scan Asset QR",
      detail: "Quick access to asset details",
      tone: "bg-info-soft text-info",
      run: () => openPanel({ kind: "scan" }),
    },
    {
      icon: Plus,
      title: "Onboard Asset",
      // The first step in the client's own order: onboard, then inspect
      detail: "Register an asset that is not on the book",
      tone: "bg-info-soft text-primary",
      run: () => navigate("/assets/onboarding"),
    },
    {
      icon: ClipboardCheck,
      title: "Start Inspection",
      // Not a task to be handed one: the engineer picks the asset and goes
      detail: "Scan an asset, or onboard a new one",
      tone: "bg-healthy-soft text-healthy",
      run: () => openPanel({ kind: "begin-inspection" }),
    },
    {
      icon: TriangleAlert,
      title: "Report Issue",
      detail: "Report any equipment problem",
      tone: "bg-critical-soft text-critical",
      run: () => openPanel({ kind: "issue" }),
    },
    {
      icon: ClipboardList,
      title: "View Tasks",
      detail: "See all your assigned tasks",
      tone: "bg-highlight-soft text-highlight",
      run: () => navigate("/my-tasks"),
    },
  ]

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Everything you need for field work</p>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {actions.map((action) => (
          <li key={action.title}>
            <button
              type="button"
              onClick={action.run}
              className="flex h-full min-h-28 w-full flex-col gap-2 rounded-2xl bg-card p-3 text-left shadow-xs ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="flex items-start gap-2.5">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", action.tone)}>
                  <action.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1 text-base leading-tight font-bold text-brand-navy dark:text-foreground">
                  {action.title}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </span>
              <span className="text-xs leading-snug text-muted-foreground">{action.detail}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

type Action = {
  icon: LucideIcon
  title: string
  detail: string
  tone: string
  run: () => void
}
