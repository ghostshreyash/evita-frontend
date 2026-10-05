import { useMemo } from "react"
import { Link } from "react-router"
import { format, parse, startOfDay } from "date-fns"
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  CircleCheckBig,
  ClipboardList,
  FileText,
  Hourglass,
  Mail,
  Phone,
  Play,
  QrCode,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react"
import { cn } from "cn"

import { SectionCard } from "@/components/common/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { assetCategories } from "@/data/master-data"
import { inspectionActivities, maintenanceActivities, priorityTone, slotLabel } from "@/data/occ-tables"
import { td, th } from "@/lib/data-table"
import { useCurrentElpremar } from "@/lib/me"
import { workStatus, type WorkStatus } from "@/lib/status"

const parseDate = (d: string) => startOfDay(parse(d, "dd-MM-yyyy", new Date()))
const isToday = (d: string) => parseDate(d).getTime() === startOfDay(new Date()).getTime()
const startTime = (slot: number) => slotLabel(slot).split(" - ")[0]

/** One job on the engineer's day, from either book */
type DayTask = {
  id: string
  slot: number
  asset: string
  location: string
  activity: string
  priority: string
  status: WorkStatus
}

/** The four counters across the top of the engineer's day */
function Counter({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof ClipboardList
  label: string
  value: number
  note: string
  tone: string
}) {
  // Label on its own line: beside the icon it truncates in the ~160px tile a tablet gives it
  return (
    <div className="rounded-lg bg-card px-3 py-2.5 ring-1 ring-foreground/10">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2.5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", tone)}>
          <Icon className="size-5" />
        </span>
        <span className="text-2xl leading-none font-bold tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 text-xs leading-tight text-muted-foreground">{note}</div>
    </div>
  )
}

/** Shortcuts from the mockup; the ones without a screen yet stay as buttons */
const quickActions = [
  { icon: QrCode, label: "Scan Asset QR", detail: "View Asset Details", tone: "bg-info-soft text-info", to: "/assets" },
  { icon: FileText, label: "Log Test Results", detail: "Record Measurements", tone: "bg-info-soft text-info", to: "/testing-measurements" },
  { icon: TriangleAlert, label: "Report an Issue", detail: "Raise a Ticket", tone: "bg-critical-soft text-critical" },
  { icon: BookOpen, label: "View SOP / Manual", detail: "Safety & Procedures", tone: "bg-highlight-soft text-highlight" },
]

const quickActionClass =
  "flex min-h-16 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left ring-1 ring-foreground/10 transition-colors hover:bg-muted active:bg-muted"

/**
 * The ELPREMAR's own screen: the work in front of them today, the assets at
 * their site, and who they are. Nothing from the command centre appears here —
 * no enterprise rollups, no approvals, no other engineer's book.
 *
 * Ported from occ-frontend `src/pages/evita/dashboard.tsx` and resized for the
 * tablets: 14–16px body text, 44px+ buttons, and a layout that puts the side
 * panels beside the work in landscape and under it in portrait.
 */
