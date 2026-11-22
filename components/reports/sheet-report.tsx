"use client"

import Link from "next/link"
import { format } from "date-fns"

import { FilterTabs } from "@/components/common/FilterTabs"
import { StatusBadge } from "@/components/common/StatusBadge"
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
import type {
  ReportInsights,
  SheetReportInsight,
} from "@/lib/api/report-insights"
import type { ReportDateRange } from "@/lib/report-date-range"
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

export function formatReportRange(range: ReportDateRange) {
  return `${formatReportValue(range.start_date, "date")} – ${formatReportValue(range.end_date, "date")}`
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

export function ErrorCard({
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
export function SheetReport({
  report,
  range,
  selectedTableKey,
  onSelectTable,
  showAdminLinks = true,
}: {
  report: SheetReportInsight
  range: ReportDateRange
  /** The table picked in the tab strip; the first one when unset or no longer in the report. */
  selectedTableKey: string | undefined
  onSelectTable: (key: string) => void
  /** Links to the sheet's Report Sources page and admin-only notes; off for a brand. */
  showAdminLinks?: boolean
}) {
  const badge = reportSyncBadge(report.last_sync_status)
  const rangeLabel = formatReportRange(range)
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
            {showAdminLinks ? (
              <Link
                href={`/report-sources/${report.report_source_id}`}
                className="underline-offset-4 hover:underline"
              >
                {report.sheet_name}
              </Link>
            ) : (
              <span>{report.sheet_name}</span>
            )}
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
              These figures come from the last successful import.
              {showAdminLinks
                ? " The sheet's page on Report Sources shows why the sync failed."
                : " The TMOE team has been notified and will refresh the data."}
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
          label="Report"
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

export function UntypedSheets({ sheets }: { sheets: ReportInsights["sheets_without_type"] }) {
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
