"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays } from "date-fns"
import { RefreshCw } from "lucide-react"

import DataTable from "@/components/common/DataTable"
import { MetricCard } from "@/components/common/MetricCard"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { useDataTableState } from "@/hooks/use-data-table-state"
import {
  fetchImpactPerformance,
  impactPerformanceQueryKey,
  type ImpactBrandPerformanceRow,
  type ImpactDayPerformanceRow,
} from "@/lib/api/insights"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

function toInputDate(d: Date) {
  return format(d, "yyyy-MM-dd")
}

function formatInt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n)
}

function formatPct(rate: number) {
  return `${(rate * 100).toFixed(2)}%`
}

function formatRate(n: number) {
  return n.toFixed(4)
}

type BrandDisplayRow = {
  id: string
  program: string
  program_id: string
  clicks: string
  actions: string
  sale_amount: string
  total_earnings: string
  epa: string
  epc: string
  conversion_rate: string
  aov: string
}

type DayDisplayRow = {
  id: string
  date_display: string
  clicks: string
  actions: string
  sale_amount: string
  total_earnings: string
  epa: string
  epc: string
  conversion_rate: string
  aov: string
}

function toBrandDisplay(row: ImpactBrandPerformanceRow): BrandDisplayRow {
  return {
    id: row.program_id || row.program,
    program: row.program,
    program_id: row.program_id,
    clicks: formatInt(row.clicks),
    actions: formatInt(row.actions),
    sale_amount: formatMoney(row.sale_amount),
    total_earnings: formatMoney(row.total_earnings),
    epa: formatRate(row.epa),
    epc: formatRate(row.epc),
    conversion_rate: formatPct(row.conversion_rate),
    aov: formatMoney(row.aov),
  }
}

function toDayDisplay(row: ImpactDayPerformanceRow): DayDisplayRow {
  return {
    id: row.date || row.date_display,
    date_display: row.date_display,
    clicks: formatInt(row.clicks),
    actions: formatInt(row.actions),
    sale_amount: formatMoney(row.sale_amount),
    total_earnings: formatMoney(row.total_earnings),
    epa: formatRate(row.epa),
    epc: formatRate(row.epc),
    conversion_rate: formatPct(row.conversion_rate),
    aov: formatMoney(row.aov),
  }
}

