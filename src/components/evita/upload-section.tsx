import { useRef, useState } from "react"
import { Check, Eye, Image as ImageIcon, Thermometer, Trash2, UploadCloud } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { urlFor } from "@/lib/object-url"

/**
 * The upload block from asset onboarding (step 3, Images & Documents), for the
 * inspection's Asset Images and Thermal Images: one wide drop zone until there
 * is something to show, then a tile grid, and every file is named in a dialog
 * the moment it is picked, with tappable suggestions. Same look and behaviour
 * as `src/pages/assets/steps/step-uploads.tsx`, which keeps its pieces private.
 */

export type UploadTile = { id: string; name: string; fileName?: string; src?: string }

const IMAGE_TYPES = "image/png,image/jpeg"
const MAX_IMAGE_MB = 5

export function UploadSection({
  icon: Icon,
  title,
  noun,
  thermal,
  items,
  suggestions,
  onAdd,
  onRemove,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  /** What one upload is called in the dialog, e.g. "photograph" or "thermal image" */
  noun: string
  thermal?: boolean
  items: UploadTile[]
  suggestions: readonly string[]
  onAdd: (named: { name: string; file: File }[]) => void
  onRemove: (id: string) => void
  className?: string
}) {
  const [pending, setPending] = useState<File[] | null>(null)

  const pick = (files: FileList | null) => {
    const accepted = [...(files ?? [])].filter(within)
    if (accepted.length) setPending(accepted)
  }

  const save = (names: string[]) => {
    if (!pending) return
    const named = pending.map((file, i) => ({ name: names[i].trim(), file }))
    onAdd(named)
    setPending(null)
    toast.success(named.length === 1 ? `${named[0].name} added.` : `${named.length} uploads added.`)
  }

  return (
    <section className={cn("rounded-lg ring-1 ring-foreground/10", className)}>
      <h4 className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-t-lg bg-info-soft px-3 py-2">
        <span className="flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
          <Icon className="size-5 text-primary" />
          {title}
          <span className="rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold tabular-nums">{items.length}</span>
        </span>
        <span className="text-xs text-muted-foreground">JPG or PNG · up to {MAX_IMAGE_MB} MB each</span>
      </h4>
      <div className="p-3">
        {/* One wide drop zone until there is something to show; a grid after */}
        <div className={cn(items.length && "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5")}>
          {items.map((item) => (
            <figure key={item.id} className="overflow-hidden rounded-lg ring-1 ring-foreground/10">
              <div className="relative h-28 bg-muted/40">
                <Thumb src={item.src} name={item.name} thermal={thermal} />
                <div className="absolute top-1 right-1 flex gap-1">
                  {item.src ? (
                    <IconAction label={`Preview ${item.name}`} onClick={() => window.open(item.src, "_blank", "noopener")}>
                      <Eye />
                    </IconAction>
                  ) : null}
                  <IconAction label={`Remove ${item.name}`} destructive onClick={() => onRemove(item.id)}>
                    <Trash2 />
                  </IconAction>
                </div>
              </div>
              <figcaption className="px-2 py-1.5">
                <span className="line-clamp-2 text-sm leading-tight font-medium">{item.name}</span>
                {item.fileName ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground" title={item.fileName}>
                    {item.fileName}
                  </span>
                ) : null}
              </figcaption>
            </figure>
          ))}

          <AddSlot
            className={cn(!items.length && "h-28")}
            icon={thermal ? Thermometer : ImageIcon}
            label={items.length ? "Add more" : `Add ${noun}`}
            onPick={pick}
          />
        </div>
      </div>

      <NameUploadsDialog noun={noun} files={pending} suggestions={suggestions} onCancel={() => setPending(null)} onSave={save} />
    </section>
  )
}

