/** Outcome of one sync attempt. `UNCHANGED` means the sheet was byte-identical to last time. */
export type ReportSyncStatus = "SUCCESS" | "UNCHANGED" | "FAILED"

export type ReportSyncTrigger = "MANUAL" | "SCHEDULED"

/** One sheet column: `key` is the normalised header, `header` is what the sheet actually says. */
export type ReportColumn = {
  key: string
  header: string
}

export type ReportSourceBrand = {
  id: string
  brand_name: string
}

/** One tab of an all-tabs source, as its last successful import found it. */
export type ReportSourceTab = {
  gid: string
  name: string
  /** The header row the importer used for this tab; null for an empty tab. */
  header_row: number | null
  columns: ReportColumn[]
  row_count: number
}

export type ReportSource = {
  id: string
  name: string
  sheet_url: string
  spreadsheet_id: string
  /** The tab the pasted URL pointed at. For an all-tabs source, only that. */
  gid: string
  title: string | null
  header_row: number | null
  /** An all-tabs source's are the first tab with rows; each tab's own are in `tabs`. */
  columns: ReportColumn[]
  /** true = every tab of the spreadsheet is imported on each sync, including tabs added later. */
  all_tabs: boolean
  /** All-tabs sources only, in the spreadsheet's tab order; null for a single-tab source. */
  tabs: ReportSourceTab[] | null
  sync_enabled: boolean
  last_synced_at: string | null
  last_sync_status: ReportSyncStatus | null
  last_sync_error: string | null
  row_count: number
  /** Rupees per US dollar for this sheet's dollar amounts; null until an admin sets it. */
  usd_to_inr_rate: number | null
  usd_to_inr_rate_updated_at: string | null
  brand_profile: ReportSourceBrand | null
  created_at: string | null
}

export type ReportSyncRun = {
  id: string
  status: ReportSyncStatus
  trigger: ReportSyncTrigger
  started_at: string
  finished_at: string | null
  row_count: number | null
  error: string | null
  triggered_by: { id: string; name: string | null; email: string } | null
}

/** Values are the strings the sheet exported; nothing is coerced on import. */
export type ReportRow = {
  id: string
  row_index: number
  data: Record<string, string | null>
}

export type PagedResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** A page of one tab's rows, with that tab's columns so the headings always match the data. */
export type ReportRowsResult = PagedResult<ReportRow> & {
  /** The tab shown. */
  gid: string
  /** null when the API sent none; the caller falls back to the tab's or the sheet's columns. */
  columns: ReportColumn[] | null
}

export type CreateReportSourceBody = {
  sheet_url: string
  brand_profile_id: string
  name?: string
  /** Import every tab of the spreadsheet, not just the one in the URL. */
  all_tabs?: boolean
}

export type UpdateReportSourceBody = {
  name?: string
  sync_enabled?: boolean
  /** Settings only: the next sync re-imports with the new mode. */
  all_tabs?: boolean
  /** null puts the header row back to auto-detect. */
  header_row?: number | null
  brand_profile_id?: string
  /** null clears the rate. */
  usd_to_inr_rate?: number | null
}

export type SyncAllResult = {
  processed: number
  errors: number
  skipped: number
}

type BadgeVariant = "success" | "info" | "danger" | "muted"

export const REPORT_SYNC_STATUS_BADGE: Record<
  ReportSyncStatus | "NEVER",
  { label: string; variant: BadgeVariant }
> = {
  SUCCESS: { label: "Synced", variant: "success" },
  UNCHANGED: { label: "Up to date", variant: "info" },
  FAILED: { label: "Failed", variant: "danger" },
  NEVER: { label: "Never synced", variant: "muted" },
}

export function reportSyncBadge(status: ReportSyncStatus | null | undefined) {
  return REPORT_SYNC_STATUS_BADGE[status ?? "NEVER"]
}
