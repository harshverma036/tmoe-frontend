"use client"

import {
  AGODA_VIZ,
  AgodaPipelineChart,
  AgodaTrendChart,
  BreakdownCard,
  SegmentedBar,
  type Segment,
} from "@/components/agoda/agoda-charts"
import { AgodaBookingsTable } from "@/components/agoda/agoda-bookings-table"
import {
  AgodaKpiTiles,
  AgodaSitesTable,
  AgodaTopProperties,
} from "@/components/agoda/agoda-summary"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  countryName,
  DATE_BASIS_LABEL,
  formatInt,
  formatRange,
} from "@/lib/agoda-format"
import type {
  AgodaBooking,
  AgodaBookingsParams,
  AgodaDateBasis,
  AgodaReport,
  Paged,
} from "@/lib/api/agoda"

export const AGODA_BASIS_TABS: { value: AgodaDateBasis; label: string }[] = [
  { value: "booking", label: DATE_BASIS_LABEL.booking },
  { value: "checkout", label: DATE_BASIS_LABEL.checkout },
  { value: "payment", label: DATE_BASIS_LABEL.payment },
]

export const AGODA_BASIS_HELP: Record<AgodaDateBasis, string> = {
  booking: "Bookings made in this range.",
  checkout:
    "Stays that end (check out) in this range — Agoda's “Departure Date”.",
  payment: "Bookings whose commission Agoda pays in these months.",
}

function statusSegments(report: AgodaReport): Segment[] {
  const sum = (groups: string[]) =>
    report.by_status
      .filter((s) => groups.includes(s.group))
      .reduce((t, s) => t + s.bookings, 0)
  const names = (groups: string[]) =>
    report.by_status
      .filter((s) => groups.includes(s.group))
      .map((s) => `${s.status} ${formatInt(s.bookings)}`)
      .join(" · ")
  return [
    {
      key: "departed",
      label: "Departed",
      value: sum(["departed"]),
      color: AGODA_VIZ.one,
    },
    {
      key: "upcoming",
      label: "Upcoming stay",
      value: sum(["charged", "confirmed", "pending", "other"]),
      color: AGODA_VIZ.two,
      detail: names(["charged", "confirmed", "pending", "other"]),
    },
    {
      key: "cancelled",
      label: "Cancelled",
      value: sum(["cancelled"]),
      color: AGODA_VIZ.muted,
      detail: names(["cancelled"]),
    },
  ]
}

/** Two-part splits (App vs Website, Paid on Agoda vs Pay at Hotel): the larger part is blue. */
function splitSegments(rows: AgodaReport["by_device"]): Segment[] {
  return rows.map((row, index) => ({
    key: row.name,
    label: row.name,
    value: row.bookings,
    color:
      index === 0
        ? AGODA_VIZ.one
        : index === 1
          ? AGODA_VIZ.two
          : AGODA_VIZ.muted,
  }))
}

/** The whole Agoda report for one range: KPIs, charts, breakdowns, sites, properties, bookings. */
export function AgodaReportBody({
  report,
  countries,
  fetchBookings,
  scopeKey,
}: {
  report: AgodaReport
  countries: { name: string; bookings: number }[]
  /** Passed to the bookings table; the admin Agoda API when absent. */
  fetchBookings?: (params: AgodaBookingsParams) => Promise<Paged<AgodaBooking>>
  scopeKey?: string
}) {
  if (report.summary.bookings === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            No bookings in {formatRange(report.start_date, report.end_date)}
          </CardTitle>
          <CardDescription>
            Try another date range, or check that this period has been imported.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <AgodaKpiTiles report={report} />
      <AgodaTrendChart report={report} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Where bookings stand</CardTitle>
            <CardDescription>
              Agoda&apos;s current status for each booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedBar segments={statusSegments(report)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
            <CardDescription>
              Where the guest booked: Agoda app or website.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedBar segments={splitSegments(report.by_device)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment type</CardTitle>
            <CardDescription>
              Prepaid on Agoda, or paid at the hotel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentedBar segments={splitSegments(report.by_dmc)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <BreakdownCard
          title="Destination countries"
          description="Where guests are staying."
          rows={report.by_destination_country.map((row) => ({
            key: row.name,
            label: row.name,
            metrics: row,
          }))}
        />
        <BreakdownCard
          title="Top cities"
          description="The 15 most-booked destination cities."
          rows={report.by_destination_city.map((row) => ({
            key: `${row.name}-${row.country}`,
            label: row.name,
            sublabel: row.country,
            metrics: row,
          }))}
        />
        <BreakdownCard
          title="Who's booking"
          description="The booker's country (Agoda's “Origin”)."
          rows={report.by_origin_country.map((row) => ({
            key: row.name,
            label: countryName(row.name),
            sublabel: row.name === countryName(row.name) ? null : row.name,
            metrics: row,
          }))}
        />
      </div>

      <AgodaPipelineChart report={report} />
      <AgodaSitesTable report={report} />
      <AgodaTopProperties report={report} />
      <AgodaBookingsTable
        params={{
          start_date: report.start_date,
          end_date: report.end_date,
          date_basis: report.date_basis,
          site_id: report.site_id ?? undefined,
        }}
        countries={countries}
        fetchBookings={fetchBookings}
        scopeKey={scopeKey}
      />
    </>
  )
}
