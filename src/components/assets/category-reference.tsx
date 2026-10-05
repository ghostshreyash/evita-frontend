import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "cn"

import { CategoryIcon } from "@/components/common/category-icon"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { assetCategories, commonAssetCategories } from "@/data/master-data"
import { categoryLook, shortCategory } from "@/lib/category-icons"

/**
 * The quick-pick grid beside step 1 of asset onboarding.
 *
 * The grid offers the kit a plant actually holds. The full master list is not
 * hidden behind a scroll: "Other" opens a dialog carrying every category from
 * the parameter sheet, so an unusual asset is still registered under its proper
 * name rather than as "Other".
 */

export function CategoryReference({
  value,
  onSelect,
  className,
}: {
  /** The category currently chosen on the form, highlighted in the grid */
  value?: string
  onSelect: (category: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  // "Other" on the grid means "show me everything", so it opens the dialog
  const choose = (category: string) => (category === "Other" ? setOpen(true) : onSelect(category))

  return (
    <div className={cn("rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10", className)}>
      <h3 className="mb-2 text-base font-semibold text-brand-navy dark:text-foreground">Asset Category Reference</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-4">
        {commonAssetCategories.map((category) => (
          <CategoryTile
            key={category}
            category={category}
            selected={value === category || (category === "Other" && !!value && !commonAssetCategories.includes(value as never))}
            onClick={() => choose(category)}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Tap a category to fill it in. <strong className="font-semibold">Other</strong> lists all{" "}
        <span className="tabular-nums">{assetCategories.length}</span> categories from the platform parameter sheet.
      </p>

      <AllCategoriesDialog
        open={open}
        onOpenChange={setOpen}
        value={value}
        onSelect={(category) => {
          onSelect(category)
          setOpen(false)
        }}
      />
    </div>
  )
}

function CategoryTile({
  category,
  selected,
  onClick,
}: {
  category: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={category}
      className={cn(
        "flex min-h-24 flex-col items-center justify-start gap-1.5 rounded-lg px-1.5 py-2.5 text-center ring-1 transition-colors",
        selected ? "bg-info-soft ring-2 ring-primary" : "bg-card ring-foreground/10 hover:bg-muted active:bg-muted"
      )}
    >
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", categoryLook(category).tint)}>
        <CategoryIcon category={category} className="size-6" />
      </span>
      {/* w-full gives the label a box to wrap inside; without it the flex child
          sizes to its longest word and overflows the tile */}
      <span className="line-clamp-2 w-full text-xs leading-tight font-medium break-words hyphens-auto">
        {shortCategory(category)}
      </span>
    </button>
  )
}

/** Every category from the parameter sheet, searchable */
function AllCategoriesDialog({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  onSelect: (category: string) => void
}) {
  const [query, setQuery] = useState("")
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? assetCategories.filter((c) => c.toLowerCase().includes(q)) : assetCategories
  }, [query])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("")
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-2xl!">
        <DialogHeader>
          <DialogTitle>All asset categories</DialogTitle>
          <DialogDescription>
            Every category the platform recognises. Pick the closest match — only use Other when none of them applies.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            aria-label="Search asset categories"
            className="pl-9"
          />
        </div>

        {/*
          The same tiles as the quick-pick grid, two to a row so the long names -
          "Instrument Transformer (CT/PT)", "Lighting Distribution Board (LDB)" -
          are written out in full rather than clipped as they are on the grid.
        */}
        <ul className="-mx-1 grid max-h-[55vh] gap-1.5 overflow-y-auto px-1 sm:grid-cols-2">
          {matches.map((category) => (
            <li key={category}>
              <button
                type="button"
                onClick={() => onSelect(category)}
                aria-pressed={value === category}
                className={cn(
                  "flex min-h-16 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm ring-1 transition-colors",
                  value === category
                    ? "bg-info-soft font-semibold text-primary ring-2 ring-primary"
                    : "bg-card ring-foreground/10 hover:bg-muted active:bg-muted"
                )}
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", categoryLook(category).tint)}>
                  <CategoryIcon category={category} className="size-6" />
                </span>
                <span className="min-w-0 flex-1 leading-tight">{category}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground sm:col-span-2">
              No category matches “{query}”.
            </li>
          ) : null}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
