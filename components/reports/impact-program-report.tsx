"use client"

import { useMemo } from "react"

import DataTable from "@/components/common/DataTable"
import { MetricCard } from "@/components/common/MetricCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDataTableState } from "@/hooks/use-data-table-state"
import type { ImpactPerformanceData } from "@/lib/api/insights"
import {
  formatImpactInt,
  formatImpactMoney,
  formatImpactPct,
  IMPACT_DAY_COLUMNS,
  toImpactDayDisplay,
} from "@/lib/impact-performance-format"

type ImpactProgramReportProps = {
  programId: string
  programName: string | null
  data: ImpactPerformanceData
  /** The report's dates, e.g. "17 Sep 2026 – 23 Sep 2026". */
  rangeLabel: string
  isFetching: boolean
}

/**
 * A brand's Impact.com program for the picked dates: the same figures as its row on the
 * Dashboard, with its Performance by Day.
 */
export function ImpactProgramReport({
  programId,
  programName,
  data,
  rangeLabel,
  isFetching,
}: ImpactProgramReportProps) {
  const { query, setQuery, pagination, setPagination, resetToFirstPage } =
    useDataTableState({ initialPageSize: 25 })

  const summary = data.summary
  // Scoped to one program, so this is that program's row when Impact has data for it.
  const program = data.by_brand.find((row) => row.program_id === programId)

  const rows = useMemo(() => data.by_day.map(toImpactDayDisplay), [data.by_day])
  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle
      ? rows.filter((row) => row.date_display.toLowerCase().includes(needle))
      : rows
  }, [rows, query])

  const pageStart = pagination.pageIndex * pagination.pageSize
  const pagedRows = filteredRows.slice(pageStart, pageStart + pagination.pageSize)

  return (
    <section className="flex flex-col gap-6" aria-label="Impact.com performance">
      <Card>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Source</p>
            <p className="text-sm font-medium text-foreground">Impact.com</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Program</p>
            <p className="text-sm font-medium text-foreground">
              {program?.program || programName || "—"}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">ID {programId}</p>
          </div>
          {program ? (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">EPC</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {program.epc.toFixed(4)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">AOV</p>
                <p className="text-sm font-medium text-foreground tabular-nums">
                  {formatImpactMoney(program.aov)}
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Clicks"
          value={formatImpactInt(summary.clicks)}
          sublabel={`Total, ${rangeLabel}`}
        />
        <MetricCard label="Actions" value={formatImpactInt(summary.actions)} />
        <MetricCard label="Sale amount" value={formatImpactMoney(summary.sale_amount)} />
        <MetricCard
          label="Total earnings"
          value={formatImpactMoney(summary.total_earnings)}
        />
        <MetricCard
          label="Conversion rate"
          value={formatImpactPct(summary.conversion_rate)}
        />
      </div>

      <h2 className="text-base font-semibold text-foreground">Performance by Day</h2>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No data for these dates</CardTitle>
            <CardDescription>
              Impact.com has no activity for this program between {rangeLabel}. Try a
              wider date range.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <DataTable
          title="Performance by Day"
          data={pagedRows}
          columns={IMPACT_DAY_COLUMNS}
          pagination={pagination}
          setPagination={setPagination}
          totalCount={filteredRows.length}
          count={filteredRows.length}
          query={query}
          setQuery={(next: string) => {
            setQuery(next)
            resetToFirstPage()
          }}
          isFetching={isFetching}
        />
      )}
    </section>
  )
}
