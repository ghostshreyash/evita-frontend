/**
 * Shared list-screen styling and column sorting, kept apart from the components
 * in components/common/data-table.tsx so both can hot-reload cleanly.
 */

/* Tablet density: OCC's desktop tables use 0.65rem heads and 0.75rem cells, too small at arm's length */
export const th = "h-11 px-3 text-xs font-semibold tracking-wide uppercase"
export const td = "px-3 py-2.5 text-sm"
/** Toolbar controls, tall enough to tap */
export const control = "h-11 text-sm"

export const PAGE_SIZES = [10, 25, 50]

export type Sort<K extends string = string> = { key: K; dir: "asc" | "desc" } | null

/** How to read each sortable column off a row */
export type Accessors<T, K extends string> = Record<K, (row: T) => string | number>

/** Click cycles ascending → descending → back to the default order */
export const nextSort = <K extends string>(current: Sort<K>, key: K): Sort<K> =>
  current?.key !== key ? { key, dir: "asc" } : current.dir === "asc" ? { key, dir: "desc" } : null

export function sortRows<T, K extends string>(rows: T[], sort: Sort<K>, read: Accessors<T, K>) {
  if (!sort) return rows
  const of = read[sort.key]
  const sign = sort.dir === "asc" ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = of(a)
    const vb = of(b)
    const cmp =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), undefined, { numeric: true })
    return cmp * sign
  })
}
