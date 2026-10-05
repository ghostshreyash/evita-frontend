import { Fragment } from "react"
import { Link } from "react-router"

/** A crumb links (`to`), runs an in-page action (`onClick`), or is the current page */
type Crumb = { label: string; to?: string; onClick?: () => void }

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: {
  title: string
  description?: string
  breadcrumbs?: Crumb[]
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        {breadcrumbs?.length ? (
          <nav className="mb-1 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link to="/" className="py-1 hover:text-foreground">Home</Link>
            {breadcrumbs.map((c) => (
              <Fragment key={c.label}>
                <span aria-hidden="true">›</span>
                {c.to ? (
                  <Link to={c.to} className="rounded-sm hover:text-foreground hover:underline">{c.label}</Link>
                ) : c.onClick ? (
                  <button type="button" onClick={c.onClick} className="rounded-sm hover:text-foreground hover:underline">
                    {c.label}
                  </button>
                ) : (
                  <span aria-current="page" className="font-medium text-foreground">{c.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
        ) : null}
        <h2 className="text-2xl font-bold text-brand-navy dark:text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
