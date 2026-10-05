import { useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Camera, Eye, FileText, Trash2, Upload, UploadCloud, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { StepCard } from "@/components/common/wizard"
import { AssetPhoto } from "@/components/common/asset-photo"
import { CheckList, DetailList, DetailPanel } from "@/components/common/detail-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { assetDocumentTypes, assetImageSlots } from "@/data/master-data"
import { td, th } from "@/lib/data-table"
import { missingUploads, type AssetFormValues } from "@/pages/assets/schemas"

const IMAGE_TYPES = "image/png,image/jpeg"
const DOCUMENT_TYPES = "application/pdf,image/png,image/jpeg"
const MAX_IMAGE_MB = 5
const MAX_DOCUMENT_MB = 10

/**
 * Step 3 of 4: the photographs and paperwork that back the ratings.
 *
 * Front, side and nameplate shots are mandatory — without a nameplate photo the
 * ratings typed in step 2 cannot be checked against the asset. The preview panel
 * finally has something to show here, so it carries the front view.
 */
export function StepUploads({ form }: { form: UseFormReturn<AssetFormValues> }) {
  const values = form.watch()
  const images = values.images ?? {}
  const documents = values.documents ?? {}
  const missing = missingUploads(values)

  const setImage = (slot: string, file?: File) =>
    form.setValue("images", { ...images, [slot]: file }, { shouldDirty: true })

  const setDocument = (key: string, file?: File) =>
    form.setValue("documents", { ...documents, [key]: file }, { shouldDirty: true })

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <StepCard
        title="Step 3 of 4: Images & Documents"
        description="Upload clear images and the required documents for the asset."
      >
        {/* ---------- Photographs ---------- */}
        <section className="rounded-lg ring-1 ring-foreground/10">
          <h4 className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg bg-info-soft px-3 py-2">
            <span className="flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
              <Camera className="size-5 text-primary" /> Asset Images
            </span>
            <span className="text-xs text-muted-foreground">
              Photograph from different angles · JPG or PNG, up to {MAX_IMAGE_MB} MB each
            </span>
          </h4>
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
            {assetImageSlots.map((slot) => (
              <ImageSlot
                key={slot.key}
                label={slot.label}
                required={slot.required}
                file={images[slot.key]}
                onPick={(file) => setImage(slot.key, file)}
                onClear={() => setImage(slot.key, undefined)}
              />
            ))}
          </div>
        </section>

        {/* ---------- Documents ---------- */}
        <section className="mt-3 rounded-lg ring-1 ring-foreground/10">
          <h4 className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg bg-info-soft px-3 py-2">
            <span className="flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
              <FileText className="size-5 text-primary" /> Required Documents
            </span>
            <span className="text-xs text-muted-foreground">PDF, JPG or PNG, up to {MAX_DOCUMENT_MB} MB each</span>
          </h4>
          <div className="overflow-x-auto p-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={th}>Document Type</TableHead>
                  <TableHead className={th}>Status</TableHead>
                  <TableHead className={th}>File Name</TableHead>
                  <TableHead className={cn(th, "text-right")}>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetDocumentTypes.map((doc) => (
                  <DocumentRow
                    key={doc.key}
                    label={doc.label}
                    required={doc.required}
                    file={documents[doc.key]}
                    onPick={(file) => setDocument(doc.key, file)}
                    onClear={() => setDocument(doc.key, undefined)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </StepCard>

      {/* ---------- Preview, which finally has a photograph to show ---------- */}
      <div className="space-y-3">
        <DetailPanel title="Asset Preview" contentClassName="space-y-3">
          <div className="h-40 overflow-hidden rounded-lg ring-1 ring-foreground/10">
            <AssetPhoto file={images.front} label="Front View" caption={values.tag} />
          </div>
          <DetailList
            rows={[
              { label: "Asset Tag ID", value: values.tag, always: true },
              { label: "Category", value: values.category, always: true },
              { label: "Location", value: values.area },
              { label: "Plant", value: values.plant },
              { label: "Enterprise", value: values.enterprise },
              { label: "Manufacturer", value: values.manufacturer },
              { label: "Model", value: values.model },
              {
                label: "Capacity",
                value: values.capacity ? `${values.capacity} ${values.capacityUnit}` : "",
              },
              {
                label: "Voltage",
                value: values.primaryVoltage
                  ? `${values.primaryVoltage} ${values.primaryVoltageUnit} / ${values.secondaryVoltage} ${values.secondaryVoltageUnit}`
                  : "",
              },
              { label: "Serial Number", value: values.serial },
            ]}
          />
        </DetailPanel>

        <CheckList
          title="Image & Document Checklist"
          items={[
            ...assetImageSlots
              .filter((s) => s.required)
              .map((s) => ({ label: `${s.label} image uploaded`, done: !!images[s.key] })),
            { label: "Required documents uploaded", done: missing.documents.length === 0 },
            {
              label: "Optional images added",
              done: assetImageSlots.filter((s) => !s.required).every((s) => !!images[s.key]),
            },
          ]}
        />
      </div>
    </div>
  )
}

/* ---------- Pieces ---------- */

function ImageSlot({
  label,
  required,
  file,
  onPick,
  onClear,
}: {
  label: string
  required: boolean
  file?: File
  onPick: (file: File) => void
  onClear: () => void
}) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <div>
      <div className="relative h-28 overflow-hidden rounded-lg ring-1 ring-foreground/10">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="size-full transition-opacity hover:opacity-85"
          aria-label={file ? `Replace the ${label} photograph` : `Add the ${label} photograph`}
        >
          <AssetPhoto file={file} label={label} />
        </button>
        {file ? (
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            aria-label={`Remove the ${label} photograph`}
            onClick={onClear}
            className="absolute top-1 right-1 rounded-full"
          >
            <X />
          </Button>
        ) : (
          <span className="pointer-events-none absolute right-1 bottom-1 rounded-full bg-background/90 p-1 text-primary">
            <UploadCloud className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-1 text-center text-xs leading-tight font-medium">
        {label}
        {required ? <span className="text-critical"> *</span> : null}
      </p>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES}
        className="sr-only"
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked && within(picked, MAX_IMAGE_MB)) onPick(picked)
          // Reset, so picking the same file twice still fires a change
          e.target.value = ""
        }}
      />
    </div>
  )
}

