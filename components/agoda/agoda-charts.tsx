"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { FilterTabs } from "@/components/common/FilterTabs"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatCompact,
  formatInt,
  formatMonth,
  formatPct,
  formatPeriodLabel,
  formatPeriodTick,
  formatUsd,
  formatUsdAxis,
} from "@/lib/agoda-format"
import type { AgodaInterval, AgodaMetrics, AgodaReport } from "@/lib/api/agoda"
import { cn } from "@/lib/utils"

/**
 * Colours come from the validated data-viz tokens in globals.css. Series keep the same colour
 * everywhere on the page: blue = departed / finalized, orange = upcoming / pending estimate,
 * grey = cancelled.
 */
const VIZ = {
  one: "var(--viz-1)",
  two: "var(--viz-2)",
  muted: "var(--viz-muted)",
  grid: "var(--viz-grid)",
  axis: "var(--viz-axis)",
  surface: "var(--card)",
}

type Series = {
  key: string
  label: string
  color: string
  format: (value: number) => string
}

const AXIS_TICK = { fill: VIZ.axis, fontSize: 11 }

/** A legend entry: a coloured swatch beside text in text colours (never in the series colour). */
export function LegendSwatch({
  color,
  label,
}: {
  color: string
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className="size-2.5 rounded-[3px]"
        style={{ background: color }}
        aria-hidden
      />
      {label}
    </span>
  )
}

