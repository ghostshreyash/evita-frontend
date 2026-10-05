import { Construction } from "lucide-react"

import { PageHeader } from "@/components/common/page-header"

/** Stand-in for EVITA sections whose screens are not built yet */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} breadcrumbs={[{ label: title }]} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card py-24 text-center shadow-xs ring-1 ring-foreground/10">
        <div className="flex size-14 items-center justify-center rounded-full bg-info-soft text-primary">
          <Construction className="size-7" />
        </div>
        <h3 className="text-lg font-semibold">Screen design pending</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          This EVITA screen is not built yet. It will follow the approved design.
        </p>
      </div>
    </div>
  )
}
