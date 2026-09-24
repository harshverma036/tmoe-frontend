import apiConfig from "@/lib/apiConfig"
import type {
  CreateReportSourceBody,
  PagedResult,
  ReportColumn,
  ReportRow,
  ReportRowsResult,
  ReportSource,
  ReportSourceTab,
  ReportSyncRun,
  ReportSyncStatus,
  ReportSyncTrigger,
  SyncAllResult,
  UpdateReportSourceBody,
} from "@/lib/report-source.types"

export const reportSourcesQueryKey = ["report-sources"] as const
export const reportSourceQueryKey = (id: string) =>
  ["report-sources", id] as const
/** `gid` is the tab of an all-tabs source; "" for a single-tab source (the API picks its tab). */
export const reportSourceRowsQueryKey = (
  id: string,
  gid: string,
  page: number,
  pageSize: number,
) => ["report-sources", id, "rows", gid, page, pageSize] as const
export const reportSourceRunsQueryKey = (
  id: string,
  page: number,
  pageSize: number,
) => ["report-sources", id, "runs", page, pageSize] as const

type Row = Record<string, unknown>

function str(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "")
}

function nullableStr(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null
}

function normalizeColumns(value: unknown): ReportColumn[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((c): c is Row => typeof c === "object" && c !== null)
    .map((c) => ({ key: str(c.key), header: str(c.header) }))
    .filter((c) => c.key !== "")
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value)
}

/** null unless the API sent a list: a single-tab source has no `tabs`. */
function normalizeTabs(value: unknown): ReportSourceTab[] | null {
  if (!Array.isArray(value)) return null
  return value
    .filter((t): t is Row => typeof t === "object" && t !== null)
    .map((t) => ({
      gid: str(t.gid),
      name: str(t.name),
      header_row: nullableNumber(t.header_row),
      columns: normalizeColumns(t.columns),
      row_count: Number(t.row_count ?? 0),
    }))
    .filter((t) => t.gid !== "")
}

export function normalizeReportSource(row: Row): ReportSource {
  const brand = row.brand_profile as Row | null | undefined
  return {
    id: str(row.id),
    name: str(row.name),
    sheet_url: str(row.sheet_url),
    spreadsheet_id: str(row.spreadsheet_id),
    gid: str(row.gid),
    title: nullableStr(row.title),
    header_row: nullableNumber(row.header_row),
    columns: normalizeColumns(row.columns),
    all_tabs: row.all_tabs === true,
    tabs: normalizeTabs(row.tabs),
    sync_enabled: row.sync_enabled !== false,
    last_synced_at: nullableStr(row.last_synced_at),
    last_sync_status: (row.last_sync_status ?? null) as ReportSyncStatus | null,
    last_sync_error: nullableStr(row.last_sync_error),
    row_count: Number(row.row_count ?? 0),
    usd_to_inr_rate:
      row.usd_to_inr_rate === null || row.usd_to_inr_rate === undefined
        ? null
        : Number(row.usd_to_inr_rate),
    usd_to_inr_rate_updated_at: nullableStr(row.usd_to_inr_rate_updated_at),
    brand_profile: brand
      ? { id: str(brand.id), brand_name: str(brand.brand_name) }
      : null,
    created_at: nullableStr(row.createdAt ?? row.created_at),
  }
}

function normalizeRun(row: Row): ReportSyncRun {
  const by = row.triggered_by as Row | null | undefined
  return {
    id: str(row.id),
    status: (row.status ?? "FAILED") as ReportSyncStatus,
    trigger: (row.trigger ?? "MANUAL") as ReportSyncTrigger,
    started_at: str(row.started_at),
    finished_at: nullableStr(row.finished_at),
    row_count:
      row.row_count === null || row.row_count === undefined
        ? null
        : Number(row.row_count),
    error: nullableStr(row.error),
    triggered_by: by
      ? {
          id: str(by.id),
          name: nullableStr(by.name),
          email: str(by.email),
        }
      : null,
  }
}

