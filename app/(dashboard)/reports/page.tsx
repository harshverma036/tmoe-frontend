"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { RefreshCw } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { ImpactProgramReport } from "@/components/reports/impact-program-report"
import { ReportRangeFilter } from "@/components/reports/report-range-filter"
import {
  ErrorCard,
  formatReportRange,
  SheetReport,
  UntypedSheets,
} from "@/components/reports/sheet-report"
import { Button } from "@/components/ui/button"
import {
  Card,
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
  fetchImpactPerformance,
  impactPerformanceQueryKey,
} from "@/lib/api/insights"
import {
  fetchReportInsightBrands,
  fetchReportInsights,
  reportInsightBrandsQueryKey,
  reportInsightsQueryKey,
} from "@/lib/api/report-insights"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { presetRange, type ReportDateRange } from "@/lib/report-date-range"

function apiMessage(error: unknown, fallback: string) {
  const message = (error as AxiosError<{ message?: string | string[] }>)
    .response?.data?.message
  return (Array.isArray(message) ? message[0] : message) ?? fallback
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

  // A brand linked to an Impact.com program (Promote Links → Brand Impact config) also gets
  // that program's figures, read live from Impact for the same dates.
  const selectedBrand = brands.find((brand) => brand.id === brandId)
  const impactProgramId = selectedBrand?.impact_program_id ?? null
  const impactQuery = useQuery({
    queryKey: [
      ...impactPerformanceQueryKey,
      impactProgramId,
      range.start_date,
      range.end_date,
    ],
    queryFn: () =>
      fetchImpactPerformance({
        program_id: impactProgramId ?? undefined,
        ...range,
      }),
    enabled: isAdmin && impactProgramId !== null,
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
  const impact = impactQuery.data

  let impactSection: React.ReactNode = null
  if (impactProgramId === null) {
    impactSection = null
  } else if (impactQuery.isError) {
    impactSection = (
      <ErrorCard
        title="Could not load Impact.com performance"
        message={apiMessage(impactQuery.error, "Impact.com API request failed.")}
        onRetry={() => impactQuery.refetch()}
      />
    )
  } else if (!impact) {
    impactSection = <LoadingSkeleton className="h-64 w-full" />
  } else {
    impactSection = (
      <ImpactProgramReport
        // A new range or brand remounts the table, which puts it back on page 1.
        key={`${impactProgramId}-${impact.start_date}-${impact.end_date}`}
        programId={impactProgramId}
        programName={selectedBrand?.impact_program_name ?? null}
        data={impact}
        rangeLabel={formatReportRange({
          start_date: impact.start_date,
          end_date: impact.end_date,
        })}
        isFetching={impactQuery.isFetching}
      />
    )
  }

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
            decides how its report is worked out, or once it is linked to an
            Impact.com program on Promote Links. Sheet types are set through the
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
      <>
        {impactSection}
        <ErrorCard
          title="Could not load the report"
          message={apiMessage(reportQuery.error, "Check your connection and try again.")}
          onRetry={() => reportQuery.refetch()}
        />
      </>
    )
  } else if (!insights) {
    body = impactSection ?? <LoadingSkeleton className="h-64 w-full" />
  } else if (insights.reports.length === 0 && impactSection !== null) {
    // The Impact.com report is this brand's report; any sheets it has are listed below it.
    body = (
      <>
        {impactSection}
        <UntypedSheets sheets={insights.sheets_without_type} />
      </>
    )
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
        {impactSection}
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
              onClick={() => {
                reportQuery.refetch()
                if (impactProgramId !== null) impactQuery.refetch()
              }}
              disabled={
                brandId === "" || reportQuery.isFetching || impactQuery.isFetching
              }
            >
              <RefreshCw
                className={`size-4 ${
                  reportQuery.isFetching || impactQuery.isFetching ? "animate-spin" : ""
                }`}
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