export function DashboardPage() {
  const me = useCurrentElpremar()

  const { today, counts } = useMemo(() => {
    const mine = [
      ...maintenanceActivities
        .filter((m) => m.elpremar === me.name)
        .map((m) => ({ id: m.id, slot: m.slot, asset: m.asset, location: m.plant, activity: m.type, priority: "Medium", status: m.status, date: m.scheduled })),
      ...inspectionActivities
        .filter((t) => t.elpremar === me.name)
        .map((t) => ({ id: t.id, slot: t.slot, asset: t.asset, location: t.plant, activity: t.activity, priority: t.priority, status: t.status, date: t.due })),
    ]

    const done = mine.filter((r) => r.status === "completed").length
    return {
      today: mine.filter((r) => isToday(r.date)).sort((a, b) => a.slot - b.slot) as DayTask[],
      counts: {
        today: mine.filter((r) => isToday(r.date)).length,
        pending: mine.filter((r) => isToday(r.date) && r.status !== "in_progress").length,
        running: mine.filter((r) => isToday(r.date) && r.status === "in_progress").length,
        done,
        // Past its day and still not finished
        overdue: mine.filter((r) => r.status !== "completed" && parseDate(r.date) < startOfDay(new Date())).length,
        total: mine.length,
      },
    }
  }, [me])

  /** Asset categories at this engineer's site, counted off the shared master list */
  const categories = useMemo(() => {
    const seed = [...me.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7)
    return assetCategories.map((name, i) => ({ name, count: 6 + ((seed + i * 13) % 24) }))
  }, [me])

  const totalAssets = categories.reduce((n, c) => n + c.count, 0)

  return (
    <div className="space-y-4">
      {/* ---------- Welcome ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-navy dark:text-foreground">Welcome, {me.name}!</h2>
          <p className="text-sm text-muted-foreground">
            Here are your assigned activities for today. Let&apos;s keep our assets reliable and safe.
          </p>
        </div>
        <div className="flex max-w-md items-center gap-3 rounded-md bg-info-soft px-3 py-2 text-sm italic max-lg:hidden">
          <span>“Every inspection prevents tomorrow&apos;s failure.”</span>
          <span className="ml-auto shrink-0 text-right font-semibold text-primary not-italic">
            Safe People
            <span className="block font-normal">Reliable Assets</span>
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          {/* ---------- The day at a glance ---------- */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Counter icon={ClipboardList} label="Today's Tasks" value={counts.today} note={`${counts.pending} Pending · ${counts.running} In Progress`} tone="bg-info-soft text-info" />
            <Counter icon={CircleCheckBig} label="Completed" value={counts.done} note="This Week" tone="bg-healthy-soft text-healthy" />
            <Counter icon={Hourglass} label="Overdue" value={counts.overdue} note={counts.overdue ? "Needs attention" : "Good Job!"} tone="bg-attention-soft text-attention" />
            <Counter icon={ClipboardList} label="Total Assigned" value={counts.total} note="This Week" tone="bg-highlight-soft text-highlight" />
          </div>

          {/* ---------- Today's work ---------- */}
          <SectionCard title="Today's Assigned Tasks" viewAllTo="/my-tasks" contentClassName="px-2" hoverable={false}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60 hover:bg-muted/60">
                  <TableHead className={th}>Time</TableHead>
                  <TableHead className={th}>Asset / Location</TableHead>
                  <TableHead className={th}>Activity</TableHead>
                  <TableHead className={th}>Priority</TableHead>
                  <TableHead className={th}>Status</TableHead>
                  <TableHead className={cn(th, "text-center")}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {today.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{startTime(t.slot)}</TableCell>
                    <TableCell className={cn(td, "whitespace-normal")}>
                      <span className="font-medium">{t.asset}</span>
                      <span className="block text-xs text-muted-foreground">{t.location}</span>
                    </TableCell>
                    <TableCell className={cn(td, "max-w-40 whitespace-normal")}>{t.activity}</TableCell>
                    <TableCell className={td}>
                      <span className={cn("rounded px-2 py-1 text-xs font-semibold", priorityTone[t.priority as keyof typeof priorityTone])}>
                        {t.priority}
                      </span>
                    </TableCell>
                    <TableCell className={td}>
                      <Badge variant={workStatus[t.status].badge} className="h-auto rounded px-2 py-1 text-xs">
                        {workStatus[t.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(td, "py-1.5 text-center")}>
                      {t.status === "in_progress" ? (
                        <Button className="w-28">
                          Continue <ArrowRight />
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-28 bg-card">
                          <Play /> Start
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {today.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Nothing booked for today.
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
                <Link
                  key={c.name}
                  // Opens the register already narrowed to that category
                  to={`/assets?category=${encodeURIComponent(c.name)}`}
                  className="flex min-h-16 flex-col justify-center rounded-lg bg-muted/40 px-2 py-2 text-center ring-1 ring-foreground/10 transition-colors hover:bg-muted active:bg-muted"
                >
                  <div className="line-clamp-2 text-xs leading-tight font-semibold" title={c.name}>{c.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{c.count} Assets</div>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* ---------- Who they are, and the shortcuts they use ---------- */}
        <div className="grid content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
          <Tabs defaultValue="details">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">My Details</TabsTrigger>
              <TabsTrigger value="assignment" className="flex-1">Assignment Info</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <SectionCard title="" hoverable={false} className="mt-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-attention-soft text-attention">
                    <UserRound className="size-7" />
                  </div>
                  <div className="min-w-0 text-sm">
                    <div className="text-base font-semibold">{me.name}</div>
                    <div className="text-muted-foreground">ELPREMAR | {me.id}</div>
                    <div className="text-muted-foreground">{me.department} Department</div>
                    <div className="text-muted-foreground">{me.plant}, {me.enterprise}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-2 border-t pt-3 text-sm">
                  <div className="flex items-center gap-2"><Phone className="size-4 text-primary" /> +91 98765 43210</div>
                  <div className="flex items-center gap-2"><Mail className="size-4 shrink-0 text-primary" /> <span className="truncate">{me.name.toLowerCase().replace(/\s+/g, ".")}@olivineglobal.com</span></div>
                </div>
              </SectionCard>
            </TabsContent>

            <TabsContent value="assignment">
              <SectionCard title="" hoverable={false} className="mt-2">
                <dl className="space-y-2.5 text-sm">
                  {[
                    ["Role", me.roles.join(", ")],
                    ["Posting", me.plant],
                    ["Enterprise", me.enterprise],
                    ["Certified Until", me.certifiedUntil],
                    ["Joined", me.joined],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 border-b pb-2 last:border-0 last:pb-0">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-healthy-soft px-3 py-3 ring-1 ring-foreground/10">
              <ShieldCheck className="mt-0.5 size-6 shrink-0 text-healthy" />
              <div className="text-sm">
                <div className="font-semibold">Safety First</div>
                <p className="text-muted-foreground">
                  Follow all safety procedures. Report any unsafe condition immediately.
                </p>
              </div>
            </div>

            <SectionCard title="Quick Actions" hoverable={false}>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                {quickActions.map((a) => {
                  const body = (
                    <>
                      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", a.tone)}>
                        <a.icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-tight font-semibold">{a.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{a.detail}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </>
                  )
                  return a.to ? (
                    <Link key={a.label} to={a.to} className={quickActionClass}>{body}</Link>
                  ) : (
                    <button key={a.label} type="button" className={quickActionClass}>{body}</button>
                  )
                })}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Recent Notifications" viewAllTo="/my-tasks" hoverable={false} className="md:col-span-2 xl:col-span-1">
            <ul className="space-y-2.5 text-sm">
              {today.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-start gap-2">
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0 flex-1">{t.activity}: {t.asset}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{startTime(t.slot)}</span>
                </li>
              ))}
              {today.length === 0 ? <li className="text-muted-foreground">Nothing new today.</li> : null}
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
