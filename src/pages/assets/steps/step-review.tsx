import type { UseFormReturn } from "react-hook-form"
import { Building2, Cog, FileText, Images, Pencil, Settings } from "lucide-react"
import { cn } from "cn"

import { AssetPhoto } from "@/components/common/asset-photo"
import { CheckList, DetailList, DetailPanel } from "@/components/common/detail-list"
import { assetDetailRows, assetOperationalRows, assetTechnicalRows } from "@/components/assets/asset-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { profileFrom } from "@/data/asset-store"
import { assetDocumentTypes, assetImageSlots } from "@/data/master-data"
import { td, th } from "@/lib/data-table"
import { missingUploads, type AssetFormValues } from "@/pages/assets/schemas"

/**
 * Step 4 of 4: everything the engineer entered, grouped the way the detail
 * screen will show it, with each block linking back to the step that filled it.
 *
 * The panels are built from the same `profileFrom` the asset is registered with,
 * so what is reviewed here is literally what gets stored.
 */
export function StepReview({
  form,
  onEdit,
}: {
  form: UseFormReturn<AssetFormValues>
  /** Jump back to a step to change an answer */
  onEdit: (step: number) => void
}) {
  const values = form.watch()
  const images = values.images ?? {}
  const documents = values.documents ?? {}
  const missing = missingUploads(values)

  // form.watch() hands back a fresh object each render, so there is nothing to memoise
  const profile = profileFrom(values, { installed: values.installed ?? "", onboarded: "" })

  const uploaded = assetImageSlots.filter((s) => images[s.key])

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-brand-navy dark:text-foreground">Step 4 of 4: Review &amp; Submit</h3>
          <p className="text-sm text-muted-foreground">
            Check everything below before submitting. Any section can still be edited.
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        <DetailPanel
          icon={Building2}
          title="1. Asset Details"
          action={<EditButton onClick={() => onEdit(0)} />}
        >
          <DetailList rows={assetDetailRows(profile)} />
        </DetailPanel>

        <DetailPanel
          icon={Settings}
          title="2. Technical Details"
          action={<EditButton onClick={() => onEdit(1)} />}
        >
          <DetailList rows={assetTechnicalRows(profile)} />
        </DetailPanel>

        <DetailPanel
          icon={Images}
          title={`Asset Images (${uploaded.length})`}
          action={<EditButton onClick={() => onEdit(2)} />}
          className="lg:col-span-2 xl:col-span-1"
        >
          {uploaded.length ? (
            <div className="grid grid-cols-3 gap-2">
              {uploaded.map((slot) => (
                <figure key={slot.key}>
                  <div className="h-20 overflow-hidden rounded-md ring-1 ring-foreground/10">
                    <AssetPhoto file={images[slot.key]} label={slot.label} />
                  </div>
                  <figcaption className="mt-1 text-center text-xs leading-tight">{slot.label}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No photographs uploaded yet.</p>
          )}
        </DetailPanel>

        <DetailPanel
          icon={FileText}
          title="3. Documents"
          action={<EditButton onClick={() => onEdit(2)} />}
          contentClassName="px-1"
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={th}>Document Type</TableHead>
                <TableHead className={th}>File Name</TableHead>
                <TableHead className={th}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetDocumentTypes.map((doc) => {
                const file = documents[doc.key]
                return (
                  <TableRow key={doc.key}>
                    <TableCell className={cn(td, "max-w-44 whitespace-normal font-medium")}>{doc.label}</TableCell>
                    <TableCell className={cn(td, "max-w-44 truncate text-muted-foreground")} title={file?.name}>
                      {file?.name ?? "—"}
                    </TableCell>
                    <TableCell className={td}>
                      <Badge variant={file ? "success" : "neutral"} className="h-auto rounded px-2 py-1 text-xs">
                        {file ? "Uploaded" : doc.required ? "Required" : "Optional"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </DetailPanel>

        <DetailPanel
          icon={Cog}
          title="4. Operational Details"
          action={<EditButton onClick={() => onEdit(1)} />}
        >
          <DetailList rows={assetOperationalRows(profile)} />
        </DetailPanel>

        <CheckList
          title="Submission Checklist"
          items={[
            { label: "Asset details completed", done: !!values.tag && !!values.category && !!values.area },
            { label: "Technical details completed", done: !!values.primaryVoltage && !!values.capacity && !!values.cooling },
            { label: "Images uploaded", done: missing.images.length === 0 },
            { label: "Required documents uploaded", done: missing.documents.length === 0 },
            { label: "Information reviewed", done: true },
          ]}
          className="self-start"
        />
      </div>
    </div>
  )
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick} className="text-primary hover:bg-primary/10">
      <Pencil /> Edit
    </Button>
  )
}
