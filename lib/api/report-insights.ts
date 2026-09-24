import apiConfig from "@/lib/apiConfig"
import type {
  ReportSourceBrand,
  ReportSyncStatus,
} from "@/lib/report-source.types"

/** How to show a value: `inr` is rupees, `date` is `YYYY-MM-DD`. */
export type ReportValueFormat = "date" | "text" | "number" | "inr"

export type ReportInsightColumn = {
  key: string
  header: string
  format: ReportValueFormat
}

export type ReportInsightRow = Record<string, string | number | null>

/** One calculated table: rows grouped by the first column, and totals for the whole range. */
export type ReportInsightTable = {
  key: string
  title: string
  columns: ReportInsightColumn[]
  rows: ReportInsightRow[]
  totals: Record<string, number | null>
}

/** A tab the report read, in the spreadsheet's order. */
export type ReportInsightTab = {
  gid: string
  name: string
}

/** A sheet's report for the requested dates (see specs/04-sheet-types.md). */
export type SheetReportInsight = {
  report_source_id: string
  sheet_name: string
  sheet_type: string
  sheet_type_label: string
  usd_to_inr_rate: number | null
  /** Whether the sheet type reads the Dollar rate at all. */
  uses_dollar_rate: boolean
  /** The sheet imports every tab of its spreadsheet. */
  all_tabs: boolean
  /** The tabs read; empty for a single-tab sheet. */
  tabs: ReportInsightTab[]
  last_synced_at: string | null
  last_sync_status: ReportSyncStatus | null
  rows_used: number
  tables: ReportInsightTable[]
  warnings: string[]
}

export type ReportInsights = {
  brand: ReportSourceBrand
  start_date: string
  end_date: string
  reports: SheetReportInsight[]
  /** The brand's sheets with no sheet type (or one this version no longer knows). */
  sheets_without_type: {
    report_source_id: string
    sheet_name: string
    sheet_type: string | null
  }[]
}

export const reportInsightsQueryKey = ["report-insights"] as const
export const reportInsightBrandsQueryKey = ["report-insights", "brands"] as const

type Row = Record<string, unknown>

function normalizeTabs(value: unknown): ReportInsightTab[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((tab): tab is Row => typeof tab === "object" && tab !== null)
    .map((tab) => ({ gid: String(tab.gid ?? ""), name: String(tab.name ?? "") }))
}

/** Fills in the fields an older API leaves out, so the page never reads undefined. */
function normalizeReport(report: Row): SheetReportInsight {
  const insight = report as Partial<SheetReportInsight>
  return {
    ...(insight as SheetReportInsight),
    // Before `uses_dollar_rate`, every sheet type showed the rate.
    uses_dollar_rate: report.uses_dollar_rate !== false,
    all_tabs: report.all_tabs === true,
    tabs: normalizeTabs(report.tabs),
    tables: Array.isArray(insight.tables) ? insight.tables : [],
    warnings: Array.isArray(insight.warnings) ? insight.warnings : [],
  }
}

/** Brands with at least one sheet that has a report. */
export async function fetchReportInsightBrands(): Promise<ReportSourceBrand[]> {
  const response = await apiConfig.get("/api/report-insights/brands")
  const rows: unknown = response.data?.data
  if (!Array.isArray(rows)) return []
  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    brand_name: String(row.brand_name ?? ""),
  }))
}

/**
 * A brand's reports for a date range, both ends included. The API rejects any other query
 * parameter, so only these three are sent.
 */
export async function fetchReportInsights(params: {
  brand_profile_id: string
  start_date: string
  end_date: string
}): Promise<ReportInsights> {
  const response = await apiConfig.get("/api/report-insights", {
    params: {
      brand_profile_id: params.brand_profile_id,
      start_date: params.start_date,
      end_date: params.end_date,
    },
  })
  const data = (response.data?.data ?? {}) as Partial<ReportInsights>
  return {
    brand: data.brand ?? { id: params.brand_profile_id, brand_name: "" },
    start_date: data.start_date ?? params.start_date,
    end_date: data.end_date ?? params.end_date,
    reports: Array.isArray(data.reports)
      ? data.reports
          .filter((report) => typeof report === "object" && report !== null)
          .map((report) => normalizeReport(report as unknown as Row))
      : [],
    sheets_without_type: data.sheets_without_type ?? [],
  }
}
