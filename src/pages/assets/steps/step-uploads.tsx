import { useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Camera, Check, Eye, FilePlus2, FileText, Images, ImagePlus, Paperclip, Trash2, UploadCloud } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { StepCard } from "@/components/common/wizard"
import { AssetPhoto } from "@/components/common/asset-photo"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { parametersFor, unitFor } from "@/data/asset-parameters"
import { suggestedDocumentNames, suggestedImageNames } from "@/data/master-data"
import { urlFor } from "@/lib/object-url"
import { type AssetFormValues, type AssetUpload } from "@/pages/assets/schemas"

const IMAGE_TYPES = "image/png,image/jpeg"
const DOCUMENT_TYPES = "application/pdf,image/png,image/jpeg"
const MAX_IMAGE_MB = 5
const MAX_DOCUMENT_MB = 10

/** Files picked but not yet named; the dialog below collects the names */
type Pending = { kind: "image" | "document"; files: File[] }

/**
 * Step 3 of 4: the photographs and paperwork that back the ratings.
 *
 * At least one photograph, and no fixed slots beyond that. The onboarding
 * sheet asks every type for an Asset Photograph, so one is mandatory; what it
 * shows is the engineer's to decide, because the client confirmed on 07-10-2026
 * that what is available varies from asset to asset and site to site. The old
 * fixed labels survive as suggestions.
 *
 * Naming is asked for at the moment of upload rather than left to be filled in
 * afterwards: a name typed while the engineer is still standing at the asset is
 * the one that describes it, and nothing can reach the register unnamed.
 *
 * A photograph comes from the tablet's camera or from a file already on it, so
 * tapping to add one asks which - see `AddSlot`.
 */
export function StepUploads({ form }: { form: UseFormReturn<AssetFormValues> }) {
  const values = form.watch()
  const images = values.images ?? []
  const documents = values.documents ?? []

  const [pending, setPending] = useState<Pending | null>(null)

  const setImages = (next: AssetUpload[]) => form.setValue("images", next, { shouldDirty: true, shouldValidate: true })
  const setDocuments = (next: AssetUpload[]) =>
    form.setValue("documents", next, { shouldDirty: true, shouldValidate: true })

  /** Hold the picked files until every one has been given a name */
  const pick = (kind: Pending["kind"], files: FileList | null, limitMb: number) => {
    const accepted = [...(files ?? [])].filter((file) => within(file, limitMb))
    if (accepted.length) setPending({ kind, files: accepted })
  }

  const save = (names: string[]) => {
    if (!pending) return
    const made = pending.files.map((file, i) => ({ id: `${Date.now()}-${i}-${file.size}`, name: names[i].trim(), file }))
    if (pending.kind === "image") setImages([...images, ...made])
    else setDocuments([...documents, ...made])
    setPending(null)
    toast.success(made.length === 1 ? `${made[0].name} added.` : `${made.length} uploads added.`)
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <StepCard
        title="Step 3 of 4: Images & Documents"
        description="Add what this asset actually has. You will be asked to name each upload as you add it."
      >
        {/* ---------- Photographs ---------- */}
        <Section
          icon={Camera}
          title="Asset Images"
          count={images.length}
          hint={`JPG or PNG · up to ${MAX_IMAGE_MB} MB each`}
        >
          {/* One wide drop zone until there is something to show; a grid after */}
          <div className={cn(images.length && "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
            {images.map((item) => (
              <Thumb key={item.id} item={item} onRemove={() => setImages(images.filter((i) => i.id !== item.id))} />
            ))}

            <AddSlot
              photo
              className={cn(!images.length && "h-28", !images.length && "border-critical/40 bg-critical-soft/20 hover:border-critical")}
              icon={ImagePlus}
              label={images.length ? "Add more" : "Add photograph"}
              accept={IMAGE_TYPES}
              onPick={(files) => pick("image", files, MAX_IMAGE_MB)}
            />
          </div>
          {images.length ? null : (
            <p className="mt-2 text-sm text-critical">At least one photograph of the asset is required.</p>
          )}
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
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  <span className="block truncate text-xs text-muted-foreground" title={item.file.name}>
                    {item.file.name} · {size(item.file)}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <IconAction label={`Preview ${item.name}`} onClick={() => preview(item)}>
                    <Eye />
                  </IconAction>
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

          <AddSlot
            className={cn("h-20", documents.length && "mt-2")}
            icon={FilePlus2}
            label={documents.length ? "Add more" : "Add document"}
            accept={DOCUMENT_TYPES}
            onPick={(files) => pick("document", files, MAX_DOCUMENT_MB)}
          />
        </Section>
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
              /* Which ratings an asset carries depends on its type, so the
                 preview lists whatever step 2 asked for */
              ...parametersFor(values.category).map((spec) => ({
                label: spec.label,
                value: values.parameters?.[spec.key]
                  ? [values.parameters[spec.key], unitFor(spec, values.parameters)].filter(Boolean).join(" ")
                  : "",
              })),
            ]}
          />
        </DetailPanel>
      </div>

      <NameUploadsDialog pending={pending} onCancel={() => setPending(null)} onSave={save} />
    </div>
  )
}

