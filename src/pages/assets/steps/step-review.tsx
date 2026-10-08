import type { UseFormReturn } from "react-hook-form"
import { Building2, FileText, Images, Pencil, Settings } from "lucide-react"
import { cn } from "cn"

import { AssetPhoto } from "@/components/common/asset-photo"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { assetDetailRows, assetTechnicalRows } from "@/components/assets/asset-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { profileFrom } from "@/data/asset-store"
import { td, th } from "@/lib/data-table"
import type { AssetFormValues } from "@/pages/assets/schemas"

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
  const images = values.images ?? []
  const documents = values.documents ?? []

  // form.watch() hands back a fresh object each render, so there is nothing to memoise
  const profile = profileFrom(values, { onboarded: "" })

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

      <div className="grid items-start gap-3 lg:grid-cols-2">
        <DetailPanel
          icon={Building2}
          title="Asset Details"
          action={<EditButton onClick={() => onEdit(0)} />}
        >
          <DetailList rows={assetDetailRows(profile)} />
        </DetailPanel>

        <DetailPanel
          icon={Settings}
          title="Technical Details"
          action={<EditButton onClick={() => onEdit(1)} />}
        >
          <DetailList rows={assetTechnicalRows(profile)} />
        </DetailPanel>

        <DetailPanel
          icon={Images}
          title={`Asset Images (${images.length})`}
          action={<EditButton onClick={() => onEdit(2)} />}
        >
          {images.length ? (
            <div className="grid grid-cols-3 gap-2">
              {images.map((image) => (
                <figure key={image.id}>
                  <div className="h-20 overflow-hidden rounded-md ring-1 ring-foreground/10">
                    <AssetPhoto file={image.file} label={image.name} />
                  </div>
                  <figcaption className="mt-1 line-clamp-2 text-center text-xs leading-tight">{image.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No photographs uploaded yet.</p>
          )}
        </DetailPanel>

        <DetailPanel
          icon={FileText}
          title={`Documents (${documents.length})`}
          action={<EditButton onClick={() => onEdit(2)} />}
          contentClassName="px-1"
        >
          {documents.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={th}>Name</TableHead>
                  <TableHead className={th}>File</TableHead>
                  <TableHead className={th}>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className={cn(td, "max-w-44 whitespace-normal font-medium")}>{doc.name}</TableCell>
                    <TableCell className={cn(td, "max-w-44 truncate text-muted-foreground")} title={doc.file?.name}>
                      {doc.file?.name}
                    </TableCell>
                    <TableCell className={td}>
                      <Badge variant="success" className="h-auto rounded px-2 py-1 text-xs">
                        Uploaded
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">No documents attached.</p>
          )}
        </DetailPanel>
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