/** The picture, or a placeholder for a seeded record with no capture on this tablet */
function Thumb({ src, name, thermal }: { src?: string; name: string; thermal?: boolean }) {
  if (src) return <img src={src} alt={name} className="size-full object-cover" />
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "flex size-full items-center justify-center",
        thermal ? "bg-linear-to-br from-info via-attention to-critical text-white/80" : "bg-linear-to-br from-muted to-info-soft text-muted-foreground"
      )}
    >
      {thermal ? <Thermometer className="size-7" /> : <ImageIcon className="size-7" />}
    </div>
  )
}

/* ---------- Naming ---------- */

/** Asked for as soon as files are picked; nothing is added until every one has a name */
function NameUploadsDialog({
  noun,
  files,
  suggestions,
  onCancel,
  onSave,
}: {
  noun: string
  files: File[] | null
  suggestions: readonly string[]
  onCancel: () => void
  onSave: (names: string[]) => void
}) {
  const [names, setNames] = useState<string[]>([])

  // Re-seed the boxes whenever a different set of files comes in
  const [forFiles, setForFiles] = useState<File[] | null>(null)
  if (files && files !== forFiles) {
    setForFiles(files)
    setNames(files.map(() => ""))
  }

  const ready = files ? names.length === files.length && names.every((n) => n.trim()) : false
  const setName = (i: number, value: string) => setNames(names.map((n, j) => (j === i ? value : n)))

  return (
    <Dialog open={!!files} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-xl!">
        <DialogHeader>
          <DialogTitle>{files?.length === 1 ? `Name this ${noun}` : `Name these ${files?.length} ${noun}s`}</DialogTitle>
          <DialogDescription>
            Say what each one shows. This is the name OCC and the next engineer see against the asset, so make it describe the
            thing rather than the file.
          </DialogDescription>
        </DialogHeader>

        <ul className="-mx-1 max-h-[50vh] space-y-2 overflow-y-auto px-1">
          {files?.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-lg p-2 ring-1 ring-foreground/10">
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
                <img src={urlFor(file)} alt={file.name} className="size-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor={`inspection-upload-name-${i}`} className="text-xs font-medium text-muted-foreground">
                  Name <span className="text-critical">*</span>
                </label>
                <Input
                  id={`inspection-upload-name-${i}`}
                  autoFocus={i === 0}
                  value={names[i] ?? ""}
                  maxLength={60}
                  placeholder={`e.g. ${suggestions[0] ?? "Front View"}`}
                  aria-invalid={!(names[i] ?? "").trim()}
                  onChange={(e) => setName(i, e.target.value)}
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {suggestions.map((s) => (
                    <Chip key={s} selected={names[i] === s} onClick={() => setName(i, s)}>
                      {s}
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
            <Check /> Add {files?.length === 1 ? "" : files?.length}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** A tappable suggestion. Fills the name box; typing anything else is fine. */
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
        selected ? "bg-primary text-primary-foreground ring-primary" : "bg-muted/60 text-muted-foreground ring-foreground/10 hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

/* ---------- Pieces ---------- */

/** The dashed zone that takes a click or a drop */
function AddSlot({
  icon: Icon,
  label,
  onPick,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onPick: (files: FileList | null) => void
  className?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
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
      <span className={cn("flex size-9 items-center justify-center rounded-full bg-background", over ? "text-primary" : "text-muted-foreground")}>
        {over ? <UploadCloud className="size-5" /> : <Icon className="size-5" />}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">or drag here</span>
      <input
        ref={input}
        type="file"
        multiple
        accept={IMAGE_TYPES}
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files)
          // Reset, so picking the same file twice still fires a change
          e.target.value = ""
        }}
      />
    </button>
  )
}

/** Small round button sitting over a thumbnail */
function IconAction({ label, destructive, onClick, children }: { label: string; destructive?: boolean; onClick: () => void; children: React.ReactNode }) {
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

/** Rejects an oversized file with a message, rather than failing quietly at sync */
function within(file: File) {
  if (file.size <= MAX_IMAGE_MB * 1024 * 1024) return true
  toast.error(`${file.name} is larger than ${MAX_IMAGE_MB} MB. Capture it again at a lower resolution.`)
  return false
}
