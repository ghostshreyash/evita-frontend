import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, CalendarClock, CheckCheck, Clock, Factory, History, Paperclip, TriangleAlert } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { priorityTone } from "@/data/occ-tables"
import { findTicket, useTicketDetails } from "@/data/ticket-store"
import { issueStateLook, issueStateOf } from "@/lib/issues"

/**
 * What the three states mean, in the words the engineer would use.
 *
 * The badge says which; this says what it means for them - whether anyone has
 * picked the thing up, and whether they need to do anything else about it.
 */
const narrative: Record<ReturnType<typeof issueStateOf>, string> = {
  open: "Raised and waiting for the OLIVINE helpdesk to pick it up. Nothing more is needed from you.",
  in_progress: "The helpdesk is working on it. The answer lands here and on the trail below.",
  completed: "Dealt with and settled. If the same problem comes back, report it again and a fresh ticket is raised.",
}

/**
 * One issue the engineer reported, in full.
 *
 * The list is a summary - what it was and where it got to. This is the record:
 * what was reported, what was attached, what came back, and every step it has
 * been through. The trail matters when something is disputed and is noise the
 * rest of the time, which is why it lives here rather than on the card.
 *
 * Nothing here is editable. The engineer reports and reads the answer; the desk
 * works the ticket from OCC, which is where resolving and closing live.
 */
export function IssueDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const details = useTicketDetails()
  const row = findTicket(id)
  const detail = id ? details[id] : undefined

  if (!row || !detail) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
        <TriangleAlert className="size-8 text-attention" />
        <p className="max-w-md text-sm text-muted-foreground">
          <span className="font-semibold">{id}</span> is not an issue you reported. It may have been raised from
          another account.
        </p>
        <Button asChild>
          <Link to="/issues">Back to Reported Issues</Link>
        </Button>
      </div>
    )
  }

  const state = issueStateOf(row.status)
  const look = issueStateLook[state]

  return (
    <div>
      <PageHeader
        title={row.subject}
        badge={
          <Badge variant={look.badge} className="h-auto rounded-full px-2.5 py-1 text-sm">
            {look.label}
          </Badge>
        }
        description={`${row.category} · ${row.plant}, ${row.enterprise}`}
        breadcrumbs={[{ label: "Reported Issues", to: "/issues" }, { label: row.id }]}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft /> Back
          </Button>
        }
      />

      {/* Where it stands, said plainly */}
      <section
        className={cn(
          "mb-3 flex items-start gap-3 rounded-2xl p-4 text-sm shadow-xs ring-1",
          state === "completed"
            ? "bg-healthy-soft text-healthy-soft-foreground ring-healthy/25"
            : state === "in_progress"
              ? "bg-attention-soft text-attention-soft-foreground ring-attention/25"
              : "bg-info-soft text-info-soft-foreground ring-primary/20"
        )}
      >
        {state === "completed" ? (
          <CheckCheck className="mt-0.5 size-5 shrink-0" />
        ) : (
          <Clock className="mt-0.5 size-5 shrink-0" />
        )}
        <span>
          <span className="block font-semibold">{look.label}</span>
          {narrative[state]}
        </span>
      </section>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {/* ---------- What was reported ---------- */}
          <DetailPanel icon={TriangleAlert} title="What was reported">
            <p className="text-sm leading-relaxed">{detail.description}</p>

            {detail.attachments.length ? (
              <>
                <h4 className="mt-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  Attachments ({detail.attachments.length})
                </h4>
                <ul className="mt-1.5 divide-y border-t">
                  {detail.attachments.map((file) => (
                    <li key={file.id} className="flex items-center gap-2 py-2 text-sm">
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate font-medium">{file.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{file.meta}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Nothing was attached to this report.</p>
            )}
          </DetailPanel>

          {/* ---------- What came back ---------- */}
          {detail.resolution ? (
            <DetailPanel icon={CheckCheck} title="What came back">
              <p className="text-sm leading-relaxed">{detail.resolution.summary}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {detail.resolution.by} · <span className="tabular-nums">{detail.resolution.at}</span>
              </p>
            </DetailPanel>
          ) : null}

        </div>

        {/* ---------- The ticket itself ---------- */}
        <DetailPanel icon={Factory} title="Ticket">
          <DetailList
            rows={[
              { label: "Ticket ID", value: row.id, always: true },
              { label: "Category", value: row.category, always: true },
              {
                label: "Priority",
                value: (
                  <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold uppercase", priorityTone[row.priority])}>
                    {row.priority}
                  </span>
                ),
                always: true,
              },
              { label: "Status", value: look.label, always: true },
              { label: "Raised By", value: row.raisedBy, always: true },
              { label: "Raised On", value: row.raised, always: true },
              { label: "Last Updated", value: row.lastUpdated, always: true },
              { label: "Plant", value: row.plant, always: true },
              { label: "Enterprise", value: row.enterprise },
              { label: "Raised From", value: row.source },
              { label: "Assigned To", value: row.elpremar },
            ]}
          />

          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0" />
            Raised {row.raised}, last moved {row.lastUpdated}.
          </p>
        </DetailPanel>
      </div>

      {/* ---------- The full trail, across the page ---------- */}
      {detail.history.length ? (
        <div className="mt-3">
          <DetailPanel icon={History} title={`History (${detail.history.length})`}>
            <ol className="space-y-3">
              {detail.history.map((event, i) => (
                <li key={`${event.at}-${i}`} className="flex gap-2.5 text-sm">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/60" />
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{event.action}</span>
                    <span className="block text-xs text-muted-foreground">
                      {event.by} · <span className="tabular-nums">{event.at}</span>
                    </span>
                    {event.note ? <span className="mt-0.5 block text-muted-foreground">{event.note}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </DetailPanel>
        </div>
      ) : null}
    </div>
  )
}
