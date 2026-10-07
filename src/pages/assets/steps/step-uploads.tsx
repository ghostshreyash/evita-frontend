import { useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Camera, Eye, FileText, Paperclip, Plus, Trash2, UploadCloud } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { StepCard } from "@/components/common/wizard"
import { AssetPhoto } from "@/components/common/asset-photo"
import { CheckList, DetailList, DetailPanel } from "@/components/common/detail-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { suggestedDocumentNames, suggestedImageNames } from "@/data/master-data"
import { missingUploads, type AssetFormValues, type AssetUpload } from "@/pages/assets/schemas"

const IMAGE_TYPES = "image/png,image/jpeg"
const DOCUMENT_TYPES = "application/pdf,image/png,image/jpeg"
const MAX_IMAGE_MB = 5
const MAX_DOCUMENT_MB = 10

const IMAGE_LIST = "suggested-image-names"
const DOCUMENT_LIST = "suggested-document-names"

/**
 * Step 3 of 4: the photographs and paperwork that back the ratings.
 *
 * There is no fixed set of slots to fill. The client confirmed on 07-10-2026
 * that what is available varies from asset to asset and site to site, so the
 * engineer adds as many photographs and documents as the asset actually has and
 * names each one. The old fixed labels survive as suggestions on the name box.
 *
 * Photographs stay a tile grid rather than becoming a list of form rows: on a
 * tablet the picture is what is being checked, so it leads and the name sits
 * under it. Documents are a list, because a file name is all there is to see.
 */
export function StepUploads({ form }: { form: UseFormReturn<AssetFormValues> }) {
  const values = form.watch()
  const images = values.images ?? []
  const documents = values.documents ?? []
  const missing = missingUploads(values)

  const setImages = (next: AssetUpload[]) => form.setValue("images", next, { shouldDirty: true, shouldValidate: true })
  const setDocuments = (next: AssetUpload[]) =>
    form.setValue("documents", next, { shouldDirty: true, shouldValidate: true })

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <StepCard
        title="Step 3 of 4: Images & Documents"
        description="Add what this asset actually has, and name each one so the next engineer knows what they are looking at."
      >
        {/* ---------- Photographs ---------- */}
        <Section
          icon={Camera}
          title="Asset Images"
          count={images.length}
          hint={`JPG or PNG · up to ${MAX_IMAGE_MB} MB each`}
        >
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((item) => (
              <figure key={item.id} className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
                <div className="relative h-28 bg-muted/40">
                  <AssetPhoto file={item.file} label={item.name} />
                  <div className="absolute top-1 right-1 flex gap-1">
                    {item.file ? (
                      <IconAction label={`Preview ${item.name}`} onClick={() => preview(item)}>
                        <Eye />
                      </IconAction>
                    ) : null}
                    <IconAction
                      label={`Remove ${item.name}`}
                      destructive
                      onClick={() => setImages(images.filter((i) => i.id !== item.id))}
                    >
                      <Trash2 />
                    </IconAction>
                  </div>
                </div>
                <figcaption className="p-1.5">
                  <Input
                    aria-label="Photograph name"
                    value={item.name}
                    maxLength={60}
                    list={IMAGE_LIST}
                    placeholder="Name this photo"
                    aria-invalid={!item.name.trim()}
                    onChange={(e) => setImages(rename(images, item.id, e.target.value))}
                    className="h-9 text-sm"
                  />
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={item.file?.name}>
                    {item.file?.name}
                  </span>
                </figcaption>
              </figure>
            ))}

            <AddTile
              label="Add photographs"
              note="or drag them here"
              accept={IMAGE_TYPES}
              onAdd={(files) => setImages([...images, ...toUploads(files, images.length, MAX_IMAGE_MB)])}
            />
          </div>
          {images.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              At least one photograph is needed — capture the asset from whichever angles matter here.
            </p>
          ) : null}
        </Section>

        {/* ---------- Documents ---------- */}
        <Section
          className="mt-3"
          icon={FileText}
          title="Documents"
          count={documents.length}
          hint={`PDF, JPG or PNG · up to ${MAX_DOCUMENT_MB} MB each`}
        >
          <ul className="space-y-2">
            {documents.map((item) => (
              <li key={item.id} className="flex items-center gap-2.5 rounded-lg p-2 ring-1 ring-foreground/10">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-info-soft text-primary">
                  <Paperclip className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <Input
                    aria-label="Document name"
                    value={item.name}
                    maxLength={60}
                    list={DOCUMENT_LIST}
                    placeholder="Name this document"
                    aria-invalid={!item.name.trim()}
                    onChange={(e) => setDocuments(rename(documents, item.id, e.target.value))}
                    className="h-9 text-sm"
                  />
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={item.file?.name}>
                    {item.file?.name} · {size(item.file)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  {item.file ? (
                    <IconAction label={`Preview ${item.name}`} onClick={() => preview(item)}>
                      <Eye />
                    </IconAction>
                  ) : null}
                  <IconAction
                    label={`Remove ${item.name}`}
                    destructive
                    onClick={() => setDocuments(documents.filter((d) => d.id !== item.id))}
                  >
                    <Trash2 />
                  </IconAction>
                </span>
              </li>
            ))}
          </ul>

          <AddTile
            className={cn("h-20", documents.length && "mt-2")}
            label="Add documents"
            note="or drag them here"
            accept={DOCUMENT_TYPES}
            onAdd={(files) => setDocuments([...documents, ...toUploads(files, documents.length, MAX_DOCUMENT_MB)])}
          />
        </Section>

        {/* One datalist per kind, shared by every name box in that section */}
        <Suggestions id={IMAGE_LIST} names={suggestedImageNames} />
        <Suggestions id={DOCUMENT_LIST} names={suggestedDocumentNames} />
      </StepCard>

      {/* ---------- Preview, which finally has a photograph to show ---------- */}
      <div className="space-y-3">
        <DetailPanel title="Asset Preview" contentClassName="space-y-3">
          <div className="h-40 overflow-hidden rounded-lg ring-1 ring-foreground/10">
            <AssetPhoto file={images[0]?.file} label={images[0]?.name ?? "Asset"} caption={values.tag} />
          </div>
          <DetailList
            rows={[
              { label: "Asset Name", value: values.tag, always: true },
              { label: "Category", value: values.category, always: true },
              { label: "Location / Area", value: values.area },
              { label: "Plant", value: values.plant },
              { label: "Enterprise", value: values.enterprise },
              { label: "Manufacturer", value: values.manufacturer },
              { label: "Model", value: values.model },
              { label: "Capacity", value: values.capacity ? `${values.capacity} ${values.capacityUnit}` : "" },
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
          title="Upload Checklist"
          items={[
            { label: "At least one photograph", done: missing.images > 0 },
            { label: "Supporting documents attached", done: missing.documents > 0 },
            { label: "Every upload named", done: missing.unnamed === 0 },
          ]}
        />
      </div>
    </div>
  )
}

/* ---------- Pieces ---------- */

/** A titled block with a count and the format note, matching the other steps */
function Section({
  icon: Icon,
  title,
  count,
  hint,
  className,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  count: number
  hint: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("rounded-lg ring-1 ring-foreground/10", className)}>
      <h4 className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-t-lg bg-info-soft px-3 py-2">
        <span className="flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
          <Icon className="size-5 text-primary" />
          {title}
          <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold tabular-nums">{count}</span>
        </span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </h4>
      <div className="p-3">{children}</div>
    </section>
  )
}

