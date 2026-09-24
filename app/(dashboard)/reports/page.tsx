"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { RefreshCw } from "lucide-react"

import { FilterTabs } from "@/components/common/FilterTabs"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/layout/page-header"
import { ReportRangeFilter } from "@/components/reports/report-range-filter"
import {
  formatReportValue,
  ReportTableSection,
} from "@/components/reports/report-table-section"
import { ReportWarningsCard } from "@/components/reports/report-warnings-card"
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
  fetchReportInsightBrands,
  fetchReportInsights,
  reportInsightBrandsQueryKey,
  reportInsightsQueryKey,
  type ReportInsights,
  type SheetReportInsight,
} from "@/lib/api/report-insights"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { presetRange, type ReportDateRange } from "@/lib/report-date-range"
import { reportSyncBadge } from "@/lib/report-source.types"

function formatDateTime(value: string | null) {
  if (!value) return "—"
  try {
    return format(new Date(value), "dd MMM yyyy, HH:mm")
  } catch {
    return value
  }
}

/** The rate as saved (up to 4 decimals), like the sheet page's Dollar rate card. */
const rateFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

function formatRange(range: ReportDateRange) {
  return `${formatReportValue(range.start_date, "date")} – ${formatReportValue(range.end_date, "date")}`
}

function apiMessage(error: unknown, fallback: string) {
  const message = (error as AxiosError<{ message?: string | string[] }>)
    .response?.data?.message
  return (Array.isArray(message) ? message[0] : message) ?? fallback
}

function SummaryItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}

function ErrorCard({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="ring-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
        <Button
          type="button"
          variant="outline"
          className="mt-2 w-fit"
          onClick={onRetry}
        >
          Retry
        </Button>
      </CardHeader>
    </Card>
  )
}

