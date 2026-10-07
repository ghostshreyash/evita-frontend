import { useMemo } from "react"
import { Link, useNavigate } from "react-router"
import { format } from "date-fns"
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  Factory,
  FileText,
  Hourglass,
  Layers,
  Mail,
  MapPin,
  Network,
  Phone,
  QrCode,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { CategoryIcon } from "@/components/common/category-icon"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAssetRows } from "@/data/asset-store"
import { elpremarProfileFor } from "@/data/elpremar-data"
import { assetCategories } from "@/data/master-data"
import { slotLabel } from "@/data/occ-tables"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { markRead, noticeTime, useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isOverdue, isThisWeek, isToday, parseDay, summarise, useMyJobs, type Job } from "@/lib/work"

const startTime = (slot: number) => slotLabel(slot).split(" - ")[0]

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

/** One of the four counters; each opens My Tasks on the matching view */
function Counter({
  icon: Icon,
  label,
  value,
  note,
  tone,
  to,
}: {
  icon: LucideIcon
  label: string
  value: number
  /** Line under the number; only Today's Tasks carries one */
  note?: string
  tone: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group/stat flex min-h-32 flex-col rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", tone)}>
          <Icon className="size-6" />
        </span>
      </div>
      <span className="-mt-3 text-4xl leading-none font-bold text-brand-navy tabular-nums dark:text-foreground">{value}</span>
      {note ? <span className="mt-auto pt-2 text-sm text-primary">{note}</span> : null}
    </Link>
  )
}

/** One task as a row card: time chip, asset with its category tag, activity, status and the one action */
function TaskRow({ job, onOpen }: { job: Job; onOpen: () => void }) {
  const category = categoryFor(job.asset)
  const look = categoryLook(category)
  const overdue = isOverdue(job)
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === "Enter" && onOpen()}
        className="flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 active:bg-muted/60"
      >
        <span className={cn("shrink-0 rounded-lg px-2.5 py-1.5 text-center tabular-nums text-sm leading-tight font-semibold", overdue ? "bg-critical-soft text-critical" : "bg-muted text-foreground")}>
          {isToday(job.date) ? "Today" : format(parseDay(job.date), "EEE d")}
          <span className="block text-xs font-medium">{startTime(job.slot)}</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-brand-navy dark:text-foreground">{job.asset}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-current/20", look.tint)}>
              <CategoryIcon category={category} className="size-3.5" />
              {shortCategory(category)}
            </span>
            <span className="truncate text-primary">• {job.plant}</span>
          </div>
          <div className="mt-1 truncate text-sm text-foreground/80">{job.activity}</div>
        </div>
        <JobStatusBadge job={job} className="max-md:hidden" />
        <JobActionButton job={job} className="h-12 border-2 border-primary/70 text-base" />
      </div>
    </li>
  )
}

