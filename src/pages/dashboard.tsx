import { useMemo } from "react"
import { Link, useNavigate } from "react-router"
import { format } from "date-fns"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  MapPin,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { CategoryIcon } from "@/components/common/category-icon"
import { WorkRow } from "@/components/evita/work-row"
import { NextTask, QuickActions, UpcomingTasks } from "@/components/evita/home-hero"
import { useAssetRows } from "@/data/asset-store"
import { assetCategories } from "@/data/master-data"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { markRead, noticeTime, useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"
import { isThisWeek, useMyJobs } from "@/lib/work"

/** White panel with an icon tile, a navy title and an optional subtitle, as the tablet design draws its cards */
function Panel({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
  children,
}: {
  icon?: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10", className)}>
      <header className="flex min-h-16 items-center gap-3 border-b px-5 py-3">
        {Icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-soft text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-brand-navy dark:text-foreground">{title}</h3>
          {subtitle ? <p className="truncate text-sm text-primary">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

/**
 * The ELPREMAR's own screen: the work in front of them this week, the assets
 * at their site, and who they are. Laid out after the EVITA tablet design; the
 * data and every link are the same as before.
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const jobs = useMyJobs()
  const { notices } = useNotifications()

  // The week at a glance (Monday to Sunday), soonest first
  const week = useMemo(() => jobs.filter((j) => isThisWeek(j.date)), [jobs])
  /*
   * What the engineer walked away from. An inspection under way is the thing
   * they are most likely to have come back to the tablet for, so it leads.
   */
  const running = useMemo(
    () => jobs.filter((j) => j.field === "in_progress").sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "inspection" ? -1 : 1)),
    [jobs]
  )


  /**
   * Assets at the location per category, counted from the same register the
   * My Assets page lists, so a tile's count is the number of rows its link opens.
   * Only categories that have assets are shown, as in that page's filter.
   */
  const register = useAssetRows()
  const categories = useMemo(
    () =>
      assetCategories
        .map((name) => ({ name, count: register.filter((a) => a.category === name).length }))
        .filter((c) => c.count > 0),
    [register]
  )
  const totalAssets = register.length


  return (
    <div className="space-y-5">
      {/* ---------- Welcome ---------- */}
      <section className="relative overflow-hidden rounded-2xl text-brand-navy-foreground shadow-sm">
        {/* The field photograph carries the whole banner, as the tablet design draws it */}
        <img src="/brand/evita-login.jpg" alt="" className="absolute inset-0 size-full object-cover object-[center_30%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 to-brand-navy/30" />

        <div className="relative p-5">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Hello, {me.name}!</h2>
          <p className="mt-0.5 text-sm font-medium text-white/90">
            {me.designation} · ELPREMAR <span className="tabular-nums">{me.id}</span>
          </p>
          <p className="mt-1 text-sm text-white/85 sm:text-base">Stay on top of your plant assets and tasks.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/25">
              <MapPin className="size-4" /> {me.plant}, {me.enterprise}
            </span>
            {/* The date moved here when the top bar turned into the tab-design bar */}
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

      {/* The work in hand on the left; who they are and what is next on the right */}
      <div className="grid gap-3 lg:grid-cols-2">
        <NextTask />
        <UpcomingTasks />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          {/* ---------- What is already open ---------- */}
          <Panel
            icon={ClipboardList}
            title="Continue working on"
            subtitle="Started and not yet submitted"
            action={
              <Link to="/my-tasks?status=in_progress" className="flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-semibold text-primary hover:underline">
                View All ({running.length}) <ArrowRight className="size-4" />
              </Link>
            }
          >
            {running.length ? (
              <ul className="divide-y">
                {running.map((job) => (
                  <WorkRow key={job.id} job={job} />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nothing is under way.{" "}
                <button
                  type="button"
                  onClick={() => openPanel({ kind: "begin-inspection" })}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Start an inspection
                </button>
              </p>
            )}
          </Panel>

          {/* ---------- What is on site ---------- */}
          <Panel
            title="Asset Categories at Your Location"
            subtitle="Select a category to see its assets"
            action={<span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground">{totalAssets} Total Registered</span>}
          >
            <div className="grid grid-cols-3 gap-3 p-5 sm:grid-cols-4 lg:grid-cols-6">
              {categories.map((c) => {
                const look = categoryLook(c.name)
                return (
                  <Link
                    key={c.name}
                    to={`/assets?category=${encodeURIComponent(c.name)}`}
                    title={c.name}
                    className="group/cat flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl bg-card px-2 py-3 text-center ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className={cn("flex size-11 items-center justify-center rounded-lg transition-transform motion-safe:group-hover/cat:scale-110", look.tint)}>
                      <CategoryIcon category={c.name} className="size-6" />
                    </span>
                    <span className="line-clamp-2 text-sm leading-tight font-semibold">{shortCategory(c.name)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{c.count} Assets</span>
                  </Link>
                )
              })}
            </div>
          </Panel>
        </div>

        {/* ---------- Who they are, and the shortcuts they use ---------- */}
        <div className="grid content-start gap-5 md:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-5">
            <button
              type="button"
              onClick={() => openPanel({ kind: "safety" })}
              className="flex w-full items-center gap-3 rounded-2xl bg-healthy-soft/60 p-4 text-left ring-2 ring-healthy/35 transition-shadow hover:shadow-md active:bg-healthy-soft"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-healthy text-healthy-foreground shadow-sm">
                <ShieldCheck className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold tracking-[0.06em] uppercase">Safety First</div>
                <p className="text-sm text-muted-foreground">Follow all safety procedures. Report any unsafe condition immediately.</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-healthy" />
            </button>
          </div>

          <section className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10 md:col-span-2 lg:col-span-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">Recent Notifications</h3>
              <button type="button" onClick={() => openPanel({ kind: "notifications" })} className="-my-2 flex min-h-11 items-center gap-1 px-1 text-sm font-semibold text-primary hover:underline">
                View All <ChevronRight className="size-4" />
              </button>
            </div>
            <ul className="-mx-1 space-y-0.5 text-sm">
              {notices.slice(0, 4).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id)
                      if (n.to) navigate(n.to)
                    }}
                    className="flex min-h-11 w-full items-start gap-2 rounded-lg px-1 py-1.5 text-left hover:bg-muted"
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? "bg-primary" : "bg-foreground/15")} />
                    <span className={cn("min-w-0 flex-1", n.unread && "font-medium")}>{n.title}</span>
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">{noticeTime(n.at)}</span>
                  </button>
                </li>
              ))}
              {notices.length === 0 ? <li className="px-1 text-muted-foreground">Nothing new.</li> : null}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
