"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"

import DataTable from "@/components/common/DataTable"
import { MetricCard } from "@/components/common/MetricCard"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useDataTableState } from "@/hooks/use-data-table-state"
import type {
  ReportInsightRow,
  ReportInsightTable,
  ReportValueFormat,
} from "@/lib/api/report-insights"

const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 4,
})

const rupeeFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** How the report shows a value; null and blank become an em dash. */
export function formatReportValue(
  value: string | number | null | undefined,
  valueFormat: ReportValueFormat,
): string {
  if (value === null || value === undefined || value === "") return "—"
  switch (valueFormat) {
    case "inr":
      return typeof value === "number" ? rupeeFormat.format(value) : String(value)
    case "number":
      return typeof value === "number" ? numberFormat.format(value) : String(value)
    case "date": {
      // parseISO reads YYYY-MM-DD as a local date, so the day never shifts back west of UTC.
      const date = parseISO(String(value))
      return Number.isNaN(date.getTime()) ? String(value) : format(date, "dd MMM yyyy")
    }
    default:
      return String(value)
  }
}

type DisplayRow = {
  /** DataTable keys rows by `id`; report rows have none of their own. */
  id: string
  cells: ReportInsightRow
  /** Every cell as shown, lower-cased, for the search box. */
  searchText: string
}

type ReportTableSectionProps = {
  table: ReportInsightTable
  /** The report's dates, e.g. "17 Sep 2026 – 23 Sep 2026". */
  rangeLabel: string
}

/** One calculated table: its totals as stat cards, then its rows. */
export function ReportTableSection({ table, rangeLabel }: ReportTableSectionProps) {
  const { query, setQuery, pagination, setPagination, resetToFirstPage } =
    useDataTableState({ initialPageSize: 25 })

  const totalColumns = table.columns.filter((column) => column.key in table.totals)

  const rows = useMemo<DisplayRow[]>(
    () =>
      table.rows.map((row, index) => ({
        id: `${table.key}-${index}`,
        cells: row,
        searchText: table.columns
          .map((column) => formatReportValue(row[column.key], column.format))
          .join(" ")
          .toLowerCase(),
      })),
    [table],
  )

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle ? rows.filter((row) => row.searchText.includes(needle)) : rows
  }, [rows, query])

  const pageStart = pagination.pageIndex * pagination.pageSize
  const pagedRows = filteredRows.slice(pageStart, pageStart + pagination.pageSize)

  const columns = useMemo(
    () =>
      table.columns.map((column) => ({
        accessorKey: `cells.${column.key}`,
        header: column.header,
        cell: ({ row }: { row: { original: DisplayRow } }) => {
          const text = formatReportValue(row.original.cells[column.key], column.format)
          if (text === "—") return <span className="text-muted-foreground">—</span>
          const numeric = column.format === "number" || column.format === "inr"
          return <span className={numeric ? "tabular-nums" : undefined}>{text}</span>
        },
      })),
    [table.columns],
  )

  return (
    <section className="flex flex-col gap-4" aria-label={table.title}>
      {totalColumns.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {totalColumns.map((column) => (
            <MetricCard
              key={column.key}
              label={column.header}
              value={formatReportValue(table.totals[column.key], column.format)}
              sublabel={`Total, ${rangeLabel}`}
            />
          ))}
        </div>
      ) : null}

      <h2 className="text-base font-semibold text-foreground">{table.title}</h2>

      {table.rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No data for these dates</CardTitle>
            <CardDescription>
              The sheet has no rows between {rangeLabel}. Try a wider date range.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <DataTable
          title={table.title.toLowerCase()}
          data={pagedRows}
          columns={columns}
          pagination={pagination}
          setPagination={setPagination}
          totalCount={filteredRows.length}
          count={filteredRows.length}
          query={query}
          setQuery={(next: string) => {
            setQuery(next)
            resetToFirstPage()
          }}
        />
      )}
    </section>
  )
}
