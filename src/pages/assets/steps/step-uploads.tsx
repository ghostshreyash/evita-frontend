import { useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Camera, Eye, FileText, ImagePlus, Paperclip, Trash2 } from "lucide-react"
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

/**
 * Step 3 of 4: the photographs and paperwork that back the ratings.
 *
 * There is no fixed set of slots to fill. The client confirmed on 07-10-2026
 * that what is available varies from asset to asset and site to site, so the
 * engineer adds as many photographs and documents as the asset actually has and
 * names each one. The names offered below are suggestions that save typing on
 * the common ones, not a checklist to satisfy.
 *
 * A name is seeded from the file name on pick, so nothing is ever left unnamed
 * by accident, and stays editable.
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
        description="Add whatever this asset actually has, and name each one so the next engineer knows what they are looking at."
      >
        {/* ---------- Photographs ---------- */}
        <UploadSection
          icon={Camera}
          title="Asset Images"
          hint={`JPG or PNG, up to ${MAX_IMAGE_MB} MB each`}
          addLabel="Add photograph"
          accept={IMAGE_TYPES}
          limitMb={MAX_IMAGE_MB}
          items={images}
          suggestions={suggestedImageNames}
          onChange={setImages}
          empty="No photographs yet. Capture the asset from the angles that matter — at least one is required."
          render={(item) => (
            <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
              <AssetPhoto file={item.file} label={item.name} />
            </div>
          )}
        />

        {/* ---------- Documents ---------- */}
        <UploadSection
          className="mt-3"
          icon={FileText}
          title="Documents"
          hint={`PDF, JPG or PNG, up to ${MAX_DOCUMENT_MB} MB each`}
          addLabel="Add document"
          accept={DOCUMENT_TYPES}
          limitMb={MAX_DOCUMENT_MB}
          items={documents}
          suggestions={suggestedDocumentNames}
          onChange={setDocuments}
          empty="No documents yet. Add the datasheet, test report or drawing if the site holds one."
          render={() => (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-info-soft text-primary">
              <Paperclip className="size-5" />
            </span>
          )}
        />
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
            { label: `At least one photograph (${missing.images} added)`, done: missing.images > 0 },
            { label: `Documents attached (${missing.documents} added)`, done: missing.documents > 0 },
            { label: "Every upload is named", done: missing.unnamed === 0 },
          ]}
        />
      </div>
    </div>
  )
}

/* ---------- Pieces ---------- */

/**
 * A named list of uploads. Images and documents differ only in what they accept
 * and how a row is illustrated, so both are this one component.
 */
function UploadSection({
  icon: Icon,
  title,
  hint,
  addLabel,
  accept,
  limitMb,
  items,
  suggestions,
  onChange,
  empty,
  render,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint: string
  addLabel: string
  accept: string
  limitMb: number
  items: AssetUpload[]
  suggestions: readonly string[]
  onChange: (next: AssetUpload[]) => void
  empty: string
  /** The thumbnail or glyph shown beside the name */
  render: (item: AssetUpload) => React.ReactNode
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)

  const add = (files: FileList | null) => {
    const picked = [...(files ?? [])].filter((f) => within(f, limitMb))
    if (!picked.length) return
    onChange([
      ...items,
      ...picked.map((file, i) => ({ id: `${file.name}-${items.length + i}-${file.size}`, name: nameFrom(file), file })),
    ])
  }

  const rename = (id: string, name: string) => onChange(items.map((i) => (i.id === id ? { ...i, name } : i)))
  const remove = (id: string) => onChange(items.filter((i) => i.id !== id))

  return (
    <section className={cn("rounded-lg ring-1 ring-foreground/10", className)}>
      <h4 className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg bg-info-soft px-3 py-2">
        <span className="flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
          <Icon className="size-5 text-primary" /> {title}
          <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-medium tabular-nums">{items.length}</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{hint}</span>
          <Button type="button" size="sm" onClick={() => input.current?.click()}>
            <ImagePlus /> {addLabel}
          </Button>
        </span>
      </h4>

      <div className="space-y-2 p-3">
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg p-2 ring-1 ring-foreground/10">
              {render(item)}
              <div className="min-w-48 flex-1">
                <label htmlFor={`name-${item.id}`} className="text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <Input
                  id={`name-${item.id}`}
                  value={item.name}
                  maxLength={60}
                  list={`suggest-${title.replace(/\W/g, "")}`}
                  onChange={(e) => rename(item.id, e.target.value)}
                  aria-invalid={!item.name.trim()}
                  placeholder="What is this?"
                />
                <p className="mt-0.5 truncate text-xs text-muted-foreground" title={item.file?.name}>
                  {item.file?.name}
                </p>
              </div>
              <span className="flex items-center gap-1">
                {item.file ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Preview ${item.name}`}
                    onClick={() => window.open(URL.createObjectURL(item.file!), "_blank", "noopener")}
                  >
                    <Eye />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => remove(item.id)}
                  className="text-critical"
                >
                  <Trash2 />
                </Button>
              </span>
            </div>
          ))
        )}

        {/* Typed into the name box; a suggestion saves typing without limiting it */}
        <datalist id={`suggest-${title.replace(/\W/g, "")}`}>
          {suggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          add(e.target.files)
          // Reset, so picking the same file twice still fires a change
          e.target.value = ""
        }}
      />
    </section>
  )
}

/** The file name without its extension, as a first guess at what to call it */
const nameFrom = (file: File) => file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 60)

/** Rejects an oversized file with a message, rather than failing quietly at sync */
function within(file: File, limitMb: number) {
  if (file.size <= limitMb * 1024 * 1024) return true
  toast.error(`${file.name} is larger than ${limitMb} MB. Capture it again at a lower resolution.`)
  return false
}
