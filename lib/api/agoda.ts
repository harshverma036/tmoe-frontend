import apiConfig from "@/lib/apiConfig"

/** Which date a range filters on, as on Agoda's own Booking Report. */
export type AgodaDateBasis = "booking" | "checkout" | "payment"
export type AgodaInterval = "day" | "week" | "month"
export type AgodaStatusGroup =
  | "pending"
  | "confirmed"
  | "charged"
  | "departed"
  | "cancelled"
  | "other"

/** Figures for any set of bookings: the range, a day, a site, a country… All money is USD. */
export type AgodaMetrics = {
  /** Every booking received, cancelled ones included (Agoda's "Booking Received"). */
  bookings: number
  cancelled: number
  departed: number
  /** Bookings not cancelled. */
  active: number
  /** 0–1 */
  cancellation_rate: number
  booking_value_usd: number
  avg_booking_value_usd: number
  /** Commission Agoda has finalized (its "Affiliate Commission"). */
  finalized_commission_usd: number
  /** Agoda's estimate for live bookings whose commission is not final yet. */
  pending_commission_usd: number
}

type Named = AgodaMetrics & { name: string }

export type AgodaReport = {
  start_date: string
  end_date: string
  date_basis: AgodaDateBasis
  site_id: string | null
  interval: AgodaInterval
  summary: AgodaMetrics
  previous: { start_date: string; end_date: string; summary: AgodaMetrics }
  series: (AgodaMetrics & { period: string })[]
  by_status: (AgodaMetrics & { status: string; group: AgodaStatusGroup })[]
  by_site: (AgodaMetrics & { site_id: string; site_name: string })[]
  by_destination_country: Named[]
  by_destination_city: (Named & { country: string | null })[]
  by_origin_country: Named[]
  by_device: Named[]
  by_dmc: Named[]
  by_payment_month: (AgodaMetrics & { month: string | null })[]
  top_properties: (Named & { city: string | null })[]
}

export type AgodaMeta = {
  total_bookings: number
  first_booking_date: string | null
  last_booking_date: string | null
  last_import: { id: string; file_name: string; created_at: string } | null
  sites: { site_id: string; site_name: string; bookings: number }[]
  destination_countries: { name: string; bookings: number }[]
}

export type AgodaBooking = {
  booking_id: string
  site_id: string
  site_name: string
  property_id: string | null
  property_name: string
  origin_country: string | null
  destination_city: string | null
  destination_country: string | null
  booking_date: string
  check_in_date: string | null
  check_out_date: string | null
  payment_month: string | null
  dmc: string | null
  device: string | null
  booking_value_usd: number
  commission_rate: number | null
  finalized_commission_usd: number | null
  estimated_commission_usd: number | null
  status: string
  status_group: AgodaStatusGroup
  updated_at: string
}

export type AgodaBookingSort =
  | "booking_date"
  | "check_out_date"
  | "booking_value"
  | "commission"

export type AgodaReportParams = {
  start_date: string
  end_date: string
  date_basis: AgodaDateBasis
  /** Empty or undefined = all sites. */
  site_id?: string
}

export type AgodaBookingsParams = AgodaReportParams & {
  status?: AgodaStatusGroup
  destination_country?: string
  search?: string
  sort?: AgodaBookingSort
  order?: "asc" | "desc"
  page: number
  limit: number
}

export type Paged<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

/** What importing a file did (or would do, for a preview). */
export type AgodaImportSummary = {
  id?: string
  created_at?: string
  file_name: string
  row_count: number
  created_count: number
  updated_count: number
  unchanged_count: number
  skipped_count: number
  warnings: string[]
  booking_date_from: string | null
  booking_date_to: string | null
  booking_value_usd: string
  finalized_commission_usd: string
  file_totals: {
    booking_value_usd: string | null
    finalized_commission_usd: string | null
  } | null
  /** Whether the sums agree with the export's own Total line; null when the file has none. */
  totals_match: boolean | null
  status_changes: { from: string; to: string; count: number }[]
  newly_finalized: number
  sites: { site_id: string; site_name: string; bookings: number }[]
}

export type AgodaImportRecord = {
  id: string
  file_name: string
  row_count: number
  created_count: number
  updated_count: number
  unchanged_count: number
  skipped_count: number
  warnings: string[]
  booking_date_from: string | null
  booking_date_to: string | null
  booking_value_usd: number
  finalized_commission_usd: number
  imported_by: { id: string; name: string | null; email: string } | null
  created_at: string
}

export const agodaQueryKeys = {
  all: ["agoda"] as const,
  meta: ["agoda", "meta"] as const,
  report: ["agoda", "report"] as const,
  bookings: ["agoda", "bookings"] as const,
  imports: ["agoda", "imports"] as const,
}

/** Drops empty values: the API rejects unknown or blank parameters. */
function clean<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== ""
    )
  )
}

export async function fetchAgodaMeta(): Promise<AgodaMeta> {
  const response = await apiConfig.get("/api/agoda/meta")
  return response.data.data as AgodaMeta
}

export async function fetchAgodaReport(
  params: AgodaReportParams
): Promise<AgodaReport> {
  const response = await apiConfig.get("/api/agoda/report", {
    params: clean(params),
  })
  return response.data.data as AgodaReport
}

export async function fetchAgodaBookings(
  params: AgodaBookingsParams
): Promise<Paged<AgodaBooking>> {
  const response = await apiConfig.get("/api/agoda/bookings", {
    params: clean(params),
  })
  return response.data.data as Paged<AgodaBooking>
}

export async function fetchAgodaImports(
  page = 1,
  limit = 20
): Promise<Paged<AgodaImportRecord>> {
  const response = await apiConfig.get("/api/agoda/imports", {
    params: { page, limit },
  })
  return response.data.data as Paged<AgodaImportRecord>
}

function csvForm(file: File) {
  const form = new FormData()
  form.append("file", file)
  return form
}

/** Reads the file on the server and says what importing it would do; saves nothing. */
export async function previewAgodaImport(
  file: File
): Promise<AgodaImportSummary> {
  const response = await apiConfig.post(
    "/api/agoda/imports/preview",
    csvForm(file)
  )
  return response.data.data as AgodaImportSummary
}

export async function importAgodaFile(file: File): Promise<AgodaImportSummary> {
  const response = await apiConfig.post("/api/agoda/imports", csvForm(file))
  return response.data.data as AgodaImportSummary
}
