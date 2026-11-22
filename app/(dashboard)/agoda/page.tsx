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
import { PageHeader } from "@/components/layout/page-header"
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
import {
  apiMessage,
  formatDate,
  formatInt,
  formatRange,
} from "@/lib/agoda-format"
import {
  agodaQueryKeys,
  fetchAgodaMeta,
  fetchAgodaReport,
  type AgodaDateBasis,
} from "@/lib/api/agoda"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import type { ReportDateRange } from "@/lib/report-date-range"

const ALL_SITES = "all"

export default function AgodaReportPage() {
  const { role, isReady } = useDashboardUserRole()
  const isAdmin = isReady && role === UserRole.ADMIN

  const [preset, setPreset] = useState<AgodaRangePreset>("last_3_months")
  const [range, setRange] = useState<ReportDateRange>(() =>
    agodaPresetRange("last_3_months", new Date(), null)
  )
  const [basis, setBasis] = useState<AgodaDateBasis>("booking")
  const [siteId, setSiteId] = useState(ALL_SITES)

  const metaQuery = useQuery({
    queryKey: agodaQueryKeys.meta,
    queryFn: fetchAgodaMeta,
    enabled: isAdmin,
    staleTime: 0,
  })
  const meta = metaQuery.data

  const params = {
    ...range,
    date_basis: basis,
    site_id: siteId === ALL_SITES ? undefined : siteId,
  }
  const reportQuery = useQuery({
    queryKey: [...agodaQueryKeys.report, params],
    queryFn: () => fetchAgodaReport(params),
    enabled: isAdmin && (meta?.total_bookings ?? 0) > 0,
    keepPreviousData: true,
    staleTime: 0,
  })

  if (!isReady) return <LoadingSkeleton className="h-48 w-full" />
  if (role !== UserRole.ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agoda</CardTitle>
          <CardDescription>
            The Agoda report is available to admins only.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const report = reportQuery.data
  let body: React.ReactNode
  if (metaQuery.isError) {
    body = (
      <Card className="ring-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Could not load Agoda data
          </CardTitle>
          <CardDescription>
            {apiMessage(
              metaQuery.error,
              "Check your connection and try again."
            )}
          </CardDescription>
          <Button
            variant="outline"
            className="mt-2 w-fit"
            onClick={() => metaQuery.refetch()}
          >
            Retry
          </Button>
        </CardHeader>
      </Card>
    )
  } else if (!meta) {
    body = <LoadingSkeleton className="h-64 w-full" />
  } else if (meta.total_bookings === 0) {
    body = (
      <Card>
        <CardHeader>
          <CardTitle>No Agoda data yet</CardTitle>
          <CardDescription>
            Import the Booking Received CSV from Agoda Partners to see the
            report.
          </CardDescription>
          <Button asChild className="mt-2 w-fit gap-2">
            <Link href="/agoda/import">
              <Upload className="size-4" /> Import a CSV
            </Link>
          </Button>
        </CardHeader>
      </Card>
    )
  } else if (reportQuery.isError) {
    body = (
      <Card className="ring-destructive/40">
        <CardHeader>
          <CardTitle className="text-base text-destructive">
            Could not load the report
          </CardTitle>
          <CardDescription>
            {apiMessage(
              reportQuery.error,
              "Check your connection and try again."
            )}
          </CardDescription>
          <Button
            variant="outline"
            className="mt-2 w-fit"
            onClick={() => reportQuery.refetch()}
          >
            Retry
          </Button>
        </CardHeader>
      </Card>
    )
  } else if (!report) {
    body = <LoadingSkeleton className="h-96 w-full" />
  } else {
    body = (
      <AgodaReportBody
        report={report}
        countries={meta.destination_countries}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            TMOE Admin <span className="mx-1.5">/</span> Agoda
          </>
        }
        title="Agoda bookings"
        description={
          meta && meta.total_bookings > 0
            ? `${formatInt(meta.total_bookings)} bookings imported, booked ${formatDate(meta.first_booking_date)} – ${formatDate(meta.last_booking_date)}. All amounts in USD.`
            : "Bookings and commission from Agoda Partners, imported from its CSV export."
        }
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/agoda/import">
              <Upload className="size-4" /> Import CSV
            </Link>
          </Button>
        }
      />

      {meta && meta.total_bookings > 0 ? (
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
                  metaQuery.refetch()
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
