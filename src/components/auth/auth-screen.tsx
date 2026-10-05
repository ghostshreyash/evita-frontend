import { ChevronDown, Globe } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { OlivineLogo } from "@/components/layout/olivine-logo"
import { brand } from "@/config/brand"

/** Staggered entrance, so the screen assembles rather than appearing at once. */
export function Rise({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/** Swap the CDN photograph for the bundled plate if it cannot be reached (offline on site). */
function onPhotoError(event: React.SyntheticEvent<HTMLImageElement>) {
  if (event.currentTarget.src !== new URL(brand.photo, window.location.origin).href) {
    event.currentTarget.src = brand.photo
  }
}

/**
 * The frame every sign-in screen shares: the field photograph behind, the
 * Olivine bar on top, the story panel on the left and the card on the right,
 * and the promises along the foot.
 *
 * In landscape (≥1024px) the story panel sits beside the card; in portrait the
 * card stands alone in the middle so the on-screen keyboard leaves it visible.
 */
export function AuthScreen({
  story,
  width = "default",
  children,
}: {
  /** Left-hand panel; omitted on the short forms, which centre the card. */
  story?: React.ReactNode
  /** "wide" gives the form-heavy screens room for their two-column fields. */
  width?: "default" | "wide"
  children: React.ReactNode
}) {
  return (
    <div className="group relative flex min-h-svh flex-col overflow-hidden bg-brand-navy text-brand-navy-foreground">
      {/* Field photograph with the navy wedge from the mockup */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={brand.photoUrl}
          onError={onPhotoError}
          alt=""
          className="absolute inset-0 size-full object-cover object-[center_22%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/90 via-brand-navy/15 via-42% to-brand-navy/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/65 via-transparent to-brand-navy/10" />
        <div className="absolute inset-y-0 left-0 w-[46%] bg-[#062957]/92 [clip-path:polygon(0_12%,100%_27%,84%_100%,0_100%)] max-lg:hidden" />
        <div className="absolute inset-y-0 left-0 w-[36%] bg-[#0b3768]/60 [clip-path:polygon(0_0,100%_9%,100%_28%,0_14%)] max-lg:hidden" />
      </div>

      <header className="relative flex items-center justify-between gap-3 px-6 py-4 lg:px-10">
        <Rise>
          <OlivineLogo className="h-14 w-auto rounded-lg bg-[#f7f4ee] px-3 py-1.5 shadow-lg" />
        </Rise>
        <Rise delay={80}>
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-brand-navy hover:bg-slate-50"
            aria-label="Change language"
          >
            <Globe /> English <ChevronDown />
          </Button>
        </Rise>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-6 pb-8",
          story && "lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] lg:gap-14 lg:px-10"
        )}
      >
        {story ? <div className="min-w-0 max-lg:hidden">{story}</div> : null}
        <div
          className={cn(
            "w-full",
            story ? "mx-auto max-w-lg lg:mx-0 lg:max-w-none lg:justify-self-end" : cn("mx-auto", width === "wide" ? "max-w-2xl" : "max-w-lg")
          )}
        >
          {children}
        </div>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-white px-6 py-3 text-sm text-brand-navy">
        <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {brand.promises.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 font-semibold">
              <Icon className="size-4 text-primary" />
              {label}
            </span>
          ))}
        </span>
        <span className="flex items-center gap-3 text-brand-navy/70">
          Version 1.0.0 <span className="text-brand-navy/30">|</span> © {new Date().getFullYear()} Olivine Global
          Systems. All rights reserved.
        </span>
      </footer>
    </div>
  )
}

/**
 * The card itself. Every auth step uses it, so the box stays put while its
 * contents change — the verification step feels like the next page of the same
 * form rather than a different screen.
 */
export function AuthCard({
  emblem = true,
  title,
  description,
  badge,
  above,
  children,
  footer,
  delay = 120,
}: {
  /** The EVITA wordmark over the title; the later steps of a flow leave it off. */
  emblem?: boolean
  title: string
  description?: string
  /** Small pill over the title, e.g. the step. */
  badge?: React.ReactNode
  /** Between the header and the form, e.g. the step dots. */
  above?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  delay?: number
}) {
  return (
    <Rise delay={delay}>
      <section className="rounded-2xl border border-white/70 bg-white/95 p-7 text-card-foreground shadow-[0_18px_55px_rgba(5,35,75,0.24)] backdrop-blur-sm lg:p-9">
        {emblem ? (
          <div className="mb-6 text-center">
            <div className="bg-gradient-to-r from-[#164d9b] via-[#0b3b80] to-[#68a83c] bg-clip-text text-[3.3rem] leading-none font-black tracking-[-0.06em] text-transparent">
              EVITA<sup className="ml-1 align-super text-sm font-bold text-[#164d9b]">™</sup>
            </div>
            <p className="mt-2 text-sm leading-tight font-medium text-[#163b72]">
              Enterprise Electrical Maintenance
              <br />&amp; Reliability Management System
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#b8cadf]" />
              <span className="text-sm whitespace-nowrap text-[#31578e] italic">{brand.tagline}</span>
              <span className="h-px flex-1 bg-[#b8cadf]" />
            </div>
          </div>
        ) : null}
        {badge ? <div className="mb-3">{badge}</div> : null}
        <h1 className="text-[1.8rem] font-bold tracking-tight text-brand-navy">{title}</h1>
        {description ? <p className="mt-1.5 text-base text-muted-foreground">{description}</p> : null}
        {above ? <div className="mt-5">{above}</div> : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t pt-5">{footer}</div> : null}
      </section>
    </Rise>
  )
}

/** Links that sit under the card, with their own backing so they read on the photograph. */
export function AuthAside({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex justify-center">
      <div className="rounded-full bg-brand-navy/70 px-4 py-2 text-center text-sm text-brand-navy-foreground backdrop-blur-sm">
        {children}
      </div>
    </div>
  )
}

/** Small capsule used for the step indicator above a card title. */
export function AuthBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  )
}

/** Error / notice panel. */
export function AuthNotice({
  variant = "error",
  icon,
  children,
}: {
  variant?: "error" | "warning" | "info"
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-4 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm animate-in fade-in slide-in-from-top-1",
        variant === "error" && "border-critical/30 bg-critical-soft text-critical-soft-foreground",
        variant === "warning" && "border-attention/40 bg-attention-soft text-attention-soft-foreground",
        variant === "info" && "border-info/25 bg-info-soft text-info-soft-foreground"
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** Primary action: full width and tall enough to hit with a gloved thumb. */
export function AuthSubmit({
  busy,
  disabled,
  children,
  className,
}: {
  busy?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={busy || disabled}
      className={cn("group/submit relative h-13 w-full overflow-hidden text-lg font-semibold", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 group-active/submit:opacity-100 group-active/submit:animate-sheen"
      />
      {children}
    </Button>
  )
}
