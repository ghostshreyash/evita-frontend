import { cn } from "cn"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { control } from "@/lib/data-table"

/**
 * The count tile and the dropdown filter the list screens share, in the look
 * the Assets register set (`src/pages/assets/assets.tsx`): a plain card with
 * the count in a tinted square, and filters that read "Status: All".
 */

/** Sentinel for a filter that is not narrowing anything; Select has no empty value */
export const ANY = "all"

export function CountTile({
  label,
  value,
  note,
  tone,
  active,
  onClick,
}: {
  label: string
  value: number
  note?: string
  tone: string
  /** Highlights the tile whose filter is applied */
  active?: boolean
  onClick?: () => void
}) {
  const Box = onClick ? "button" : "div"
  return (
    <Box
      {...(onClick ? { type: "button" as const, onClick, "aria-pressed": active } : {})}
      className={cn(
        "rounded-lg bg-card px-3 py-2.5 text-left ring-1 ring-foreground/10 transition-shadow",
        onClick && "hover:shadow-md",
        active && "ring-2 ring-primary"
      )}
    >
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums", tone)}>{value}</span>
        {note ? <span className="text-xs leading-tight text-muted-foreground">{note}</span> : null}
      </div>
    </Box>
  )
}

/** One dropdown filter, with a "Label: All" option that clears it */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  /** Plain strings, or value/label pairs where the two differ */
  options: readonly string[] | readonly { value: string; label: string }[]
}) {
  const items = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn(control, "w-auto min-w-36 bg-card")}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>{label}: All</SelectItem>
        {items.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
