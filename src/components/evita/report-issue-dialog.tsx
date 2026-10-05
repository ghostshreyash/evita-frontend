import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TriangleAlert, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { SelectField, TextareaField, TextField } from "@/components/form/fields"
import { CaptureTile } from "@/components/evita/photo-capture"
import type { EvidenceItem } from "@/data/evidence"
import { priorities } from "@/data/mock"
import { ticketCategories, type TicketCategory } from "@/data/occ-tables"
import { raiseTicket } from "@/data/ticket-store"
import { required } from "@/lib/validation"
import { useCurrentElpremar } from "@/lib/me"
import type { Panel } from "@/lib/ui-store"

const schema = z.object({
  subject: required("Subject").max(120),
  description: required("Description").max(1000),
  category: z.enum(ticketCategories, "Choose a category"),
  priority: z.enum(priorities, "Choose a priority"),
})
type Values = z.infer<typeof schema>

/** Which category a report most likely belongs to, from where it was raised */
const categoryFor = (ctx: Extract<Panel, { kind: "issue" }>): TicketCategory =>
  ctx.jobKind === "inspection" ? "Inspection" : ctx.jobKind === "maintenance" ? "Maintenance" : ctx.assetId ? "Asset" : "Technical"

/**
 * Report an Issue: raises a support ticket to the OLIVINE desk with the same
 * fields as OCC's Raise Support Ticket screen. Opened from a task or an asset,
 * it carries that context across so the desk never has to ask which record.
 */
export function ReportIssueDialog({
  context,
  onOpenChange,
}: {
  context: Extract<Panel, { kind: "issue" }> | null
  onOpenChange: (o: boolean) => void
}) {
  const me = useCurrentElpremar()
  const [photos, setPhotos] = useState<EvidenceItem[]>([])

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { subject: "", description: "", category: context ? categoryFor(context) : "Technical", priority: "Medium" },
  })

  if (!context) return null
  const where = [context.asset, context.plant ?? me.plant].filter(Boolean).join(" · ")

  async function onSubmit(values: Values) {
    if (!context) return
    const id = raiseTicket(
      {
        enterprise: context.enterprise ?? me.enterprise,
        plant: context.plant ?? me.plant,
        country: me.country,
        subject: values.subject,
        description: values.description,
        category: values.category,
        priority: values.priority,
        source: "EVITA",
        assetId: context.assetId,
        inspectionId: context.jobKind === "inspection" ? context.jobId : undefined,
        maintenanceId: context.jobKind === "maintenance" ? context.jobId : undefined,
        attachments: photos.map((p) => p.caption),
      },
      me.name
    )
    toast.success(`Ticket ${id} raised`, { description: "The OLIVINE helpdesk will pick it up and keep you posted." })
    onOpenChange(false)
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TriangleAlert className="size-5 text-critical" /> Report an Issue
          </DialogTitle>
          <DialogDescription className="text-sm">
            Raises a ticket with the OLIVINE helpdesk{where ? ` for ${where}` : ""}. For anything unsafe, make the area safe first.
          </DialogDescription>
        </DialogHeader>

        <form id="report-issue" onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <TextField control={form.control} name="subject" label="Subject" required className="sm:col-span-2" placeholder="e.g. Panel door hinge broken" />
          <TextareaField control={form.control} name="description" label="What did you find?" required rows={4} className="sm:col-span-2" />
          <SelectField control={form.control} name="category" label="Category" required options={ticketCategories} />
          <SelectField control={form.control} name="priority" label="Priority" required options={priorities} />
          {context.jobId || context.assetId ? (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground sm:col-span-2">
              Linked to {[context.jobId, context.assetId].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <div className="mb-2 text-sm font-medium">Photos (optional)</div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {photos.map((p) => (
                <div key={p.id} className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg ring-1 ring-foreground/10">
                  <img src={p.src} alt={p.caption} className="size-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}
                    className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <CaptureTile kind="photo" label="Add photo" onCapture={(items) => setPhotos((ps) => [...ps, ...items])} />
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="report-issue" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Spinner /> : null} Raise Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
