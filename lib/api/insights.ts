import apiConfig from "@/lib/apiConfig"

export type ImpactBrandPerformanceRow = {
  program: string
  program_id: string
  impressions: number
  clicks: number
  actions: number
  sale_amount: number
  action_earnings: number
  click_cost: number
  other_earnings: number
  total_earnings: number
  epa: number
  epc: number
  conversion_rate: number
  aov: number
}

export type ImpactDayPerformanceRow = {
  date: string
  date_display: string
  impressions: number
  clicks: number
  actions: number
  sale_amount: number
  action_earnings: number
  click_cost: number
  other_earnings: number
  total_earnings: number
  epa: number
  epc: number
  conversion_rate: number
  aov: number
}

export type ImpactPerformanceSummary = {
  clicks: number
  actions: number
  sale_amount: number
  total_earnings: number
  programs: number
  conversion_rate: number
}

export type ImpactPerformanceData = {
  start_date: string
  end_date: string
  summary: ImpactPerformanceSummary
  by_brand: ImpactBrandPerformanceRow[]
  by_day: ImpactDayPerformanceRow[]
}

export const impactPerformanceQueryKey = ["insights", "impact-performance"] as const

export async function fetchImpactPerformance(params?: {
  start_date?: string
  end_date?: string
  program_id?: string
}): Promise<ImpactPerformanceData> {
  const response = await apiConfig.get("/api/insights/impact-performance", {
    params,
  })
  return response.data?.data as ImpactPerformanceData
}
