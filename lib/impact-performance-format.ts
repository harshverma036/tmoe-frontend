import type { ImpactDayPerformanceRow } from "@/lib/api/insights"

/** Impact.com reports in USD; the Dashboard and the Reports page show it the same way. */
export function formatImpactInt(n: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(n))
}

export function formatImpactMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatImpactPct(rate: number) {
  return `${(rate * 100).toFixed(2)}%`
}

export function formatImpactRate(n: number) {
  return n.toFixed(4)
}

export type ImpactDayDisplayRow = {
  id: string
  date_display: string
  clicks: string
  actions: string
  sale_amount: string
  total_earnings: string
  epa: string
  epc: string
  conversion_rate: string
  aov: string
}

export function toImpactDayDisplay(row: ImpactDayPerformanceRow): ImpactDayDisplayRow {
  return {
    id: row.date || row.date_display,
    date_display: row.date_display,
    clicks: formatImpactInt(row.clicks),
    actions: formatImpactInt(row.actions),
    sale_amount: formatImpactMoney(row.sale_amount),
    total_earnings: formatImpactMoney(row.total_earnings),
    epa: formatImpactRate(row.epa),
    epc: formatImpactRate(row.epc),
    conversion_rate: formatImpactPct(row.conversion_rate),
    aov: formatImpactMoney(row.aov),
  }
}

export const IMPACT_DAY_COLUMNS = [
  { accessorKey: "date_display", header: "Date" },
  { accessorKey: "clicks", header: "Clicks" },
  { accessorKey: "actions", header: "Actions" },
  { accessorKey: "sale_amount", header: "Sale amount" },
  { accessorKey: "total_earnings", header: "Total earnings" },
  { accessorKey: "epa", header: "EPA" },
  { accessorKey: "epc", header: "EPC" },
  { accessorKey: "conversion_rate", header: "CR" },
  { accessorKey: "aov", header: "AOV" },
]