export default function InsightsPage() {
  const { role, isReady } = useDashboardUserRole()
  const [startDate, setStartDate] = useState(() =>
    toInputDate(subDays(new Date(), 13)),
  )
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()))
  const [appliedRange, setAppliedRange] = useState({
    start_date: toInputDate(subDays(new Date(), 13)),
    end_date: toInputDate(new Date()),
  })

  const brandTable = useDataTableState()
  const dayTable = useDataTableState()

  const isAdmin = role === UserRole.ADMIN

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: [
      ...impactPerformanceQueryKey,
      appliedRange.start_date,
      appliedRange.end_date,
    ],
    queryFn: () =>
      fetchImpactPerformance({
        start_date: appliedRange.start_date,
        end_date: appliedRange.end_date,
      }),
    enabled: isReady && isAdmin,
  })

  const brandRows = useMemo(
    () => (data?.by_brand ?? []).map(toBrandDisplay),
    [data?.by_brand],
  )
  const dayRows = useMemo(
    () => (data?.by_day ?? []).map(toDayDisplay),
    [data?.by_day],
  )
  const summary = data?.summary

  const filteredBrandRows = useMemo(() => {
    const q = brandTable.query.trim().toLowerCase()
    if (!q) return brandRows
    return brandRows.filter(
      (row) =>
        row.program.toLowerCase().includes(q) ||
        row.program_id.toLowerCase().includes(q),
    )
  }, [brandRows, brandTable.query])

  const filteredDayRows = useMemo(() => {
    const q = dayTable.query.trim().toLowerCase()
    if (!q) return dayRows
    return dayRows.filter((row) => row.date_display.toLowerCase().includes(q))
  }, [dayRows, dayTable.query])

  const brandPage = brandTable.pagination.pageIndex
  const brandPageSize = brandTable.pagination.pageSize
  const pagedBrandRows = filteredBrandRows.slice(
    brandPage * brandPageSize,
    brandPage * brandPageSize + brandPageSize,
  )

  const dayPage = dayTable.pagination.pageIndex
  const dayPageSize = dayTable.pagination.pageSize
  const pagedDayRows = filteredDayRows.slice(
    dayPage * dayPageSize,
    dayPage * dayPageSize + dayPageSize,
  )

  if (!isReady) {
    return <LoadingSkeleton variant="default" />
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Dashboard"
          description="Impact performance reporting is available to admins."
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No dashboard data</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your role does not include Impact.com performance reports. Contact
            an admin if you need access.
          </CardContent>
        </Card>
      </div>
    )
  }

  const errorMessage =
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ??
    (error instanceof Error ? error.message : "Impact.com API request failed.")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Impact.com Performance by Brand and Performance by Day for TMOE’s media partner account."
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="insights-start">Start</Label>
              <Input
                id="insights-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-42"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insights-end">End</Label>
              <Input
                id="insights-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-42"
              />
            </div>
            <Button
              type="button"
              onClick={() => {
                setAppliedRange({ start_date: startDate, end_date: endDate })
                brandTable.resetToFirstPage()
                dayTable.resetToFirstPage()
              }}
            >
              Apply
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        }
      />

      {isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Could not load Impact performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{errorMessage}</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Clicks"
          value={summary ? formatInt(summary.clicks) : "—"}
          sublabel={
            data
              ? `${data.start_date} → ${data.end_date}`
              : "Loading date range"
          }
        />
        <MetricCard
          label="Actions"
          value={summary ? formatInt(summary.actions) : "—"}
        />
        <MetricCard
          label="Sale amount"
          value={summary ? formatMoney(summary.sale_amount) : "—"}
        />
        <MetricCard
          label="Total earnings"
          value={summary ? formatMoney(summary.total_earnings) : "—"}
        />
        <MetricCard
          label="Conversion rate"
          value={summary ? formatPct(summary.conversion_rate) : "—"}
          sublabel={
            summary ? `${formatInt(summary.programs)} programs` : undefined
          }
        />
      </div>

      {isFetching && !data ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : (
        <>
          <DataTable
            title="Performance by Brand"
            data={pagedBrandRows}
            totalCount={filteredBrandRows.length}
            count={filteredBrandRows.length}
            pagination={brandTable.pagination}
            setPagination={brandTable.setPagination}
            query={brandTable.query}
            setQuery={(q: string) => {
              brandTable.setQuery(q)
              brandTable.resetToFirstPage()
            }}
            isFetching={isFetching}
            columns={[
              { accessorKey: "program", header: "Program" },
              { accessorKey: "program_id", header: "Program ID" },
              { accessorKey: "clicks", header: "Clicks" },
              { accessorKey: "actions", header: "Actions" },
              { accessorKey: "sale_amount", header: "Sale amount" },
              { accessorKey: "total_earnings", header: "Total earnings" },
              { accessorKey: "epa", header: "EPA" },
              { accessorKey: "epc", header: "EPC" },
              { accessorKey: "conversion_rate", header: "CR" },
              { accessorKey: "aov", header: "AOV" },
            ]}
          />

          <DataTable
            title="Performance by Day"
            data={pagedDayRows}
            totalCount={filteredDayRows.length}
            count={filteredDayRows.length}
            pagination={dayTable.pagination}
            setPagination={dayTable.setPagination}
            query={dayTable.query}
            setQuery={(q: string) => {
              dayTable.setQuery(q)
              dayTable.resetToFirstPage()
            }}
            isFetching={isFetching}
            columns={[
              { accessorKey: "date_display", header: "Date" },
              { accessorKey: "clicks", header: "Clicks" },
              { accessorKey: "actions", header: "Actions" },
              { accessorKey: "sale_amount", header: "Sale amount" },
              { accessorKey: "total_earnings", header: "Total earnings" },
              { accessorKey: "epa", header: "EPA" },
              { accessorKey: "epc", header: "EPC" },
              { accessorKey: "conversion_rate", header: "CR" },
              { accessorKey: "aov", header: "AOV" },
            ]}
          />
        </>
      )}
    </div>
  )
}
