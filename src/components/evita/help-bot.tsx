import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Bot, ListTree, MessageCircle, Send, Ticket, X } from "lucide-react"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Message, MessageContent, MessageFooter, MessageGroup } from "@/components/ui/message"
import type { BotReply } from "@/lib/help-bot"
import type { FaqEntry } from "@/data/faq"
import { openPanel } from "@/lib/ui-store"

/**
 * The help assistant, docked bottom-right on every screen inside the app shell.
 *
 * It answers out of OLIVINE's own FAQ sheet and nothing else - see lib/help-bot
 * for the matching and data/faq.ts for the rows. What it is for is the
 * process questions: how an asset is onboarded, how an inspection is started,
 * when photographs are taken, how a sync is cleared. Those are what the
 * suggested questions offer, because an ELPREMAR holding a tablet in a plant
 * room will not type a question they could instead tap.
 *
 * Where it sits: above the bottom bar, right-hand side, clear of the raised
 * scan button in the middle. It is deliberately not a modal - the screen behind
 * stays readable, because the answer is usually about the form being filled in.
 *
 * The conversation lives in this component, which the shell mounts once, so it
 * survives moving between screens and is lost on sign-out. Nothing is stored.
 *
 * The FAQ it answers from is the largest data module in the app, and the
 * launcher is on every screen, so the matcher is fetched on the first opening
 * rather than with the app - the same reason the Contact screen is split out of
 * the router. The pause before the first reply covers the fetch.
 */

type Turn = {
  id: number
  role: "me" | "bot"
  text: string
  /** The row the answer came from, traced under the bubble so it can be checked */
  source?: FaqEntry
  /** Questions offered under the reply, as something to tap rather than type */
  suggestions?: FaqEntry[]
  /** Nothing matched: offer the ticket and the full sheet instead */
  stuck?: boolean
}

const greeting =
  "Hello. I can walk you through how something is done in EVITA - the answers are OLIVINE's own, word for word. Tap a question or type your own."

const nothingMatched =
  "I don't have an approved answer for that one. The FAQ is all I read from, and guessing about an electrical asset is not worth the risk - raise a ticket and the helpdesk will take it from here."

/** One reply from the matcher, turned into the bubble that shows it */
function turnFor(reply: BotReply, id: number): Turn {
  if (reply.kind === "answer") {
    return { id, role: "bot", text: reply.entry.answer, source: reply.entry, suggestions: reply.related }
  }
  if (reply.kind === "reply") return { id, role: "bot", text: reply.text }
  return { id, role: "bot", text: nothingMatched, suggestions: reply.related, stuck: true }
}

/**
 * The matcher and the sheet behind it, fetched once and then held. Kept outside
 * the component so a second sign-in does not fetch it again.
 */
let matcher: Promise<typeof import("@/lib/help-bot")> | null = null
const loadMatcher = () => (matcher ??= import("@/lib/help-bot"))

/** Long enough that a reply reads as an answer rather than a lookup */
const beat = 420
const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, beat))

