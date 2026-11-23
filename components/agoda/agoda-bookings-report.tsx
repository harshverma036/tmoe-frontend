"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { RefreshCw, Upload } from "lucide-react"

import { FilterTabs } from "@/components/common/FilterTabs"
import {
  AGODA_BASIS_HELP,
  AGODA_BASIS_TABS,
  AgodaReportBody,
} from "@/components/agoda/agoda-report-body"
import {
  AgodaRangeFilter,
  agodaPresetRange,
  type AgodaRangePreset,
} from "@/components/agoda/agoda-range-filter"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiMessage, formatRange } from "@/lib/agoda-format"
import type {
  AgodaBooking,
  AgodaBookingsParams,
  AgodaDateBasis,
  AgodaMeta,
  AgodaReport,
  AgodaReportParams,
  Paged,
} from "@/lib/api/agoda"
import type { ReportDateRange } from "@/lib/report-date-range"

const ALL_SITES = "all"

function ErrorBox({
  title,
  error,
  onRetry,
}: {
  title: string
  error: unknown
  onRetry: () => void
}) {
  return (
    <Card className="ring-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{title}</CardTitle>
        <CardDescription>
          {apiMessage(error, "Check your connection and try again.")}
        </CardDescription>
        <Button variant="outline" className="mt-2 w-fit" onClick={onRetry}>
          Retry
        </Button>
      </CardHeader>
    </Card>
  )
}

/**
 * The Agoda bookings dashboard: date range, site and date-basis filters over the KPIs, charts,
 * breakdowns and every booking. Admins read it from the Agoda API; Agoda's own login reads the
 * same data through its campaign.
 */
export function AgodaBookingsReport({
  meta,
  metaError,
  onRefetchMeta,
  fetchReport,
  fetchBookings,
  queryKey,
  scopeKey,
  canImport,
}: {
  /** Undefined while loading. */
  meta: AgodaMeta | null | undefined
  metaError: unknown
  onRefetchMeta: () => void
  fetchReport: (params: AgodaReportParams) => Promise<AgodaReport>
  /** The admin Agoda API when absent. */
  fetchBookings?: (params: AgodaBookingsParams) => Promise<Paged<AgodaBooking>>
  /** Prefix of the report's query key. */
  queryKey: readonly unknown[]
  /** Keeps the bookings table's cache apart per data source. */
  scopeKey?: string
  /** Show the CSV import links (admins). */
  canImport: boolean
}) {
  const [preset, setPreset] = useState<AgodaRangePreset>("last_3_months")
  const [range, setRange] = useState<ReportDateRange>(() =>
    agodaPresetRange("last_3_months", new Date(), null)
  )
  const [basis, setBasis] = useState<AgodaDateBasis>("booking")
  const [siteId, setSiteId] = useState(ALL_SITES)

  const hasData = (meta?.total_bookings ?? 0) > 0
  const params = {
    ...range,
    date_basis: basis,
    site_id: siteId === ALL_SITES ? undefined : siteId,
  }
  const reportQuery = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetchReport(params),
    enabled: hasData,
    keepPreviousData: true,
    staleTime: 0,
  })
  const report = reportQuery.data

  let body: React.ReactNode
  if (metaError && !meta) {
    body = (
      <ErrorBox
        title="Could not load Agoda data"
        error={metaError}
        onRetry={onRefetchMeta}
      />
    )
  } else if (meta === undefined) {
    body = <LoadingSkeleton className="h-64 w-full" />
  } else if (!meta || meta.total_bookings === 0) {
    body = (
      <Card>
        <CardHeader>
          <CardTitle>No Agoda data yet</CardTitle>
          <CardDescription>
            {canImport
              ? "Import the Booking Received CSV from Agoda Partners to see the report."
              : "Bookings appear here once the Booking Received export from Agoda Partners is imported."}
          </CardDescription>
          {canImport ? (
            <Button asChild className="mt-2 w-fit gap-2">
              <Link href="/agoda/import">
                <Upload className="size-4" /> Import a CSV
              </Link>
            </Button>
          ) : null}
        </CardHeader>
      </Card>
    )
  } else if (reportQuery.isError) {
    body = (
      <ErrorBox
        title="Could not load the report"
        error={reportQuery.error}
        onRetry={() => reportQuery.refetch()}
      />
    )
  } else if (!report) {
    body = <LoadingSkeleton className="h-96 w-full" />
  } else {
    body = (
      <AgodaReportBody
        report={report}
        countries={meta.destination_countries}
        fetchBookings={fetchBookings}
        scopeKey={scopeKey}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {meta && hasData ? (
        <Card className="py-4">
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <AgodaRangeFilter
                value={range}
                onChange={setRange}
                preset={preset}
                onPresetChange={setPreset}
                firstBookingDate={meta.first_booking_date}
              />
              <div className="space-y-1.5">
                <Label htmlFor="agoda-site">Site</Label>
                <Select value={siteId} onValueChange={setSiteId}>
                  <SelectTrigger id="agoda-site" className="h-9 w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_SITES}>All sites</SelectItem>
                    {meta.sites.map((site) => (
                      <SelectItem key={site.site_id} value={site.site_id}>
                        {site.site_name} ({site.site_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  onRefetchMeta()
                  reportQuery.refetch()
                }}
                disabled={reportQuery.isFetching}
              >
                <RefreshCw
                  className={`size-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <div className="flex flex-col gap-1 border-t border-border pt-3 sm:flex-row sm:items-center sm:gap-3">
              <span
                className="text-xs text-muted-foreground"
                id="agoda-basis-label"
              >
                Dates are
              </span>
              <FilterTabs
                tabs={AGODA_BASIS_TABS}
                value={basis}
                onChange={setBasis}
                labelledBy="agoda-basis-label"
              />
              <span className="text-xs text-muted-foreground">
                {AGODA_BASIS_HELP[basis]} Showing{" "}
                {formatRange(range.start_date, range.end_date)}.
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {body}
    </div>
  )
}