function normalizeRow(row: Row): ReportRow {
  const data = (row.data ?? {}) as Record<string, unknown>
  const cells: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(data)) {
    cells[key] = value === null || value === undefined ? null : String(value)
  }
  return {
    id: str(row.id),
    row_index: Number(row.row_index ?? 0),
    data: cells,
  }
}

/** The backend only paginates when `limit` is sent, so it is always included. */
function pageParams(page: number, pageSize: number) {
  return {
    limit: String(pageSize),
    skip: String((page - 1) * pageSize),
    page_number: String(page),
  }
}

function paged<T>(
  body: Record<string, unknown>,
  mapper: (row: Row) => T,
  pageSize: number,
): PagedResult<T> {
  const rows = Array.isArray(body.data) ? (body.data as Row[]) : []
  return {
    data: rows.map(mapper),
    total: Number(body.total ?? rows.length),
    page: Number(body.page ?? 1),
    pageSize: Number(body.pageSize ?? pageSize),
  }
}

export async function fetchReportSources(params?: {
  page?: number
  pageSize?: number
  brand_profile_id?: string
  search?: string
}): Promise<PagedResult<ReportSource>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const response = await apiConfig.get("/api/report-sources", {
    params: {
      ...pageParams(page, pageSize),
      brand_profile_id: params?.brand_profile_id || undefined,
      search: params?.search?.trim() || undefined,
      search_field: params?.search?.trim() ? "name" : undefined,
    },
  })
  return paged(response.data ?? {}, normalizeReportSource, pageSize)
}

export async function fetchReportSourceById(id: string): Promise<ReportSource> {
  const response = await apiConfig.get(`/api/report-sources/${id}`)
  return normalizeReportSource((response.data?.data ?? {}) as Row)
}

export async function createReportSource(
  body: CreateReportSourceBody,
): Promise<ReportSource> {
  const response = await apiConfig.post("/api/report-sources", body)
  return normalizeReportSource((response.data?.data ?? {}) as Row)
}

export async function updateReportSource(
  id: string,
  body: UpdateReportSourceBody,
): Promise<ReportSource> {
  const response = await apiConfig.patch(`/api/report-sources/${id}`, body)
  return normalizeReportSource((response.data?.data ?? {}) as Row)
}

export async function deleteReportSource(id: string): Promise<void> {
  await apiConfig.delete(`/api/report-sources/${id}`)
}

export async function syncReportSource(id: string): Promise<ReportSyncRun> {
  const response = await apiConfig.post(`/api/report-sources/${id}/sync`)
  return normalizeRun((response.data?.data ?? {}) as Row)
}

export async function syncAllReportSources(): Promise<SyncAllResult> {
  const response = await apiConfig.post("/api/report-sources/sync-all")
  const data = (response.data?.data ?? {}) as Row
  return {
    processed: Number(data.processed ?? 0),
    errors: Number(data.errors ?? 0),
    skipped: Number(data.skipped ?? 0),
  }
}

/**
 * One page of a sheet's rows. `gid` picks the tab of an all-tabs source (the API defaults to its
 * first tab); a single-tab source ignores it, so it is only sent when given.
 */
export async function fetchReportSourceRows(
  id: string,
  params: { page: number; pageSize: number; gid?: string },
): Promise<ReportRowsResult> {
  const response = await apiConfig.get(`/api/report-sources/${id}/rows`, {
    params: {
      ...pageParams(params.page, params.pageSize),
      gid: params.gid || undefined,
    },
  })
  const body = (response.data ?? {}) as Record<string, unknown>
  return {
    ...paged(body, normalizeRow, params.pageSize),
    gid: nullableStr(body.gid) ?? params.gid ?? "",
    columns: Array.isArray(body.columns) ? normalizeColumns(body.columns) : null,
  }
}

export async function fetchReportSourceRuns(
  id: string,
  params: { page: number; pageSize: number },
): Promise<PagedResult<ReportSyncRun>> {
  const response = await apiConfig.get(`/api/report-sources/${id}/runs`, {
    params: pageParams(params.page, params.pageSize),
  })
  return paged(response.data ?? {}, normalizeRun, params.pageSize)
}