/** The dashed tile that takes a click or a drop, as the mockup draws it */
function AddTile({
  label,
  note,
  accept,
  onAdd,
  className,
}: {
  label: string
  note: string
  accept: string
  onAdd: (files: FileList | null) => void
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onAdd(e.dataTransfer.files)
      }}
      className={cn(
        "flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2 text-center transition-colors",
        over ? "border-primary bg-info-soft" : "border-input bg-muted/30 hover:border-primary hover:bg-accent",
        className
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-full bg-background text-primary">
        {over ? <UploadCloud className="size-5" /> : <Plus className="size-5" />}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{note}</span>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          onAdd(e.target.files)
          // Reset, so picking the same file twice still fires a change
          e.target.value = ""
        }}
      />
    </button>
  )
}

/** Small round button sitting over a thumbnail */
function IconAction({
  label,
  destructive,
  onClick,
  children,
}: {
  label: string
  destructive?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="secondary"
      aria-label={label}
      onClick={onClick}
      className={cn("size-7 rounded-full bg-background/90 shadow-sm", destructive && "text-critical")}
    >
      {children}
    </Button>
  )
}

function Suggestions({ id, names }: { id: string; names: readonly string[] }) {
  return (
    <datalist id={id}>
      {names.map((name) => (
        <option key={name} value={name} />
      ))}
    </datalist>
  )
}

/* ---------- Helpers ---------- */

const rename = (items: AssetUpload[], id: string, name: string) =>
  items.map((i) => (i.id === id ? { ...i, name } : i))

/** Picked files as named uploads, oversized ones rejected with a message */
function toUploads(files: FileList | null, offset: number, limitMb: number): AssetUpload[] {
  return [...(files ?? [])]
    .filter((file) => within(file, limitMb))
    .map((file, i) => ({ id: `${offset + i}-${file.size}-${file.name}`, name: nameFrom(file), file }))
}

/** The file name without its extension, as a first guess at what to call it */
const nameFrom = (file: File) => file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 60)

const size = (file?: File) => (file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "")

const preview = (item: AssetUpload) => window.open(URL.createObjectURL(item.file), "_blank", "noopener")

function within(file: File, limitMb: number) {
  if (file.size <= limitMb * 1024 * 1024) return true
  toast.error(`${file.name} is larger than ${limitMb} MB. Capture it again at a lower resolution.`)
  return false
}
