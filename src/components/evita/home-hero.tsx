import { useMemo } from "react"
import { useNavigate } from "react-router"
import { ChevronRight, ClipboardCheck, ClipboardList, MapPin, Play, Plus, QrCode, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { AssetPhoto } from "@/components/common/asset-photo"
import { CategoryIcon } from "@/components/common/category-icon"
import { StartInspection } from "@/components/assets/start-inspection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { parseDmy, type AssetRecord } from "@/data/asset-data"
import { useAssetRows } from "@/data/asset-store"
import { healthBandFor } from "@/data/master-data"
import { criticalityTone } from "@/data/occ-tables"
import { useCurrentElpremar } from "@/lib/me"
import { startJob } from "@/lib/start-job"
import { healthStatus } from "@/lib/status"
import { openPanel } from "@/lib/ui-store"
import { actionFor, jobPath, maintenanceFor, useMyJobs } from "@/lib/work"

/**
 * The head of the home screen: the asset last registered at this plant, with
 * the work it is waiting for, and the four ways into the app either side of it.
 *
 * Laid out as the client asked at the review — two cards left, the asset
 * standing tall in the middle, two cards right. On a tablet in portrait the
 * asset goes first and the four fall under it in pairs, because the asset is
 * the thing the engineer is standing in front of.
 */
export function HomeHero() {
  const navigate = useNavigate()
  const register = useAssetRows()

  /** The latest asset on the register: the one just onboarded, most of the time */
  const latest = useMemo(
    () => [...register].sort((a, b) => parseDmy(b.onboarded).getTime() - parseDmy(a.onboarded).getTime())[0],
    [register]
  )

  const actions: Action[] = [
    {
      icon: QrCode,
      title: "Scan Asset QR",
      detail: "Open an asset by its label",
      tone: "bg-info-soft text-info",
      run: () => openPanel({ kind: "scan" }),
    },
    {
      icon: Plus,
      title: "Asset Onboarding",
      detail: "Register an asset that is not on the book",
      tone: "bg-highlight-soft text-highlight",
      run: () => navigate("/assets/onboarding"),
    },
    {
      icon: ClipboardCheck,
      title: "Start Inspection",
      detail: "Scan an asset, or onboard a new one",
      tone: "bg-healthy-soft text-healthy",
      run: () => openPanel({ kind: "begin-inspection" }),
    },
    {
      icon: ClipboardList,
      title: "My Tasks",
      detail: "The maintenance assigned to you",
      tone: "bg-attention-soft text-attention",
      run: () => navigate("/my-tasks"),
    },
  ]

  return (
    <section>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-lg font-semibold text-brand-navy dark:text-foreground">Quick Actions</h3>
        <p className="text-sm text-muted-foreground">Everything you need for field work</p>
      </div>

      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)_minmax(0,1fr)]">
        <ul className="grid content-start gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          {actions.slice(0, 2).map((action) => (
            <ActionCard key={action.title} action={action} />
          ))}
        </ul>

        {latest ? <AssetSpotlight asset={latest} className="max-lg:order-first" /> : null}

        <ul className="grid content-start gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
          {actions.slice(2).map((action) => (
            <ActionCard key={action.title} action={action} />
          ))}
        </ul>
      </div>
    </section>
  )
}

/**
 * The asset in the middle: its photograph standing tall, what it is, where it
 * is, and the one piece of work it is waiting for.
 *
 * Which button shows follows the book. A maintenance already assigned against
 * the asset is booked work with a date on it, so it takes precedence;
 * otherwise the inspection does, and that one always works — an ELPREMAR can
 * inspect an asset without being handed a task for it.
 */
function AssetSpotlight({ asset, className }: { asset: AssetRecord; className?: string }) {
  const navigate = useNavigate()
  const me = useCurrentElpremar()
  const maintenance = maintenanceFor(useMyJobs(), asset)
  const health = asset.health === null ? null : healthBandFor(asset.health)

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10",
        className
      )}
    >
      <div className="relative h-44 bg-muted/40 lg:h-56">
        <AssetPhoto label={asset.category} />
        <Badge
          variant={health ? healthStatus[health.tone].badge : "neutral"}
          className="absolute top-2 right-2 h-auto gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
        >
          <span aria-hidden className="size-1.5 rounded-full bg-current" />
          {health ? health.label : "Onboarded"}
        </Badge>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Latest asset</p>
        <h4 className="mt-0.5 truncate text-lg font-bold text-brand-navy dark:text-foreground">{asset.name}</h4>
        <p className="truncate text-sm font-medium tabular-nums text-primary">{asset.id}</p>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CategoryIcon category={asset.category} className="size-4 shrink-0" />
          <span className="truncate">{asset.category}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{asset.area}</span>
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
          <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", criticalityTone[asset.criticality])}>
            {asset.criticality}
          </span>
          <button
            type="button"
            onClick={() => navigate(`/assets/${asset.id}`)}
            className="flex min-h-9 items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Open record <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="mt-auto pt-3">
          {maintenance ? (
            <>
              <Button
                size="lg"
                className="h-14 w-full text-base font-semibold shadow-md shadow-primary/25"
                onClick={() => {
                  if (actionFor(maintenance) === "start") startJob(maintenance, me.name)
                  navigate(jobPath(maintenance))
                }}
              >
                <Play className="fill-current" />
                {actionFor(maintenance) === "continue" ? "Continue Maintenance" : "Start Maintenance"}
              </Button>
              <p className="mt-1.5 text-center text-xs text-muted-foreground">
                <span className="tabular-nums font-medium">{maintenance.id}</span> · {maintenance.activity}
              </p>
            </>
          ) : (
            <StartInspection asset={asset} />
          )}
        </div>
      </div>
    </article>
  )
}

function ActionCard({ action }: { action: Action }) {
  return (
    <li>
      <button
        type="button"
        onClick={action.run}
        className="flex h-full min-h-28 w-full flex-col gap-2 rounded-2xl bg-card p-3 text-left shadow-xs ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200 hover:shadow-md motion-safe:hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="flex items-start gap-2.5">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", action.tone)}>
            <action.icon className="size-5" />
          </span>
          <span className="min-w-0 flex-1 text-base leading-tight font-bold text-brand-navy dark:text-foreground">
            {action.title}
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </span>
        <span className="text-xs leading-snug text-muted-foreground">{action.detail}</span>
      </button>
    </li>
  )
}

type Action = {
  icon: LucideIcon
  title: string
  detail: string
  tone: string
  run: () => void
}
