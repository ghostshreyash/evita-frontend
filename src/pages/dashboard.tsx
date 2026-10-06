import { useMemo } from "react"
import { Link, useNavigate } from "react-router"
import { format } from "date-fns"
import {
  BookOpen,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  FileText,
  Hourglass,
  Mail,
  Phone,
  QrCode,
  HardHat,
  MapPin,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react"
import { cn } from "cn"

import { SectionCard } from "@/components/common/section-card"
import { JobActionButton, JobStatusBadge } from "@/components/evita/job-action"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { elpremarProfileFor } from "@/data/elpremar-data"
import { assetCategories } from "@/data/master-data"
import { priorityTone, slotLabel } from "@/data/occ-tables"
import { td, th } from "@/lib/data-table"
import { CategoryIcon } from "@/components/common/category-icon"
import { categoryLook, shortCategory } from "@/lib/category-icons"
import { useCurrentElpremar } from "@/lib/me"
import { markRead, noticeTime, useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"
import { actionFor, categoryFor, isThisWeek, isToday, parseDay, summarise, useMyJobs } from "@/lib/work"

const startTime = (slot: number) => slotLabel(slot).split(" - ")[0]

/** One of the four counters; each opens My Tasks on the matching view */
function Counter({
  icon: Icon,
  label,
  value,
  note,
  tone,
  to,
}: {
  icon: typeof ClipboardList
  label: string
  value: number
  /** Line under the number; only Today's Tasks carries one */
  note?: string
  tone: keyof typeof counterTones
  to: string
}) {
  const t = counterTones[tone]
  // Label on its own line: beside the icon it truncates in the ~160px tile a tablet gives it
  return (
    <Link
      to={to}
      className={cn(
        "group/stat rounded-xl px-3 py-3 ring-1 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0",
        t.card
      )}
    >
      <div className="flex items-center justify-between gap-1 text-sm font-medium text-muted-foreground">
        {label}
        <ChevronRight className="size-4 shrink-0 opacity-60" />
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform motion-safe:group-hover/stat:scale-105", t.icon)}>
          <Icon className="size-6" strokeWidth={2.2} />
        </span>
        <span className="text-3xl leading-none font-bold text-brand-navy tabular-nums dark:text-foreground">{value}</span>
      </div>
      {note ? <div className={cn("mt-2 text-xs leading-tight font-medium", t.note)}>{note}</div> : null}
    </Link>
  )
}

/** Tile tint, icon disc and note colour per counter, from the theme tokens */
const counterTones = {
  info: { card: "bg-info-soft/70 ring-info/15", icon: "bg-info text-info-foreground", note: "text-info-soft-foreground" },
  healthy: { card: "bg-healthy-soft ring-healthy/15", icon: "bg-healthy text-healthy-foreground", note: "text-healthy-soft-foreground" },
  attention: { card: "bg-attention-soft ring-attention/20", icon: "bg-attention text-attention-foreground", note: "text-attention-soft-foreground" },
  highlight: { card: "bg-highlight-soft/70 ring-highlight/15", icon: "bg-highlight text-highlight-foreground", note: "text-highlight-soft-foreground" },
}

/** Label / value rows for the My Details and Assignment Info tabs */
function InfoRows({ rows, className }: { rows: [string, string][]; className?: string }) {
  return (
    <dl className={cn("space-y-2 text-sm", className)}>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

const quickActionClass =
  "flex min-h-16 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted active:bg-muted"

/**
 * The ELPREMAR's own screen: the work in front of them today, the assets at
 * their site, and who they are. Nothing from the command centre appears here —
 * no enterprise rollups, no approvals, no other engineer's book.
 *
 * Every item leads somewhere real, as on the OCC dashboard: the counters and
 * View All open My Tasks on the matching view, Start / Continue open the task,
 * the category tiles open the asset register, and the quick actions open the
 * scanner, Report an Issue and the SOP library.
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const profile = useMemo(() => elpremarProfileFor(me), [me])
  const jobs = useMyJobs()
  const { notices } = useNotifications()

  const counts = summarise(jobs)
  // The week at a glance (Monday to Sunday), soonest first — the table the homepage leads with
  const week = useMemo(() => jobs.filter((j) => isThisWeek(j.date)), [jobs])
  // The job to resume for "Log Test Results": one already running, else the next to start
  const nextInspection = useMemo(
    () =>
      jobs.find((j) => j.kind === "inspection" && j.status === "in_progress") ??
      jobs.find((j) => j.kind === "inspection" && actionFor(j) === "start"),
    [jobs]
  )

  /**
   * Assets at the posting per category. Seeded mock counts until the Assets
   * module supplies the real register (GET /assets?plant=…).
   */
  const categories = useMemo(() => {
    const seed = [...me.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
    return assetCategories.map((name, i) => ({ name, count: 6 + ((seed + i * 13) % 24) }))
  }, [me])
  const totalAssets = categories.reduce((n, c) => n + c.count, 0)
  const email = `${me.name.toLowerCase().replace(/\s+/g, ".")}@olivineglobal.com`

  const quickActions = [
    { icon: QrCode, label: "Scan Asset QR", detail: "View Asset Details", tone: "bg-info-soft text-info", run: () => openPanel({ kind: "scan" }) },
    {
      icon: FileText,
      label: "Log Test Results",
      detail: nextInspection ? `${nextInspection.activity} · ${nextInspection.asset}` : "Record Measurements",
      tone: "bg-info-soft text-info",
      run: () => navigate(nextInspection ? `/my-tasks/${nextInspection.id}` : "/testing-measurements"),
    },
    { icon: TriangleAlert, label: "Report an Issue", detail: "Raise a Ticket", tone: "bg-critical-soft text-critical", run: () => openPanel({ kind: "issue" }) },
    { icon: BookOpen, label: "View SOP / Manual", detail: "Safety & Procedures", tone: "bg-highlight-soft text-highlight", run: () => openPanel({ kind: "sop", activity: nextInspection?.activity }) },
  ]

  return (
    <div className="space-y-4">
      {/* ---------- Welcome ---------- */}
      <section className="relative overflow-hidden rounded-xl bg-brand-navy text-brand-navy-foreground shadow-sm">
        {/* Field photograph on the right, fading into the navy so the text stays readable */}
        <img src="/brand/evita-login.jpg" alt="" className="absolute inset-y-0 right-0 h-full w-3/5 object-cover object-[center_30%] md:w-1/2" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/90 via-45% to-brand-navy/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold">Welcome, {me.name}!</h2>
            <p className="mt-1 max-w-lg text-sm text-white/80">
              Here are your assigned activities for today. Let&apos;s keep our assets reliable and safe.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/20">
                <MapPin className="size-3.5" /> {me.plant}, {me.enterprise}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 ring-1 ring-white/20">
                <ClipboardList className="size-3.5" /> {week.length} task{week.length === 1 ? "" : "s"} this week
              </span>
            </div>
          </div>
          <div className="rounded-lg bg-brand-navy/55 px-4 py-3 text-right ring-1 ring-white/15 backdrop-blur-[2px] max-md:hidden">
            <p className="text-base italic">“Every inspection prevents tomorrow&apos;s failure.”</p>
            <p className="mt-1 text-sm font-semibold text-brand-gold">Safe People · Reliable Assets · A Stronger Tomorrow</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          {/* ---------- The day at a glance ---------- */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Counter to="/my-tasks?date=today" icon={ClipboardList} label="Today's Tasks" value={counts.today} note={`${counts.pending} Pending · ${counts.running} In Progress`} tone="info" />
            <Counter to="/my-tasks?status=completed" icon={CircleCheckBig} label="Completed" value={counts.completed} tone="healthy" />
            <Counter to="/my-tasks?status=overdue" icon={Hourglass} label="Overdue" value={counts.overdue} tone="attention" />
            <Counter to="/my-tasks" icon={ClipboardList} label="Total Assigned" value={counts.total} tone="highlight" />
          </div>

          {/* ---------- This week's work ---------- */}
          <SectionCard title="This Week's Tasks" viewAllTo="/my-tasks?date=week" contentClassName="px-2" hoverable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className={th}>Day / Time</TableHead>
                  <TableHead className={th}>Asset / Location</TableHead>
                  <TableHead className={th}>Activity</TableHead>
                  <TableHead className={cn(th, "max-md:hidden")}>Priority</TableHead>
                  <TableHead className={th}>Status</TableHead>
                  <TableHead className={cn(th, "text-center")}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {week.map((t) => (
                  <TableRow key={t.id} onClick={() => navigate(`/my-tasks/${t.id}`)} className="cursor-pointer">
                    <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>
                      <span className={cn("block font-medium", isToday(t.date) && "text-primary")}>{isToday(t.date) ? "Today" : format(parseDay(t.date), "EEE d MMM")}</span>
                      <span className="block text-xs text-muted-foreground">{startTime(t.slot)}</span>
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-normal")}>
                      {(() => {
                        const look = categoryLook(categoryFor(t.asset))
                        return (
                          <span className="flex items-center gap-2.5">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70">
                              <CategoryIcon category={categoryFor(t.asset)} className={cn("size-5", look.tone)} />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium">{t.asset}</span>
                              <span className="block text-xs text-muted-foreground">{t.plant}</span>
                            </span>
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell className={cn(td, "max-w-40 whitespace-normal")}>{t.activity}</TableCell>
                    <TableCell className={cn(td, "max-md:hidden")}>
                      <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityTone[t.priority])}>{t.priority}</span>
                    </TableCell>
                    <TableCell className={td}><JobStatusBadge job={t} /></TableCell>
                    <TableCell className={cn(td, "py-1.5 text-center")}><JobActionButton job={t} /></TableCell>
                  </TableRow>
                ))}
                {week.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Nothing booked this week.{" "}
                      <Link to="/my-tasks?status=open" className="font-medium text-primary underline-offset-4 hover:underline">See open work</Link>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </SectionCard>

          {/* ---------- What is on site ---------- */}
          <SectionCard
            title="Asset Categories at Your Location"
            viewAllTo="/assets"
            hoverable={false}
            actions={<span className="text-sm text-muted-foreground">Total Assets: {totalAssets}</span>}
          >
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {categories.map((c) => (
                (() => {
                  const look = categoryLook(c.name)
                  return (
                    <Link
                      key={c.name}
                      to={`/assets?category=${encodeURIComponent(c.name)}`}
                      title={c.name}
                      className="group/cat flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl bg-card px-2 py-3 text-center shadow-xs ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <CategoryIcon category={c.name} className={cn("size-9 transition-transform motion-safe:group-hover/cat:scale-110", look.tone)} />
                      <span className="line-clamp-2 text-xs leading-tight font-semibold">{shortCategory(c.name)}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{c.count} Assets</span>
                    </Link>
                  )
                })()
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ---------- Who they are, and the shortcuts they use ---------- */}
        <div className="grid content-start gap-4 md:grid-cols-2 lg:grid-cols-1">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">My Details</TabsTrigger>
              <TabsTrigger value="assignment" className="flex-1">Assignment Info</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <SectionCard title="" hoverable={false} className="mt-2">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold-soft to-attention-soft text-brand-gold ring-2 ring-brand-gold/40">
                      <HardHat className="size-8" strokeWidth={2} />
                    </div>
                    <span className="absolute right-0 bottom-0 size-4 rounded-full bg-healthy ring-2 ring-card" title="On duty" />
                  </div>
                  <div className="min-w-0 text-sm">
                    <div className="text-base font-semibold">{me.name}</div>
                    <div className="text-muted-foreground">ELPREMAR | {me.id}</div>
                  </div>
                </div>
                <InfoRows
                  className="mt-3 border-t pt-2.5"
                  rows={[
                    ["Role", me.designation],
                    ["Joined", me.joined],
                    // The ELPREMAR's own location (their address from onboarding), not the site they are posted to
                    ["Location", `${profile.basic.city}, ${profile.basic.state}`],
                  ]}
                />
                <div className="mt-3 space-y-1 border-t pt-2 text-sm">
                  <a href="tel:+919876543210" className="-mx-1 flex min-h-11 items-center gap-2 rounded px-1 hover:bg-muted">
                    <Phone className="size-4 text-primary" /> +91 98765 43210
                  </a>
                  <a href={`mailto:${email}`} className="-mx-1 flex min-h-11 items-center gap-2 rounded px-1 hover:bg-muted">
                    <Mail className="size-4 shrink-0 text-primary" /> <span className="truncate">{email}</span>
                  </a>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="assignment">
              <SectionCard title="" hoverable={false} className="mt-2">
                <InfoRows
                  rows={[
                    // Where they are assigned: the enterprise, its plant and the department they sit in
                    ["Enterprise", profile.posting.enterprise],
                    ["Location", `${profile.posting.plant}, ${profile.posting.city}`],
                    ["Department", profile.posting.department],
                  ]}
                />
              </SectionCard>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => openPanel({ kind: "safety" })}
              className="flex w-full items-start gap-3 rounded-lg bg-healthy-soft px-3 py-3 text-left ring-1 ring-foreground/10 transition-shadow hover:shadow-md active:bg-healthy-soft/70"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-healthy text-healthy-foreground shadow-sm">
                <ShieldCheck className="size-6" />
              </span>
              <div className="min-w-0 flex-1 text-sm">
                <div className="text-base font-semibold">Safety First</div>
                <p className="text-muted-foreground">Follow all safety procedures. Report any unsafe condition immediately.</p>
              </div>
              <ChevronRight className="mt-2 size-5 shrink-0 text-muted-foreground" />
            </button>

            <SectionCard title="Quick Actions" hoverable={false}>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {quickActions.map((a) => (
                  <button key={a.label} type="button" onClick={a.run} className={quickActionClass}>
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-lg", a.tone)}>
                      <a.icon className="size-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm leading-tight font-semibold">{a.label}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Recent Notifications"
            hoverable={false}
            className="md:col-span-2 lg:col-span-1"
            actions={
              <button type="button" onClick={() => openPanel({ kind: "notifications" })} className="-my-2 flex min-h-11 items-center gap-1 px-1 text-sm font-medium text-primary hover:underline">
                View All <ChevronRight className="size-4" />
              </button>
            }
          >
            <ul className="-mx-1 space-y-0.5 text-sm">
              {notices.slice(0, 4).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id)
                      if (n.to) navigate(n.to)
                    }}
                    className="flex min-h-11 w-full items-start gap-2 rounded px-1 py-1.5 text-left hover:bg-muted"
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? "bg-primary" : "bg-foreground/15")} />
                    <span className={cn("min-w-0 flex-1", n.unread && "font-medium")}>{n.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{noticeTime(n.at)}</span>
                  </button>
                </li>
              ))}
              {notices.length === 0 ? <li className="px-1 text-muted-foreground">Nothing new.</li> : null}
            </ul>
          </SectionCard>
        </div>
      </div>

      <p className="pt-1 text-center text-xs text-muted-foreground">
        {format(new Date(), "EEEE, d MMM yyyy")} · Reliable Assets. Safer Operations. A Greener Tomorrow.
      </p>
    </div>
  )
}