function SeriesTooltip({
  active,
  payload,
  label,
  series,
  heading,
  footer,
}: {
  active?: boolean
  payload?: readonly { payload?: unknown }[]
  label?: string | number
  series: Series[]
  heading: (label: string) => string
  footer?: (row: Record<string, number>) => string | null
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload as Record<string, number>
  const note = footer?.(row)
  return (
    <div className="min-w-44 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">
        {heading(String(label))}
      </p>
      <div className="space-y-1">
        {[...series].reverse().map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <LegendSwatch color={s.color} label={s.label} />
            <span className="font-medium text-foreground tabular-nums">
              {s.format(row[s.key] ?? 0)}
            </span>
          </div>
        ))}
      </div>
      {note ? (
        <p className="mt-1.5 border-t border-border pt-1.5 text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  )
}

/** Stacked columns over a category axis; the top segment carries the 4px rounded end. */
function StackedColumns({
  data,
  xKey,
  series,
  tickFormatter,
  heading,
  footer,
  valueAxis,
  height = 280,
}: {
  data: Record<string, number | string>[]
  xKey: string
  series: Series[]
  tickFormatter: (value: string) => string
  heading: (label: string) => string
  footer?: (row: Record<string, number>) => string | null
  valueAxis: (value: number) => string
  height?: number
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid vertical={false} stroke={VIZ.grid} />
          <XAxis
            dataKey={xKey}
            tickFormatter={tickFormatter}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: VIZ.grid }}
            minTickGap={16}
          />
          <YAxis
            tickFormatter={valueAxis}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={56}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
            content={(props) => (
              <SeriesTooltip
                active={props.active}
                payload={props.payload}
                label={props.label}
                series={series}
                heading={heading}
                footer={footer}
              />
            )}
          />
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              stackId="a"
              fill={s.color}
              maxBarSize={24}
              // The surface-coloured stroke is the 2px gap between segments and between bars.
              stroke={VIZ.surface}
              strokeWidth={1}
              radius={index === series.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type TrendMetric = "bookings" | "value" | "commission"

const TREND_TABS: { value: TrendMetric; label: string }[] = [
  { value: "bookings", label: "Bookings" },
  { value: "value", label: "Booking value" },
  { value: "commission", label: "Commission" },
]

const upcoming = (m: AgodaMetrics) => m.bookings - m.cancelled - m.departed

/** Bookings, value or commission per day / week / month, one measure at a time (one axis). */
export function AgodaTrendChart({ report }: { report: AgodaReport }) {
  const [metric, setMetric] = useState<TrendMetric>("bookings")
  const interval: AgodaInterval = report.interval

  const data = report.series.map((row) => ({
    period: row.period,
    departed: row.departed,
    upcoming: upcoming(row),
    cancelled: row.cancelled,
    bookings: row.bookings,
    value: row.booking_value_usd,
    finalized: row.finalized_commission_usd,
    pending: row.pending_commission_usd,
    cancellation_rate: row.cancellation_rate,
  }))

  const series: Record<TrendMetric, Series[]> = {
    bookings: [
      { key: "departed", label: "Departed", color: VIZ.one, format: formatInt },
      {
        key: "upcoming",
        label: "Upcoming stay",
        color: VIZ.two,
        format: formatInt,
      },
      {
        key: "cancelled",
        label: "Cancelled",
        color: VIZ.muted,
        format: formatInt,
      },
    ],
    value: [
      {
        key: "value",
        label: "Booking value",
        color: VIZ.one,
        format: formatUsd,
      },
    ],
    commission: [
      {
        key: "finalized",
        label: "Finalized",
        color: VIZ.one,
        format: formatUsd,
      },
      {
        key: "pending",
        label: "Pending estimate",
        color: VIZ.two,
        format: formatUsd,
      },
    ],
  }
  const shown = series[metric]
  const unit =
    interval === "day" ? "day" : interval === "week" ? "week" : "month"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance over time</CardTitle>
        <CardDescription>
          {metric === "bookings"
            ? `Bookings received per ${unit}, by where they stand now.`
            : metric === "value"
              ? `Booking value before tax per ${unit}, in USD.`
              : `Commission per ${unit}: finalized by Agoda, and Agoda's estimate for live bookings.`}
        </CardDescription>
        <CardAction>
          <FilterTabs
            tabs={TREND_TABS}
            value={metric}
            onChange={setMetric}
            label="Measure"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {shown.length > 1 ? (
          <div className="flex flex-wrap gap-4">
            {shown.map((s) => (
              <LegendSwatch key={s.key} color={s.color} label={s.label} />
            ))}
          </div>
        ) : null}
        <StackedColumns
          data={data}
          xKey="period"
          series={shown}
          tickFormatter={(value) => formatPeriodTick(value, interval)}
          heading={(label) => formatPeriodLabel(label, interval)}
          valueAxis={metric === "bookings" ? formatCompact : formatUsdAxis}
          footer={
            metric === "bookings"
              ? (row) =>
                  row.bookings
                    ? `${formatInt(row.bookings)} received · ${formatPct(row.cancellation_rate)} cancelled`
                    : null
              : undefined
          }
        />
      </CardContent>
    </Card>
  )
}

/** When the commission from these bookings is paid: Agoda's payment month. */
export function AgodaPipelineChart({ report }: { report: AgodaReport }) {
  const byMonth = new Map(
    report.by_payment_month
      .filter((row) => row.month)
      .map((row) => [row.month as string, row])
  )
  const data = everyMonth([...byMonth.keys()]).map((month) => ({
    month,
    finalized: byMonth.get(month)?.finalized_commission_usd ?? 0,
    pending: byMonth.get(month)?.pending_commission_usd ?? 0,
    bookings: byMonth.get(month)?.bookings ?? 0,
  }))
  const series: Series[] = [
    { key: "finalized", label: "Finalized", color: VIZ.one, format: formatUsd },
    {
      key: "pending",
      label: "Pending estimate",
      color: VIZ.two,
      format: formatUsd,
    },
  ]
  const pending = data.reduce((total, row) => total + row.pending, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission by payment month</CardTitle>
        <CardDescription>
          When Agoda pays the commission on these bookings. Only departed
          bookings are paid; {formatUsd(pending)} is still an estimate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {series.map((s) => (
                <LegendSwatch key={s.key} color={s.color} label={s.label} />
              ))}
            </div>
            <StackedColumns
              data={data}
              xKey="month"
              series={series}
              tickFormatter={(value) => formatPeriodTick(value, "month")}
              heading={(label) => `Paid in ${formatMonth(label)}`}
              valueAxis={formatUsdAxis}
              footer={(row) => `${formatInt(row.bookings)} bookings`}
              height={240}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

/** Every month from the first to the last given ("YYYY-MM-01"), so gaps show as empty months. */
function everyMonth(months: string[]): string[] {
  if (months.length === 0) return []
  const sorted = [...months].sort()
  const out: string[] = []
  let [year, month] = sorted[0].split("-").map(Number)
  const last = sorted[sorted.length - 1]
  for (let guard = 0; guard < 240; guard += 1) {
    const key = `${year}-${String(month).padStart(2, "0")}-01`
    out.push(key)
    if (key >= last) break
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  return out
}

export function EmptyChart({
  message = "No bookings in this range.",
}: {
  message?: string
}) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export type Segment = {
  key: string
  label: string
  value: number
  color: string
  detail?: string
}

/** One whole split into parts (status mix, App vs Website…), with a legend that carries the numbers. */
export function SegmentedBar({
  segments,
  unit = "bookings",
}: {
  segments: Segment[]
  unit?: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const visible = segments.filter((s) => s.value > 0)
  if (total === 0) return <EmptyChart />
  return (
    <div className="space-y-3">
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={visible
          .map((s) => `${s.label} ${formatPct(s.value / total)}`)
          .join(", ")}
      >
        {visible.map((s) => (
          <div
            key={s.key}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              flexGrow: s.value,
              flexBasis: 0,
              minWidth: 3,
              background: s.color,
            }}
            title={`${s.label}: ${formatInt(s.value)} ${unit} (${formatPct(s.value / total)})`}
          />
        ))}
      </div>
      <ul className="space-y-1.5">
        {segments.map((s) => (
          <li key={s.key} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ background: s.color }}
                  aria-hidden
                />
                <span className="text-foreground">{s.label}</span>
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                <span className="font-medium text-foreground">
                  {formatInt(s.value)}
                </span>{" "}
                · {formatPct(total ? s.value / total : 0)}
              </span>
            </div>
            {s.detail ? (
              <p className="pl-[18px] text-xs text-muted-foreground">
                {s.detail}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}

export type BreakdownRow = {
  key: string
  label: string
  sublabel?: string | null
  metrics: AgodaMetrics
}

type BreakdownMeasure = "bookings" | "value" | "commission"

const MEASURES: { value: BreakdownMeasure; label: string }[] = [
  { value: "bookings", label: "Bookings" },
  { value: "value", label: "Value" },
  { value: "commission", label: "Commission" },
]

const measureOf = (m: AgodaMetrics, measure: BreakdownMeasure) =>
  measure === "bookings"
    ? m.bookings
    : measure === "value"
      ? m.booking_value_usd
      : m.finalized_commission_usd + m.pending_commission_usd

/**
 * A ranked bar list that is also a table: the bar shows the measure against the top row, the
 * numbers sit beside it, and hovering a row shows everything else about it.
 */
export function BreakdownCard({
  title,
  description,
  rows,
  limit = 8,
}: {
  title: string
  description: string
  rows: BreakdownRow[]
  limit?: number
}) {
  const [measure, setMeasure] = useState<BreakdownMeasure>("bookings")
  const [expanded, setExpanded] = useState(false)
  const sorted = [...rows].sort(
    (a, b) => measureOf(b.metrics, measure) - measureOf(a.metrics, measure)
  )
  const shown = expanded ? sorted : sorted.slice(0, limit)
  const max = Math.max(...sorted.map((r) => measureOf(r.metrics, measure)), 0)
  const total = sorted.reduce(
    (sum, r) => sum + measureOf(r.metrics, measure),
    0
  )
  const show = (value: number) =>
    measure === "bookings" ? formatInt(value) : formatUsd(value)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <FilterTabs
          tabs={MEASURES}
          value={measure}
          onChange={setMeasure}
          label={`${title} measure`}
          className="mb-3 -ml-1"
        />
        {sorted.length === 0 ? (
          <EmptyChart />
        ) : (
          <ul className="space-y-1">
            {shown.map((row) => {
              const value = measureOf(row.metrics, measure)
              const m = row.metrics
              return (
                <li
                  key={row.key}
                  className="group rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60"
                  title={[
                    `${row.label}${row.sublabel ? `, ${row.sublabel}` : ""}`,
                    `${formatInt(m.bookings)} bookings (${formatPct(m.cancellation_rate)} cancelled)`,
                    `Value ${formatUsd(m.booking_value_usd)} · avg ${formatUsd(m.avg_booking_value_usd)}`,
                    `Commission ${formatUsd(m.finalized_commission_usd)} finalized + ${formatUsd(m.pending_commission_usd)} pending`,
                  ].join("\n")}
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-foreground">
                      {row.label}
                      {row.sublabel ? (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {row.sublabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-medium text-foreground">
                        {show(value)}
                      </span>
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {total ? formatPct(value / total) : "—"}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${max ? Math.max((value / max) * 100, value > 0 ? 1 : 0) : 0}%`,
                        background: VIZ.one,
                      }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {sorted.length > limit ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className={cn(
              "mt-2 px-2 text-xs font-medium text-primary hover:underline"
            )}
          >
            {expanded ? "Show fewer" : `Show all ${sorted.length}`}
          </button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export const AGODA_VIZ = VIZ