/* ---------- Naming ---------- */

/**
 * Asked for as soon as files are picked. Nothing is added until every one has a
 * name, so an upload can never reach the register called "IMG_8841".
 */
function NameUploadsDialog({
  pending,
  onCancel,
  onSave,
}: {
  pending: Pending | null
  onCancel: () => void
  onSave: (names: string[]) => void
}) {
  const [names, setNames] = useState<string[]>([])

  // Re-seed the boxes whenever a different set of files comes in
  const [forFiles, setForFiles] = useState<File[] | null>(null)
  if (pending && pending.files !== forFiles) {
    setForFiles(pending.files)
    setNames(pending.files.map(() => ""))
  }

  const isImage = pending?.kind === "image"
  const ready = pending ? names.length === pending.files.length && names.every((n) => n.trim()) : false

  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-xl!">
        <DialogHeader>
          <DialogTitle>
            {pending?.files.length === 1
              ? `Name this ${isImage ? "photograph" : "document"}`
              : `Name these ${pending?.files.length} ${isImage ? "photographs" : "documents"}`}
          </DialogTitle>
          <DialogDescription>
            Say what each one shows. This is the name the next engineer sees against the asset, so make it describe the
            thing rather than the file.
          </DialogDescription>
        </DialogHeader>

        <ul className="-mx-1 max-h-[50vh] space-y-2 overflow-y-auto px-1">
          {pending?.files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-lg p-2 ring-1 ring-foreground/10">
              {isImage ? (
                <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
                  <AssetPhoto file={file} label={file.name} />
                </div>
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-info-soft text-primary">
                  <Paperclip className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <label htmlFor={`upload-name-${i}`} className="text-xs font-medium text-muted-foreground">
                  Name <span className="text-critical">*</span>
                </label>
                <Input
                  id={`upload-name-${i}`}
                  autoFocus={i === 0}
                  value={names[i] ?? ""}
                  maxLength={60}
                  placeholder={isImage ? "e.g. Front View" : "e.g. Manufacturer Datasheet"}
                  aria-invalid={!(names[i] ?? "").trim()}
                  onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(isImage ? suggestedImageNames : suggestedDocumentNames).map((suggestion) => (
                    <Chip
                      key={suggestion}
                      selected={names[i] === suggestion}
                      onClick={() => setNames(names.map((n, j) => (j === i ? suggestion : n)))}
                    >
                      {suggestion}
                    </Chip>
                  ))}
                </div>
                <span className="mt-1 block truncate text-xs text-muted-foreground" title={file.name}>
                  {file.name} · {size(file)}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={!ready} onClick={() => onSave(names)}>
            <Check /> Add {pending?.files.length === 1 ? "" : pending?.files.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** A tappable suggestion. Fills the name box; typing anything else is fine. */
function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
        selected
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-muted/60 text-muted-foreground ring-foreground/10 hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

/* ---------- Pieces ---------- */

/** One uploaded photograph, with preview and remove over the image */
function Thumb({ item, onRemove, className }: { item: AssetUpload; onRemove: () => void; className?: string }) {
  return (
    <figure className={cn("overflow-hidden rounded-lg ring-1 ring-foreground/10", className)}>
      <div className="relative h-28 bg-muted/40">
        <AssetPhoto file={item.file} label={item.name} />
        <div className="absolute top-1 right-1 flex gap-1">
          <IconAction label={`Preview ${item.name}`} onClick={() => preview(item)}>
            <Eye />
          </IconAction>
          <IconAction label={`Remove ${item.name}`} destructive onClick={onRemove}>
            <Trash2 />
          </IconAction>
        </div>
      </div>
      <figcaption className="px-2 py-1.5">
        <span className="line-clamp-2 text-sm leading-tight font-medium">{item.name}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={item.file.name}>
          {item.file.name}
        </span>
      </figcaption>
    </figure>
  )
}

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

/**
 * The dashed zone that takes a click or a drop.
 *
 * `photo` makes the click ask where the picture comes from: the tablet's camera,
 * which opens straight into capture, or a file already on the device. A drop
 * skips the question - the file is already chosen.
 */
function AddSlot({
  icon: Icon,
  label,
  accept,
  onPick,
  className,
  photo,
  single,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  accept: string
  onPick: (files: FileList | null) => void
  className?: string
  /** Offer the camera as well as the file picker */
  photo?: boolean
  /** One file at a time, for a slot that holds exactly one */
  single?: boolean
}) {
  const file = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [asking, setAsking] = useState(false)

  const take = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPick(e.target.files)
    // Reset, so picking the same file twice still fires a change
    e.target.value = ""
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (photo ? setAsking(true) : file.current?.click())}
        aria-label={label}
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          onPick(e.dataTransfer.files)
        }}
        className={cn(
          "flex min-h-28 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-2 text-center transition-colors",
          over ? "border-primary bg-info-soft" : "border-input bg-muted/30 hover:border-primary hover:bg-accent",
          className
        )}
      >
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-full bg-background",
            over ? "text-primary" : "text-muted-foreground"
          )}
        >
          {over ? <UploadCloud className="size-5" /> : <Icon className="size-5" />}
        </span>
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">or drag here</span>
      </button>

      <input ref={file} type="file" multiple={!single} accept={accept} className="sr-only" onChange={take} />
      {photo ? (
        <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" onChange={take} />
      ) : null}

      {photo ? (
        <Dialog open={asking} onOpenChange={setAsking}>
          <DialogContent className="sm:max-w-sm!">
            <DialogHeader>
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription>Photograph it now, or pick a picture already on this tablet.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <SourceButton
                icon={Camera}
                label="Camera"
                hint="Take it now"
                onClick={() => {
                  setAsking(false)
                  camera.current?.click()
                }}
              />
              <SourceButton
                icon={Images}
                label="Gallery"
                hint="Pick a file"
                onClick={() => {
                  setAsking(false)
                  file.current?.click()
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  )
}

/** One of the two ways a photograph gets in, sized for a thumb on a tablet */
function SourceButton({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl ring-1 ring-foreground/15 transition-colors hover:bg-accent"
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-info-soft text-primary">
        <Icon className="size-6" />
      </span>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
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

/* ---------- Helpers ---------- */

const size = (file: File) => `${(file.size / 1024 / 1024).toFixed(1)} MB`

/** Reuses the tile's own URL rather than minting a fresh one on every click */
const preview = (item: AssetUpload) => window.open(urlFor(item.file), "_blank", "noopener")

/** Rejects an oversized file with a message, rather than failing quietly at sync */
function within(file: File, limitMb: number) {
  if (file.size <= limitMb * 1024 * 1024) return true
  toast.error(`${file.name} is larger than ${limitMb} MB. Capture it again at a lower resolution.`)
  return false
}
