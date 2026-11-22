"use client"

import { MetricCard } from "@/components/common/MetricCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  describeChange,
  describePointChange,
  formatInt,
  formatPct,
  formatRange,
  formatUsd,
  formatUsdHeadline,
} from "@/lib/agoda-format"
import type { AgodaMetrics, AgodaReport } from "@/lib/api/agoda"

/** The six headline figures, each compared with the same length of time just before. */
export function AgodaKpiTiles({ report }: { report: AgodaReport }) {
  const now = report.summary
  const before = report.previous.summary
  const previousLabel = formatRange(
    report.previous.start_date,
    report.previous.end_date
  )
  const change = (current: number, previous: number, upIsGood = true) =>
    describeChange(current, previous, previousLabel, upIsGood)

  const tiles = [
    {
      label: "Bookings received",
      value: formatInt(now.bookings),
      sublabel: `${formatInt(now.active)} active · ${formatInt(now.departed)} departed`,
      ...change(now.bookings, before.bookings),
    },
    {
      label: "Booking value",
      value: formatUsdHeadline(now.booking_value_usd),
      sublabel: "Before tax, all bookings",
      ...change(now.booking_value_usd, before.booking_value_usd),
    },
    {
      label: "Commission finalized",
      value: formatUsdHeadline(now.finalized_commission_usd),
      sublabel: "Agoda's “Affiliate Commission”",
      ...change(now.finalized_commission_usd, before.finalized_commission_usd),
    },
    {
      label: "Pending commission",
      value: formatUsdHeadline(now.pending_commission_usd),
      sublabel: "Agoda's estimate, not final yet",
      ...change(now.pending_commission_usd, before.pending_commission_usd),
    },
    {
      label: "Avg booking value",
      value: formatUsd(now.avg_booking_value_usd),
      sublabel: "Per booking not cancelled",
      ...change(now.avg_booking_value_usd, before.avg_booking_value_usd),
    },
    {
      label: "Cancellation rate",
      value: formatPct(now.cancellation_rate),
      sublabel: `${formatInt(now.cancelled)} cancelled`,
      ...describePointChange(
        now.cancellation_rate,
        before.cancellation_rate,
        before.bookings > 0,
        previousLabel,
        false
      ),
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {tiles.map((tile) => (
        <MetricCard
          key={tile.label}
          label={tile.label}
          value={tile.value}
          sublabel={tile.sublabel}
          trend={tile.text}
          trendVariant={tile.variant}
        />
      ))}
    </div>
  )
}

function MetricCells({ m }: { m: AgodaMetrics }) {
  return (
    <>
      <TableCell className="text-right tabular-nums">
        {formatInt(m.bookings)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatPct(m.cancellation_rate)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatUsd(m.booking_value_usd)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatUsd(m.avg_booking_value_usd)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatUsd(m.finalized_commission_usd)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatUsd(m.pending_commission_usd)}
      </TableCell>
    </>
  )
}

const METRIC_HEADS = [
  "Bookings",
  "Cancelled",
  "Value",
  "Avg value",
  "Finalized",
  "Pending",
]

/** Every Agoda site (Approval Site, RMG, Detik…) side by side. */
export function AgodaSitesTable({ report }: { report: AgodaReport }) {
  const total = report.summary
  return (
    <Card>
      <CardHeader>
        <CardTitle>By site</CardTitle>
        <CardDescription>
          Each Agoda site ID on the TMOE partner account. Share is of bookings
          received.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead className="w-40">Share</TableHead>
              {METRIC_HEADS.map((head) => (
                <TableHead key={head} className="text-right">
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.by_site.map((site) => {
              const share = total.bookings ? site.bookings / total.bookings : 0
              return (
                <TableRow key={site.site_id}>
                  <TableCell>
                    <p className="font-medium text-foreground">
                      {site.site_name}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      ID {site.site_id}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(share * 100, share > 0 ? 2 : 0)}%`,
                            background: "var(--viz-1)",
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatPct(share)}
                      </span>
                    </div>
                  </TableCell>
                  <MetricCells m={site} />
                </TableRow>
              )
            })}
          </TableBody>
          {report.by_site.length > 1 ? (
            <TableFooter>
              <TableRow>
                <TableCell className="font-medium">All sites</TableCell>
                <TableCell />
                <MetricCells m={total} />
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </CardContent>
    </Card>
  )
}

/** The ten properties with the most bookings in the range. */
export function AgodaTopProperties({ report }: { report: AgodaReport }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top properties</CardTitle>
        <CardDescription>
          The ten hotels booked most often in this range.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              {METRIC_HEADS.map((head) => (
                <TableHead key={head} className="text-right">
                  {head}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.top_properties.map((property) => (
              <TableRow key={property.name}>
                <TableCell className="max-w-72">
                  <p
                    className="truncate font-medium text-foreground"
                    title={property.name}
                  >
                    {property.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {property.city ?? "—"}
                  </p>
                </TableCell>
                <MetricCells m={property} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