function DocumentRow({
  label,
  required,
  file,
  onPick,
  onClear,
}: {
  label: string
  required: boolean
  file?: File
  onPick: (file: File) => void
  onClear: () => void
}) {
  const input = useRef<HTMLInputElement>(null)

  return (
    <TableRow>
      <TableCell className={cn(td, "max-w-56 whitespace-normal font-medium")}>
        {label}
        {required ? <span className="text-critical"> *</span> : null}
      </TableCell>
      <TableCell className={td}>
        {file ? (
          <Badge variant="success" className="h-auto rounded px-2 py-1 text-xs">
            Uploaded
          </Badge>
        ) : (
          <Badge variant="neutral" className="h-auto rounded px-2 py-1 text-xs">
            {required ? "Required" : "Optional"}
          </Badge>
        )}
      </TableCell>
      <TableCell className={cn(td, "max-w-64 truncate text-muted-foreground")} title={file?.name}>
        {file?.name ?? "—"}
      </TableCell>
      <TableCell className={cn(td, "text-right whitespace-nowrap")}>
        {file ? (
          <span className="inline-flex gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Preview ${label}`}
              onClick={() => window.open(URL.createObjectURL(file), "_blank", "noopener")}
            >
              <Eye />
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Replace ${label}`} onClick={() => input.current?.click()}>
              <Upload />
            </Button>
            <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${label}`} onClick={onClear} className="text-critical">
              <Trash2 />
            </Button>
          </span>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <Upload /> Upload
          </Button>
        )}
        <input
          ref={input}
          type="file"
          accept={DOCUMENT_TYPES}
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files?.[0]
            if (picked && within(picked, MAX_DOCUMENT_MB)) onPick(picked)
            e.target.value = ""
          }}
        />
      </TableCell>
    </TableRow>
  )
}

/** Rejects an oversized file with a message, rather than failing quietly at sync */
function within(file: File, limitMb: number) {
  if (file.size <= limitMb * 1024 * 1024) return true
  toast.error(`${file.name} is larger than ${limitMb} MB. Capture it again at a lower resolution.`)
  return false
}
