import { useMemo, useState } from "react"
import { Link } from "react-router"
import { CalendarClock, Clock, Factory, History, Paperclip, Search, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"

import { ChipTabs, type ChipTab } from "@/components/common/chip-tabs"
import { TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { priorityTone } from "@/data/occ-tables"
import { control, PAGE_SIZES } from "@/lib/data-table"
import { issueStateLook, issueStates, useMyReportedIssues, type IssueState, type ReportedIssue } from "@/lib/issues"
import { openPanel } from "@/lib/ui-store"

/**
 * Reported Issues: everything this ELPREMAR has reported, and where each one
 * got to.
 *
 * Report an Issue used to be a one-way door. The engineer raised a ticket from
 * a task or an asset, got a toast with its number, and that was the last they
 * saw of it - the desk's reply only reached them as a notification, which is
 * read once and gone. This is the other half of it: the same issues, with the
 * answer attached to the one it answers.
 *
 * Two states rather than the desk's three. Open and In Progress are both "still
 * with OCC" from where the engineer stands, so the screen reads Pending or
 * Completed - see lib/issues. The full trail is still on each card for anyone
 * who wants to know what actually happened to it, folded away until asked for.
 *
 * A card rather than a table row. What is being read is a short story - what was
 * reported, when, what came back - and that does not sit across seven columns on
 * a tablet held at arm's length.
 */
export function ReportedIssuesPage() {
  const issues = useMyReportedIssues()

  const [state, setState] = useState<IssueState | "all">("all")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  /** Everything but the state filter, so the tab counts show what choosing one gives */
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return issues
    return issues.filter(({ row, state: s }) =>
      [row.id, row.subject, row.category, row.plant, row.enterprise, row.priority, row.raised, issueStateLook[s].label].some(
        (field) => field.toLowerCase().includes(q)
      )
    )
  }, [issues, query])

  const filtered = useMemo(() => matched.filter((i) => state === "all" || i.state === state), [matched, state])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = filtered.slice(start, start + pageSize)

  const tabs: ChipTab[] = [
    { value: "all", label: "All", count: matched.length },
    ...issueStates.map((s) => ({
      value: s,
      label: issueStateLook[s].label,
      count: matched.filter((i) => i.state === s).length,
    })),
  ]

  const reset = (fn: () => void) => {
    fn()
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Reported Issues"
        description="Everything you have reported, and what came back. Pending is still with the OLIVINE helpdesk."
        breadcrumbs={[{ label: "Reported Issues" }]}
        actions={
          <Button onClick={() => openPanel({ kind: "issue" })}>
            <TriangleAlert /> Report an Issue
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => reset(() => setQuery(e.target.value))}
            placeholder="Search by ticket, subject or plant"
            aria-label="Search reported issues"
            className={cn(control, "bg-card pl-9")}
          />
        </div>
        <Button
          variant="outline"
          className={cn(control, "bg-card")}
          disabled={!query && state === "all"}
          onClick={() =>
            reset(() => {
              setQuery("")
              setState("all")
            })
          }
        >
          <X /> Clear
        </Button>
      </div>

      <ChipTabs
        label="Issue status"
        tabs={tabs}
        value={state}
        onChange={(v) => reset(() => setState(v as typeof state))}
        className="mb-3"
      />

      {shown.length ? (
        <ul className="grid gap-2.5 xl:grid-cols-2">
          {shown.map((issue) => (
            <IssueCard key={issue.row.id} issue={issue} />
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-card py-16 text-center text-sm text-muted-foreground shadow-xs ring-1 ring-foreground/10">
          {issues.length
            ? "Nothing matches these filters."
            : "You have not reported anything yet. Report an Issue raises one with the OLIVINE helpdesk."}
        </p>
      )}

      <TablePager
        page={current}
        pages={pages}
        pageSize={pageSize}
        total={filtered.length}
        start={start}
        onPage={setPage}
        onPageSize={(n) => {
          setPageSize(n)
          setPage(1)
        }}
      />
    </div>
  )
}

/**
 * One reported issue.
 *
 * The answer sits directly under the report when there is one, because the two
 * are read together - what was wrong, and what was done about it. Everything
 * else - the attachments, the trail, the ticket's own fields - is on the record
 * behind it: it matters when something is disputed and is noise the rest of the
 * time.
 */
function IssueCard({ issue }: { issue: ReportedIssue }) {
  const { row, state, detail } = issue
  const look = issueStateLook[state]

  return (
    <li className="flex items-stretch overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10">
      <span aria-hidden className={cn("w-1.5 shrink-0", look.stripe)} />

      <div className="min-w-0 flex-1 p-3">
        {/* The ticket, how hard it was pressed, and where it got to */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold tabular-nums text-primary">{row.id}</span>
          <span className={cn("rounded-md px-1.5 py-0.5 text-[0.7rem] font-bold tracking-wide uppercase", priorityTone[row.priority])}>
            {row.priority}
          </span>
          <Badge variant={look.badge} className="ml-auto h-auto rounded-full px-2 py-0.5 text-xs">
            {look.label}
          </Badge>
        </div>

        <h3 className="mt-1 text-base leading-tight font-bold text-brand-navy dark:text-foreground">{row.subject}</h3>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-semibold">{row.category}</span>
          <span className="flex min-w-0 items-center gap-1">
            <Factory className="size-3.5 shrink-0" />
            <span className="truncate">
              {row.plant}, {row.enterprise}
            </span>
          </span>
          <span className="flex items-center gap-1 tabular-nums">
            <CalendarClock className="size-3.5 shrink-0" />
            Reported {row.raised}
          </span>
        </div>

        {detail?.description ? <p className="mt-2 text-sm leading-relaxed text-foreground/85">{detail.description}</p> : null}

        {/* What the engineer attached. The photographs themselves do not survive a reload */}
        {detail?.attachments.length ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Paperclip className="size-3.5 shrink-0" />
            {detail.attachments.length} attachment{detail.attachments.length === 1 ? "" : "s"}
            <span className="min-w-0 truncate">· {detail.attachments.map((a) => a.label).join(", ")}</span>
          </p>
        ) : null}

        {/* ---------- What came back ---------- */}
        {detail?.resolution ? (
          <div className="mt-2.5 rounded-xl bg-healthy-soft p-2.5 text-sm text-healthy-soft-foreground">
            <div className="text-xs font-bold tracking-wide uppercase">Completed</div>
            <p className="mt-0.5 leading-relaxed">{detail.resolution.summary}</p>
            {/* Who settled it. The hour it happened at is on the trail, not on the face of the card */}
            <p className="mt-1 text-xs opacity-80">{detail.resolution.by}</p>
          </div>
        ) : (
          <p className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-attention-soft px-2.5 py-2 text-sm text-attention-soft-foreground">
            <Clock className="size-4 shrink-0" />
            Still with the OLIVINE helpdesk
          </p>
        )}

        {/* The record itself: the trail, the attachments and the ticket */}
        <Button variant="outline" size="sm" className="mt-2.5 h-10 bg-card" asChild>
          <Link to={`/issues/${row.id}`}>
            <History /> View the full record
          </Link>
        </Button>

      </div>
    </li>
  )
}
