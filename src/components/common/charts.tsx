import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts"
import { cn } from "cn"

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

/**
 * The two chart shapes the EVITA report screens need.
 *
 * Deliberately lean. OCC has a richer donut with a sweep animation and a
 * counting total, but it carries three hooks EVITA does not have; on a tablet
 * the figures matter more than the movement, so these draw once and sit still.
 */

export type Slice = { key: string; label: string; value: number; color: string }

/** Donut with the total in the middle and a legend showing value and share */
export function DonutChart({
  slices,
  centreLabel,
  size = 150,
  className,
}: {
  slices: Slice[]
  centreLabel: string
  size?: number
  className?: string
}) {
  const total = slices.reduce((sum, s) => sum + s.value, 0)
  const config = Object.fromEntries(
    slices.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ChartContainer config={config} className="size-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={slices}
              dataKey="value"
              nameKey="key"
              innerRadius="62%"
              outerRadius="100%"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl leading-tight font-bold tabular-nums">{total}</span>
          <span className="text-xs leading-tight text-muted-foreground">{centreLabel}</span>
        </div>
      </div>

      <ul className="min-w-44 flex-1 space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="shrink-0 font-semibold tabular-nums">{s.value}</span>
            <span className="w-12 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {total ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One line per series over a shared X axis, as a share of the whole */
export function TrendChart({
  data,
  series,
  xKey,
  height = 190,
}: {
  data: Record<string, string | number>[]
  series: { key: string; label: string; color: string }[]
  xKey: string
  height?: number
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  return (
    <>
      <ChartContainer config={config} className="w-full" style={{ height }}>
        <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-foreground/10" />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} className="text-xs" />
          <YAxis
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            className="text-xs"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: s.color }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>

      {/* The chart's own legend sits inside the plot area and crowds it at this height */}
      <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>
    </>
  )
}
