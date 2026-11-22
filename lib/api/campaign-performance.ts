import apiConfig from "@/lib/apiConfig"
import type {
  AgodaBooking,
  AgodaBookingsParams,
  AgodaMeta,
  AgodaReport,
  AgodaReportParams,
  Paged,
} from "@/lib/api/agoda"
import type { ImpactPerformanceData } from "@/lib/api/insights"
import {
  normalizeReportInsights,
  type ReportInsights,
} from "@/lib/api/report-insights"
import type { ReportDateRange } from "@/lib/report-date-range"

/** Which reports a campaign has: its brand's sheets, Impact.com program and Agoda bookings. */
export type CampaignPerformance = {
  campaign: {
    id: string
    name: string
    /** `YYYY-MM-DD`, or null when the campaign has no dates. */
    start_date: string | null
    end_date: string | null
  }
  brand: { id: string; brand_name: string }
  /** How many of the brand's sheets have a report. */
  sheet_reports: number
  impact: { program_id: string; program_name: string | null } | null
  /** Agoda Partners data coverage; null when the brand is not Agoda. */
  agoda: AgodaMeta | null
}

export const campaignPerformanceQueryKey = (campaignId: string) =>
  ["campaign-performance", campaignId] as const

/** Drops empty values: the API rejects blank parameters. */
function clean<T extends Record<string, unknown>>(params: T) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  )
}

const base = (campaignId: string) => `/api/campaign/${campaignId}/performance`

export async function fetchCampaignPerformance(
  campaignId: string,
): Promise<CampaignPerformance> {
  const response = await apiConfig.get(base(campaignId))
  const data = response.data?.data as Partial<CampaignPerformance> | undefined
  return {
    campaign: data?.campaign ?? {
      id: campaignId,
      name: "",
      start_date: null,
      end_date: null,
    },
    brand: data?.brand ?? { id: "", brand_name: "" },
    sheet_reports: data?.sheet_reports ?? 0,
    impact: data?.impact ?? null,
    agoda: data?.agoda ?? null,
  }
}

export async function fetchCampaignSheetReports(
  campaignId: string,
  brandProfileId: string,
  range: ReportDateRange,
): Promise<ReportInsights> {
  const response = await apiConfig.get(`${base(campaignId)}/sheets`, {
    params: { start_date: range.start_date, end_date: range.end_date },
  })
  return normalizeReportInsights(response.data?.data, {
    brand_profile_id: brandProfileId,
    ...range,
  })
}

export async function fetchCampaignImpact(
  campaignId: string,
  range: ReportDateRange,
): Promise<ImpactPerformanceData> {
  const response = await apiConfig.get(`${base(campaignId)}/impact`, {
    params: { start_date: range.start_date, end_date: range.end_date },
  })
  return response.data?.data as ImpactPerformanceData
}

export async function fetchCampaignAgodaReport(
  campaignId: string,
  params: AgodaReportParams,
): Promise<AgodaReport> {
  const response = await apiConfig.get(`${base(campaignId)}/agoda/report`, {
    params: clean(params),
  })
  return response.data.data as AgodaReport
}

export async function fetchCampaignAgodaBookings(
  campaignId: string,
  params: AgodaBookingsParams,
): Promise<Paged<AgodaBooking>> {
  const response = await apiConfig.get(`${base(campaignId)}/agoda/bookings`, {
    params: clean(params),
  })
  return response.data.data as Paged<AgodaBooking>
}