/** Icon + label on the left, value on the right — the profile tabs' rows */
function InfoRows({ rows }: { rows: { icon: LucideIcon; label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y">
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex min-h-12 items-center gap-3 py-2 text-sm">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="ml-auto min-w-0 truncate text-right font-semibold">{value}</dd>
        </div>
      ))}
    </dl>
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
  const profile = useMemo(() => elpremarProfileFor(me), [me])
  const jobs = useMyJobs()
  const { notices } = useNotifications()

  const counts = summarise(jobs)
  // The week at a glance (Monday to Sunday), soonest first — the list the homepage leads with
  const week = useMemo(() => jobs.filter((j) => isThisWeek(j.date)), [jobs])
  // The job to resume for "Log Test Results": one already running, else the next to start
  const nextInspection = useMemo(
    () =>
      jobs.find((j) => j.kind === "inspection" && j.status === "in_progress") ??
      jobs.find((j) => j.kind === "inspection" && actionFor(j) === "start"),
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
  const email = `${me.name.toLowerCase().replace(/\s+/g, ".")}@olivineglobal.com`

  const quickActions = [
    { icon: QrCode, label: "Scan Asset QR", tone: "bg-info-soft text-info", run: () => openPanel({ kind: "scan" }) },
    {
      icon: FileText,
      label: "Log Test Results",
      tone: "bg-healthy-soft text-healthy",
      run: () => navigate(nextInspection ? `/my-tasks/${nextInspection.id}` : "/my-tasks?type=inspection"),
    },
    { icon: TriangleAlert, label: "Report an Issue", tone: "bg-attention-soft text-attention", run: () => openPanel({ kind: "issue" }) },
    { icon: BookOpen, label: "View SOP / Manual", tone: "bg-highlight-soft text-highlight", run: () => openPanel({ kind: "sop", activity: nextInspection?.activity }) },
  ]

  return (
    <div className="space-y-5">
      {/* ---------- Welcome ---------- */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-navy via-brand-navy to-primary text-brand-navy-foreground shadow-sm">
        <div className="relative flex items-center gap-5 p-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl font-bold tracking-tight">Welcome, {me.name}!</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 ring-1 ring-white/25">
                <MapPin className="size-4" /> {me.plant}, {me.enterprise}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 font-medium ring-1 ring-white/25">
                <ClipboardList className="size-4" /> {week.length} task{week.length === 1 ? "" : "s"} this week
              </span>
            </div>
          </div>
          {/* Field photograph framed on the right */}
          <div className="relative h-32 w-72 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/20 max-md:hidden">
            <img src="/brand/evita-login.jpg" alt="" className="size-full object-cover object-[center_30%]" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/70 to-transparent" />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-5">
          {/* ---------- The day at a glance ---------- */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Counter to="/my-tasks?date=today" icon={ClipboardList} label="Today's Tasks" value={counts.today} note={`${counts.pending} Pending • ${counts.running} In Progress`} tone="bg-info-soft text-info" />
            <Counter to="/my-tasks?status=completed" icon={CircleCheckBig} label="Completed" value={counts.completed} tone="bg-healthy-soft text-healthy" />
            <Counter to="/my-tasks?status=overdue" icon={Hourglass} label="Overdue" value={counts.overdue} tone="bg-critical-soft text-critical" />
            <Counter to="/my-tasks" icon={Layers} label="Total Assigned" value={counts.total} tone="bg-highlight-soft text-highlight" />
          </div>

          {/* ---------- This week's work ---------- */}
          <Panel
            icon={ClipboardList}
            title="This Week's Tasks"
            subtitle="Monday to Sunday, soonest first"
            action={
              <Link to="/my-tasks?date=week" className="flex min-h-11 shrink-0 items-center gap-1 px-1 text-sm font-semibold text-primary hover:underline">
                View All ({week.length}) <ArrowRight className="size-4" />
              </Link>
            }
          >
            {week.length ? (
              <ul className="divide-y">
                {week.map((t) => <TaskRow key={t.id} job={t} onOpen={() => navigate(`/my-tasks/${t.id}`)} />)}
              </ul>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nothing booked this week.{" "}
                <Link to="/my-tasks?status=open" className="font-medium text-primary underline-offset-4 hover:underline">See open work</Link>
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
          <section className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
            <Tabs defaultValue="details">
              <TabsList variant="line" className="w-full justify-start gap-4 border-b">
                <TabsTrigger value="details" className="flex-none px-0">My Details</TabsTrigger>
                <TabsTrigger value="assignment" className="flex-none px-0">Assignment Info</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-2">
                <InfoRows
                  rows={[
                    { icon: BadgeCheck, label: "Role", value: me.designation },
                    { icon: CalendarDays, label: "Joined", value: me.joined },
                    // The ELPREMAR's own location (their address from onboarding), not the site they are posted to
                    { icon: MapPin, label: "Location", value: `${profile.basic.city}, ${profile.basic.state}` },
                    { icon: Phone, label: "Phone", value: <a href="tel:+919876543210" className="tabular-nums text-primary">+91 98765 43210</a> },
                    { icon: Mail, label: "Email", value: <a href={`mailto:${email}`} className="text-primary">{email}</a> },
                  ]}
                />
              </TabsContent>
              <TabsContent value="assignment" className="pt-2">
                <InfoRows
                  rows={[
                    // Where they are assigned: the enterprise, its plant and the department they sit in
                    { icon: Building2, label: "Enterprise", value: profile.posting.enterprise },
                    { icon: Factory, label: "Location", value: `${profile.posting.plant}, ${profile.posting.city}` },
                    { icon: Network, label: "Department", value: profile.posting.department },
                  ]}
                />
              </TabsContent>
            </Tabs>
          </section>

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

            <section className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
              <h3 className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
                {quickActions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={a.run}
                    className="flex min-h-14 w-full items-center gap-3 rounded-xl bg-muted/30 px-3 py-2 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted active:bg-muted"
                  >
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", a.tone)}>
                      <a.icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold">{a.label}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </section>
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