export function HelpBot() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState("")
  const [thinking, setThinking] = useState(false)

  const nextId = useRef(0)
  const scroller = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  /* A reply in flight when the shell goes - at sign-out - has nowhere to land */
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  /** The newest bubble is the one being read, so it stays in view */
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns, thinking, open])

  /* Escape closes it, and opening moves the reading position into it */
  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  /** Opening it the first time is what fetches the sheet and writes the greeting */
  function openBot() {
    setOpen(true)
    if (turns.length) return

    setThinking(true)
    Promise.all([loadMatcher(), pause()]).then(([{ botStarters }]) => {
      if (!alive.current) return
      setTurns([{ id: nextId.current++, role: "bot", text: greeting, suggestions: botStarters }])
      setThinking(false)
    })
  }

  function ask(question: string) {
    const asked = question.trim()
    if (!asked || thinking) return

    setDraft("")
    setTurns((before) => [...before, { id: nextId.current++, role: "me", text: asked }])
    setThinking(true)

    /*
     * The matching itself is instant, so the beat is what makes a reply read as
     * an answer rather than a lookup. On the first question it is also the
     * fetch, which is why both are waited on together.
     */
    Promise.all([loadMatcher(), pause()]).then(([{ askBot }]) => {
      if (!alive.current) return
      setTurns((before) => [...before, turnFor(askBot(asked), nextId.current++)])
      setThinking(false)
    })
  }

  /** Raise it with the people who can act on it, and get out of the way */
  function handOff(to: "ticket" | "faq") {
    setOpen(false)
    if (to === "ticket") openPanel({ kind: "issue" })
    else navigate("/contact")
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="icon-lg"
        aria-label="Open the help assistant"
        onClick={openBot}
        className="fixed right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg shadow-primary/30 sm:right-4"
      >
        <MessageCircle className="size-6" />
      </Button>
    )
  }

  return (
    <section
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-label="EVITA help assistant"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false)
      }}
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex max-h-[min(34rem,70svh)] flex-col overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-foreground/10 outline-none sm:inset-x-auto sm:right-4 sm:w-[26rem]"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b px-3 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-brand-navy dark:text-foreground">EVITA Help</span>
          <span className="block truncate text-xs text-muted-foreground">Answers from OLIVINE's approved FAQ</span>
        </span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close the help assistant" onClick={() => setOpen(false)}>
          <X />
        </Button>
      </header>

      <div ref={scroller} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <MessageGroup className="gap-4">
          {turns.map((turn, at) => (
            <Message key={turn.id} align={turn.role === "me" ? "end" : "start"}>
              {turn.role === "bot" ? (
                <BotFace />
              ) : null}

              <MessageContent>
                <Bubble
                  variant={turn.role === "me" ? "default" : "muted"}
                  align={turn.role === "me" ? "end" : "start"}
                  className={turn.role === "bot" ? "max-w-full" : undefined}
                >
                  <BubbleContent>{turn.text}</BubbleContent>
                </Bubble>

                {/* Which row answered, so a wrong answer can be traced back to the sheet */}
                {turn.source ? (
                  <MessageFooter className="gap-1.5">
                    <span className="tabular-nums">{turn.source.id}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{turn.source.category}</span>
                  </MessageFooter>
                ) : null}

                {/* Only the last reply offers follow-ups; older ones would be answering a question that moved on */}
                {at === turns.length - 1 && !thinking ? (
                  <Suggestions entry={turn} onAsk={ask} onHandOff={handOff} />
                ) : null}
              </MessageContent>
            </Message>
          ))}

          {thinking ? (
            <Message align="start">
              <BotFace />
              <MessageContent>
                <Bubble variant="muted">
                  <BubbleContent>
                    <span className="sr-only">Looking for an answer</span>
                    <span aria-hidden className="flex items-center gap-1 py-1">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="size-1.5 animate-bounce rounded-full bg-foreground/40"
                          style={{ animationDelay: `${dot * 120}ms` }}
                        />
                      ))}
                    </span>
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ) : null}
        </MessageGroup>
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t p-2"
        onSubmit={(event) => {
          event.preventDefault()
          ask(draft)
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask how something is done"
          aria-label="Ask the help assistant"
          autoComplete="off"
          className="h-10"
        />
        <Button type="submit" size="icon-sm" aria-label="Send" disabled={!draft.trim() || thinking}>
          <Send />
        </Button>
      </form>
    </section>
  )
}

/**
 * Who is speaking, beside its bubble.
 *
 * Not ui/message's own MessageAvatar: that one lifts itself clear of a message
 * footer, and every answer here has one - the row it came from - which would
 * leave the face floating up the side of the bubble. At the top of the message
 * is also where it belongs when an answer runs to a paragraph.
 */
function BotFace() {
  return (
    <span aria-hidden className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Bot className="size-4" />
    </span>
  )
}

/**
 * What to tap next. Suggested questions are sent as their own exact wording, so
 * the matcher returns that row and never a near miss of it.
 */
function Suggestions({
  entry,
  onAsk,
  onHandOff,
}: {
  entry: Turn
  onAsk: (question: string) => void
  onHandOff: (to: "ticket" | "faq") => void
}) {
  const questions = entry.suggestions ?? []
  if (!questions.length && !entry.stuck) return null

  return (
    <div className="flex flex-col items-start gap-1.5 pt-0.5">
      {questions.length ? (
        <span className="px-1 text-xs font-medium text-muted-foreground">{entry.stuck ? "Closest I have" : "Also asked"}</span>
      ) : null}

      {questions.map((question) => (
        <Button
          key={question.id}
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onAsk(question.question)}
          className="h-auto min-h-8 w-fit max-w-full py-1.5 text-left leading-snug whitespace-normal"
        >
          {question.question}
        </Button>
      ))}

      {/* The sheet's own answer to "what if the chatbot cannot solve my problem" is: raise a ticket */}
      {entry.stuck ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button type="button" size="xs" onClick={() => onHandOff("ticket")}>
            <Ticket /> Raise a ticket
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={() => onHandOff("faq")}>
            <ListTree /> Browse all answers
          </Button>
        </div>
      ) : null}
    </div>
  )
}
