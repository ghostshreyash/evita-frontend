import { useEffect, useState } from "react"
import { format } from "date-fns"
import { Pause, Play } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import type { TimeEntry } from "@/data/maintenance-detail"

/** 3 725 000 ms → "1 h 02 min 05 s" */
function formatSpan(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h ? `${h} h ${pad(m)} min ${pad(sec)} s` : `${m} min ${pad(sec)} s`
}

const span = (e: TimeEntry, now: number) => (e.end ? new Date(e.end).getTime() : now) - new Date(e.start).getTime()

/** A clock that ticks every second while work is running, and not at all otherwise */
function useNow(running: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [running])
  return now
}

/**
 * The real-time maintenance log: one row per stretch of work, with the exact
 * time it started and stopped. Stop closes the current row; Resume opens a new
 * one, so a tea break or a permit hold shows as a gap rather than as work.
 */
export function TimeLog({
  entries,
  onStop,
  onResume,
  readOnly,
}: {
  entries: TimeEntry[]
  onStop?: () => void
  onResume?: () => void
  readOnly?: boolean
}) {
  const running = entries.length > 0 && !entries.at(-1)!.end
  const now = useNow(running)
  const total = entries.reduce((n, e) => n + span(e, now), 0)
  const at = (iso: string) => format(new Date(iso), "d MMM, HH:mm:ss")

  return (
    <div className="space-y-4">
      {/* Big live clock, as on a stopwatch */}
      <div className={cn("flex flex-wrap items-center justify-between gap-4 rounded-2xl px-5 py-4 ring-1", running ? "bg-healthy-soft/60 ring-healthy/25" : "bg-muted/50 ring-foreground/10")}>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <span className={cn("size-2.5 rounded-full", running ? "animate-pulse bg-healthy" : "bg-neutral")} />
            {running ? "Work in progress" : entries.length ? "Paused" : "Not started"}
          </div>
          <div className="mt-1 tabular-nums text-4xl font-bold tracking-tight text-brand-navy dark:text-foreground">{formatSpan(total)}</div>
          <div className="mt-0.5 text-sm text-muted-foreground">Total time on the job · {entries.length} entr{entries.length === 1 ? "y" : "ies"}</div>
        </div>
        {readOnly ? null : running ? (
          <Button size="lg" variant="outline" className="h-14 border-2 border-critical/50 bg-card px-6 text-base font-semibold text-critical hover:bg-critical-soft" onClick={onStop}>
            <Pause className="fill-current" /> Stop Work Log
          </Button>
        ) : (
          <Button size="lg" className="h-14 px-6 text-base font-semibold shadow-lg shadow-primary/30" onClick={onResume}>
            <Play className="fill-current" /> {entries.length ? "Resume Work Log" : "Start Work Log"}
          </Button>
        )}
      </div>

      {entries.length ? (
        <ol className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
          <li className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_6rem] gap-2 bg-muted/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span>#</span>
            <span>Started</span>
            <span>Stopped</span>
            <span className="text-right">Duration</span>
            <span className="text-right">Status</span>
          </li>
          {entries.map((e, i) => (
            <li key={e.start} className="grid grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_6rem] items-center gap-2 border-t px-4 py-3 tabular-nums text-sm">
              <span className="text-muted-foreground">{i + 1}</span>
              <span>{at(e.start)}</span>
              <span>{e.end ? at(e.end) : <span className="text-muted-foreground">—</span>}</span>
              <span className="text-right font-semibold">{formatSpan(span(e, now))}</span>
              <span className="text-right">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold", e.end ? "bg-muted text-muted-foreground" : "bg-healthy-soft text-healthy")}>
                  <span className={cn("size-1.5 rounded-full bg-current", !e.end && "animate-pulse")} />
                  {e.end ? "Recorded" : "Active"}
                </span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  )
}
