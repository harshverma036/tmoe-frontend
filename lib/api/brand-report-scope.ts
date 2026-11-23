import apiConfig from "@/lib/apiConfig"

/** A campaign of the signed-in brand that has a Performance report. Dates are `YYYY-MM-DD`. */
export type BrandReportCampaign = {
  id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
}

/** What the signed-in brand reports on (GET /api/report-insights/me). */
export type BrandReportScope = {
  brand: { id: string; brand_name: string }
  /** The brand is Agoda: its account shows the Agoda logo and bookings. */
  is_agoda: boolean
  sheet_reports: number
  /** Newest first. */
  campaigns: BrandReportCampaign[]
}

export const BRAND_REPORT_SCOPE_PATH = "/api/report-insights/me"

export const brandReportScopeQueryKey = ["report-insights", "me"] as const

type Row = Record<string, unknown>

const optionalDay = (value: unknown) =>
  typeof value === "string" && value !== "" ? value : null

export function normalizeBrandReportScope(payload: unknown): BrandReportScope | null {
  const data = (payload ?? null) as Row | null
  const brand = data?.brand as Row | undefined
  if (!data || !brand) return null
  const campaigns = Array.isArray(data.campaigns) ? (data.campaigns as Row[]) : []
  return {
    brand: { id: String(brand.id ?? ""), brand_name: String(brand.brand_name ?? "") },
    is_agoda: data.is_agoda === true,
    sheet_reports: Number(data.sheet_reports ?? 0),
    campaigns: campaigns.map((c) => ({
      id: String(c.id ?? ""),
      name: String(c.name ?? ""),
      status: String(c.status ?? ""),
      start_date: optionalDay(c.start_date),
      end_date: optionalDay(c.end_date),
    })),
  }
}

export async function fetchBrandReportScope(): Promise<BrandReportScope | null> {
  const response = await apiConfig.get(BRAND_REPORT_SCOPE_PATH)
  return normalizeBrandReportScope(response.data?.data)
}