/** One sheet's report: where the numbers come from, anything to check, then the tables. */
function SheetReport({
  report,
  range,
  selectedTableKey,
  onSelectTable,
}: {
  report: SheetReportInsight
  range: ReportDateRange
  /** The table picked in the tab strip; the first one when unset or no longer in the report. */
  selectedTableKey: string | undefined
  onSelectTable: (key: string) => void
}) {
  const badge = reportSyncBadge(report.last_sync_status)
  const rangeLabel = formatRange(range)
  const tabNames = report.tabs.map((tab) => tab.name).join(", ")

  // Several tables (Bullet: Revenue, bb_subscription, bb_subscription_renew) are shown one at a
  // time, picked from a tab strip. A single table is shown as it is.
  const selectedTable =
    report.tables.find((table) => table.key === selectedTableKey) ??
    report.tables[0]
  const showTableTabs = report.tables.length > 1 && selectedTable !== undefined
  const shownTables = showTableTabs ? [selectedTable] : report.tables

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Sheet">
            <Link
              href={`/report-sources/${report.report_source_id}`}
              className="underline-offset-4 hover:underline"
            >
              {report.sheet_name}
            </Link>
            <p className="text-xs font-normal text-muted-foreground">
              {report.sheet_type_label}
            </p>
          </SummaryItem>
          <SummaryItem label="Last synced">
            <div className="flex flex-wrap items-center gap-2">
              <span>{formatDateTime(report.last_synced_at)}</span>
              <StatusBadge label={badge.label} variant={badge.variant} />
            </div>
          </SummaryItem>
          {report.uses_dollar_rate ? (
            <SummaryItem label="Dollar rate">
              {report.usd_to_inr_rate === null
                ? "Not set"
                : `1 USD = ${rateFormat.format(report.usd_to_inr_rate)}`}
            </SummaryItem>
          ) : null}
          {report.all_tabs ? (
            <SummaryItem label="Tabs read">
              <span className="tabular-nums">
                {report.tabs.length} {report.tabs.length === 1 ? "tab" : "tabs"}
              </span>
              {tabNames ? (
                <p
                  className="line-clamp-2 text-xs font-normal text-muted-foreground"
                  title={tabNames}
                >
                  {tabNames}
                </p>
              ) : null}
            </SummaryItem>
          ) : null}
          <SummaryItem label="Sheet rows used">
            <span className="tabular-nums">
              {formatReportValue(report.rows_used, "number")}
            </span>
          </SummaryItem>
        </CardContent>
      </Card>

      {report.last_sync_status === "FAILED" ? (
        <Card className="ring-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              The last sync failed
            </CardTitle>
            <CardDescription>
              These figures come from the last successful import. The sheet&apos;s
              page on Report Sources shows why the sync failed.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <ReportWarningsCard warnings={report.warnings} />

      {showTableTabs ? (
        <FilterTabs
          tabs={report.tables.map((table) => ({
            value: table.key,
            label: table.title,
          }))}
          value={selectedTable.key}
          onChange={onSelectTable}
        />
      ) : null}

      {shownTables.map((table) => (
        <ReportTableSection
          // A new range remounts the table, which puts it back on page 1.
          key={`${table.key}-${range.start_date}-${range.end_date}`}
          table={table}
          rangeLabel={rangeLabel}
        />
      ))}
    </div>
  )
}

function UntypedSheets({ sheets }: { sheets: ReportInsights["sheets_without_type"] }) {
  if (sheets.length === 0) return null
  return (
    <p className="text-xs text-muted-foreground">
      Also on this brand, with no report yet:{" "}
      {sheets.map((sheet, index) => (
        <span key={sheet.report_source_id}>
          {index > 0 ? ", " : null}
          <Link
            href={`/report-sources/${sheet.report_source_id}`}
            className="underline underline-offset-4"
          >
            {sheet.sheet_name}
          </Link>
        </span>
      ))}
      .
    </p>
  )
}

export default function ReportsPage() {
  const { role, isReady } = useDashboardUserRole()
  const isAdmin = isReady && role === UserRole.ADMIN

  const [brandId, setBrandId] = useState("")
  const [range, setRange] = useState<ReportDateRange>(() =>
    presetRange("last_30_days", new Date()),
  )
  // The table tab picked per sheet (report_source_id -> table key). Kept here rather than in
  // SheetReport, which unmounts while a new range loads, so a date change keeps the tab.
  const [selectedTables, setSelectedTables] = useState<Record<string, string>>(
    {},
  )

  const brandsQuery = useQuery({
    queryKey: reportInsightBrandsQueryKey,
    queryFn: fetchReportInsightBrands,
    enabled: isAdmin,
    // Refetch whenever the page opens: removing or restoring a sheet on Report Sources changes it.
    staleTime: 0,
  })
  const brands = brandsQuery.data ?? []

  const reportQuery = useQuery({
    queryKey: [
      ...reportInsightsQueryKey,
      brandId,
      range.start_date,
      range.end_date,
    ],
    queryFn: () =>
      fetchReportInsights({ brand_profile_id: brandId, ...range }),
    enabled: isAdmin && brandId !== "",
    // Always refetch when the page opens, so a sync or a new Dollar rate shows up straight away.
    staleTime: 0,
  })

  if (!isReady) {
    return <LoadingSkeleton className="h-48 w-full" />
  }

  if (role !== UserRole.ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>Reports are available to admins only.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const brandsLoading = brandsQuery.isFetching && brands.length === 0
  const insights = reportQuery.data

  let body: React.ReactNode
  // A failed refetch keeps the cached list, which is still fine to pick from.
  if (brandsQuery.isError && brands.length === 0) {
    body = (
      <ErrorCard
        title="Could not load brands"
        message={apiMessage(brandsQuery.error, "Check your connection and try again.")}
        onRetry={() => brandsQuery.refetch()}
      />
    )
  } else if (brandsQuery.isSuccess && brands.length === 0) {
    body = (
      <Card>
        <CardHeader>
          <CardTitle>No reports yet</CardTitle>
          <CardDescription>
            A brand appears here once one of its sheets has a sheet type, which
            decides how its report is worked out. Sheet types are set through the
            API for now (PATCH /api/report-sources/:id with sheet_type).
          </CardDescription>
          <Button asChild variant="outline" className="mt-2 w-fit">
            <Link href="/report-sources">View Report Sources</Link>
          </Button>
        </CardHeader>
      </Card>
    )
  } else if (brandsLoading) {
    body = <LoadingSkeleton className="h-48 w-full" />
  } else if (brandId === "") {
    body = (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pick a brand</CardTitle>
          <CardDescription>
            Choose a brand and a date range above to see its report.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  } else if (reportQuery.isError) {
    body = (
      <ErrorCard
        title="Could not load the report"
        message={apiMessage(reportQuery.error, "Check your connection and try again.")}
        onRetry={() => reportQuery.refetch()}
      />
    )
  } else if (!insights) {
    body = <LoadingSkeleton className="h-64 w-full" />
  } else if (insights.reports.length === 0) {
    body = (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            No report for {insights.brand.brand_name || "this brand"}
          </CardTitle>
          <CardDescription>
            None of this brand&apos;s sheets has a sheet type yet. Sheet types
            are set through the API for now.
          </CardDescription>
          <div className="mt-2">
            <UntypedSheets sheets={insights.sheets_without_type} />
          </div>
        </CardHeader>
      </Card>
    )
  } else {
    body = (
      <>
        {insights.reports.map((report) => (
          <SheetReport
            key={report.report_source_id}
            report={report}
            range={{ start_date: insights.start_date, end_date: insights.end_date }}
            selectedTableKey={selectedTables[report.report_source_id]}
            onSelectTable={(key) =>
              setSelectedTables((prev) => ({
                ...prev,
                [report.report_source_id]: key,
              }))
            }
          />
        ))}
        <UntypedSheets sheets={insights.sheets_without_type} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            TMOE Admin <span className="mx-1.5">/</span> Reports
          </>
        }
        title="Reports"
        description="Pick a brand and a date range to see its report, worked out from its sheet's last sync."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-brand">Brand</Label>
              <Select
                value={brandId}
                onValueChange={(value) => {
                  setBrandId(value)
                  setSelectedTables({})
                }}
                disabled={brandsLoading || brands.length === 0}
              >
                <SelectTrigger id="report-brand" className="h-9 w-[220px]">
                  <SelectValue
                    placeholder={brandsLoading ? "Loading brands…" : "Select a brand"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ReportRangeFilter value={range} onChange={setRange} />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              title="Reloads the report. To re-read the Google Sheet, use Sync now on its Report Sources page."
              onClick={() => reportQuery.refetch()}
              disabled={brandId === "" || reportQuery.isFetching}
            >
              <RefreshCw
                className={`size-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {body}
    </div>
  )
}
