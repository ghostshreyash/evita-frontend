import { useNavigate } from "react-router"
import {
  Bell,
  BookOpen,
  ChevronRight,
  CloudCheck,
  CloudOff,
  Factory,
  HardHat,
  LogOut,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useOnline } from "@/hooks/use-media"
import { useScope } from "@/lib/scope"
import { useAuth } from "@/lib/auth/context"
import { useCurrentElpremar } from "@/lib/me"
import { useNotifications } from "@/lib/notifications"
import { openPanel } from "@/lib/ui-store"

/**
 * Who is signed in, where they are posted, and the panels that are not a
 * section of their own.
 *
 * Reached from the avatar in the top bar. Everything listed here does
 * something: the guidance and reporting panels the task screens already open,
 * and the way out. Nothing is a placeholder for a screen that does not exist.
 */
export function MorePage() {
  const me = useCurrentElpremar()
  const { postings, enterprise, plant } = useScope()
  const { user, signOut } = useAuth()
  const online = useOnline()
  const { unread } = useNotifications()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="More" description="Your profile, your posting, and the guidance panels." breadcrumbs={[{ label: "More" }]} />

      {/* ---------- Who is signed in ---------- */}
      <section className="mb-3 flex flex-wrap items-center gap-4 rounded-2xl bg-card p-4 shadow-xs ring-1 ring-foreground/10">
        <div className="relative shrink-0">
          <Avatar className="size-16">
            <AvatarFallback className="bg-primary text-xl font-bold text-primary-foreground">{user?.initials ?? "EL"}</AvatarFallback>
          </Avatar>
          <span className={cn("absolute right-0.5 bottom-0.5 size-4 rounded-full ring-2 ring-card", online ? "bg-healthy" : "bg-offline")} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-brand-navy dark:text-foreground">{me.name}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            ELPREMAR · <span className="tabular-nums font-medium text-foreground">{me.id}</span>
          </p>
          <p className={cn("mt-1.5 flex items-center gap-1.5 text-sm font-medium", online ? "text-healthy" : "text-muted-foreground")}>
            {online ? <CloudCheck className="size-4" /> : <CloudOff className="size-4" />}
            {online ? "All synced" : "Offline · records saved on this tablet"}
          </p>
        </div>
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <DetailPanel icon={HardHat} title="My Profile">
          <DetailList
            rows={[
              { label: "Name", value: `${me.salutation} ${me.name}`, always: true },
              { label: "ELPREMAR ID", value: me.id, always: true },
              { label: "Designation", value: me.designation, always: true },
              { label: "Role", value: me.roles.join(", "), always: true },
              { label: "Experience", value: `${me.experience} years`, always: true },
              { label: "Certifications", value: `${me.certifications} held, earliest expiry ${me.certifiedUntil}`, always: true },
              { label: "Joined", value: me.joined, always: true },
            ]}
          />
        </DetailPanel>

        <DetailPanel icon={Factory} title="Plant Information">
          <DetailList
            rows={[
              /* The posting being worked in; the others are listed under it */
              { label: "Enterprise", value: enterprise, always: true },
              { label: "Plant", value: plant, always: true },
              {
                label: "Other Postings",
                value: postings
                  .filter((p) => p.enterprise !== enterprise)
                  .map((p) => p.enterprise)
                  .join(", "),
              },
              { label: "Department", value: me.department, always: true },
              { label: "Location", value: `${me.city}, ${me.country}`, always: true },
            ]}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            EVITA-AI works one posting at a time. A move is made by EMMS-E and reaches the tablet at the next sync.
          </p>
        </DetailPanel>
      </div>

      {/* ---------- The panels that are not a section of their own ---------- */}
      <ul className="mt-3 divide-y overflow-hidden rounded-2xl bg-card shadow-xs ring-1 ring-foreground/10">
        <Row icon={Bell} title="Notifications" detail={unread ? `${unread} unread` : "Nothing new"} onClick={() => openPanel({ kind: "notifications" })} />
        <Row icon={ShieldCheck} title="Safety Guidelines" detail="What to check before touching an asset" onClick={() => openPanel({ kind: "safety" })} />
        <Row icon={BookOpen} title="SOP Guide" detail="The standard procedure for each activity" onClick={() => openPanel({ kind: "sop" })} />
        <Row icon={TriangleAlert} title="Report an Issue" detail="Raise it with OCC from the field" onClick={() => openPanel({ kind: "issue" })} />
      </ul>

      <Button
        variant="outline"
        className="mt-3 h-14 w-full justify-center border-critical/30 text-base text-critical"
        onClick={() => {
          // TODO: warn before signing out while records are still waiting to sync
          void signOut()
          navigate("/login?reason=signed-out", { replace: true })
        }}
      >
        <LogOut /> Logout
      </Button>

      <p className="mt-3 flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>EVITA-AI PWA Client</span>
        <span className="tabular-nums">v1.0.0</span>
      </p>
    </div>
  )
}

/** One tappable row in the list, sized for a thumb */
function Row({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: LucideIcon
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <li>
      <button type="button" onClick={onClick} className="flex min-h-16 w-full items-center gap-3 px-4 text-left hover:bg-muted/50">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-primary">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block truncate text-sm text-muted-foreground">{detail}</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </button>
    </li>
  )
}
