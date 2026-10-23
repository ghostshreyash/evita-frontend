import { useNavigate } from "react-router"
import { format } from "date-fns"
import { CalendarDays, Factory, HardDrive, MapPin, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { slotLabel } from "@/data/occ-tables"
import { visitStatusLook } from "@/data/visits"
import { useNextVisit } from "@/lib/visits"
import { isToday, parseDay } from "@/lib/work"

/**
 * The visit the engineer is going to, on the home screen.
 *
 * A visit is what the enterprise actually books - this plant, this area, this
 * day - and it names no asset: at an area EVITA has not been to, nothing is on
 * the register at all and the engineer onboards what they find. So the card
 * says where, when, and how the two counts stand - what is registered against
 * what the enterprise expected, and what has been inspected of it.
 *
 * Nothing is drawn when there is no visit open. The engineer can still inspect
 * any asset they walk up to; a visit is a booking, not a permission.
 */
export function NextVisit() {
  const navigate = useNavigate()
  const next = useNextVisit()

  if (!next) return null

  const { visit, progress } = next
  const look = visitStatusLook[progress.status]
  const when = isToday(visit.date) ? "Today" : format(parseDay(visit.date), "EEE d MMM")

  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-lg shadow-primary/5 ring-1 ring-primary/20">
      <header className="flex flex-wrap items-center gap-2 border-b border-primary/10 bg-gradient-to-r from-info-soft via-info-soft/60 to-transparent px-3 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-info-soft text-primary">
          <MapPin className="size-4.5" />
        </span>
        <span className="text-base font-bold text-brand-navy dark:text-foreground">Scheduled Visit</span>
        <Badge variant={look.badge} className="h-auto rounded-full px-2 py-0.5 text-xs">
          {look.label}
        </Badge>
        <span className="ml-auto text-sm font-semibold tabular-nums text-primary">{visit.id}</span>
      </header>

      <div className="p-3">
        <h4 className="truncate text-xl leading-tight font-bold text-brand-navy dark:text-foreground">{visit.area}</h4>

        <dl className="mt-2.5 space-y-2 text-sm">
          <Line icon={Factory}>
            {visit.plant}, {visit.enterprise}
          </Line>
          <Line icon={CalendarDays}>
            {when}, {slotLabel(visit.slot)}
          </Line>
          <Line icon={HardDrive}>
            {/*
              * No asset is named on a visit. At an area EVITA has not been to,
              * nothing is registered yet and the engineer onboards what they find.
              */}
            {progress.onboarded ? (
              <>
                <span className="tabular-nums">
                  {progress.done} of {progress.onboarded}
                </span>{" "}
                inspected · <span className="tabular-nums">{progress.expected}</span> expected here
              </>
            ) : (
              <>
                Nothing registered yet · <span className="tabular-nums">{progress.expected}</span> assets expected
              </>
            )}
          </Line>
        </dl>

        {/* How far down the area the engineer has got */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress.onboarded ? (progress.done / progress.onboarded) * 100 : 0}%` }}
          />
        </div>

        <Button
          size="lg"
          className="mt-3 h-14 w-full bg-gradient-to-r from-primary to-[#0f3fae] text-base font-bold shadow-lg shadow-primary/30 transition-transform motion-safe:hover:-translate-y-0.5 active:translate-y-0"
          onClick={() => navigate(`/visits/${visit.id}`)}
        >
          <Play className="fill-current" />
          {progress.onboarded === 0 ? "Start Visit" : progress.done ? "Continue Visit" : "Start Inspection"}
        </Button>
      </div>
    </section>
  )
}

function Line({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}
