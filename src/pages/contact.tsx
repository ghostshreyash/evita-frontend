import { useMemo, useState } from "react"
import { Clock, ChevronRight, Factory, Headset, Mail, Network, Phone, Search, TriangleAlert, UserRound, X } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { faqCategories, faqEntries, searchFaq } from "@/data/faq"
import { elpremarProfileFor } from "@/data/elpremar-data"
import { olivineSupport } from "@/data/support"
import { control } from "@/lib/data-table"
import { useCurrentElpremar } from "@/lib/me"
import { openPanel } from "@/lib/ui-store"

/**
 * Who to contact, and the answers before anyone has to be contacted.
 *
 * The answers come first, because most questions end there. Under them the
 * reporting line, and last the ticket - the thing to do only once the answers
 * have not helped.
 *
 * The FAQ is the client's own `Olivine_APP_AI_Chatbot_FAQ_` sheet, unedited —
 * see data/faq.ts, which holds the rows the sheet marks for EVITA. It is
 * browsed in two steps rather than as one long list: the categories first, then
 * the questions inside one. Searching skips straight to the answers, across
 * every category at once.
 *
 * The support line is a placeholder: no OLIVINE document gives a number or
 * hours - see data/support.ts. The sheet's own answer to "what if the chatbot
 * cannot solve my problem" is to raise a ticket, so the ticket is still the
 * action the page leads with.
 */
export function ContactPage() {
  const me = useCurrentElpremar()
  const profile = useMemo(() => elpremarProfileFor(me), [me])

  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string | null>(null)

  const searching = query.trim().length > 0

  /** Searching looks across every category; otherwise the chosen one is the scope */
  const results = useMemo(() => {
    if (searching) return searchFaq(faqEntries, query)
    if (category) return faqEntries.filter((entry) => entry.category === category)
    return []
  }, [searching, query, category])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of faqEntries) map.set(entry.category, (map.get(entry.category) ?? 0) + 1)
    return map
  }, [])

  const browsing = !searching && !category

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Contact & Help"
        description="Raise a ticket, reach your reporting line, or find the answer first."
        breadcrumbs={[{ label: "Contact & Help" }]}
      />

      {/* The answers take the width; who to ask and how to raise it sit beside them */}
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* ---------- The answers first: most questions end here ---------- */}
        <section className="rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">
              Frequently asked questions
              <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">{faqEntries.length} answers</span>
            </h3>
            {category || searching ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCategory(null)
                  setQuery("")
                }}
              >
                <X /> All topics
              </Button>
            ) : null}
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the answers — e.g. offline, thermal, QR code"
              aria-label="Search the FAQ"
              className={cn(control, "pl-9")}
            />
          </div>

          {browsing ? (
            <ul className="mt-3 divide-y">
              {faqCategories.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => setCategory(name)}
                    className="flex min-h-14 w-full items-center gap-3 px-1 text-left hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1 font-medium">{name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {counts.get(name) ?? 0}
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">
                {searching ? (
                  <>
                    {results.length} answer{results.length === 1 ? "" : "s"} for “{query.trim()}”
                  </>
                ) : (
                  <>
                    {category} · {results.length} answer{results.length === 1 ? "" : "s"}
                  </>
                )}
              </p>

              {results.length ? (
                <Accordion type="single" collapsible className="mt-1">
                  {results.map((entry) => (
                    <AccordionItem key={entry.id} value={entry.id}>
                      <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                        {entry.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm leading-relaxed text-foreground/85">
                        <p>{entry.answer}</p>
                        {/* The category earns its place when a search has crossed several */}
                        {searching ? <p className="mt-2 text-xs text-muted-foreground">{entry.category}</p> : null}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nothing matches that. Try fewer words, or raise a ticket and OCC will answer it.
                </p>
              )}
            </>
          )}
        </section>
        <div className="space-y-3">
          {/* ---------- The reporting line, from the register ---------- */}
          <section className="mb-3 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
            <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Your reporting line</h3>
            <dl className="mt-2 divide-y">
              <Line icon={UserRound} label="Reporting supervisor" value={profile.posting.supervisor || "Not assigned"} />
              <Line icon={Network} label="Department" value={profile.posting.department} />
              <Line icon={Factory} label="Plant" value={`${profile.posting.plant}, ${profile.posting.city}`} />
              <Line icon={Factory} label="Enterprise" value={profile.posting.enterprise} />
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Anything about an assignment — a task you cannot reach, a plant that is shut — goes to your supervisor, not to
              OCC.
            </p>
          </section>

          {/* ---------- Raising it with OCC ---------- */}
          <section className="mb-3 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-brand-navy dark:text-foreground">
              <Headset className="size-5 text-primary" /> Get help
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Still stuck after the answers above? A ticket is the channel to OCC. Raise one with a photograph and what you
              were doing, and it is tracked until it is closed.
            </p>
            <div className="mt-3">
              <Button className="h-14 text-base" onClick={() => openPanel({ kind: "issue" })}>
                <TriangleAlert /> Report an Issue
              </Button>
            </div>
            {/* Placeholder details until OLIVINE publish theirs — see data/support.ts */}
            <dl className="mt-3 divide-y border-t">
              <Line
                icon={Phone}
                label="Support line"
                value={
                  <a href={`tel:${olivineSupport.phoneDial}`} className="tabular-nums text-primary">
                    {olivineSupport.phone}
                  </a>
                }
              />
              <Line
                icon={Mail}
                label="Support email"
                value={
                  <a href={`mailto:${olivineSupport.email}`} className="text-primary">
                    {olivineSupport.email}
                  </a>
                }
              />
              <Line icon={Clock} label="Hours" value={olivineSupport.hours} />
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">{olivineSupport.note}</p>
          </section>
        </div>
      </div>

    </div>
  )
}

/** One label-and-value row, in the reporting line and the support details */
function Line({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex min-h-12 items-center gap-3 py-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto min-w-0 truncate text-right font-semibold">{value}</dd>
    </div>
  )
}
