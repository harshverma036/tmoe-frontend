import type { CampaignStatus } from "@/lib/campaign.types"

export function campaignStatusLabel(status: CampaignStatus): string {
  switch (status) {
    case "UNDER_REVIEW":
      return "In review"
    case "ACTIVE":
      return "Live"
    default:
      return status.charAt(0) + status.slice(1).toLowerCase()
  }
}

export function campaignStatusVariant(
  status: CampaignStatus,
): "success" | "warning" | "info" | "danger" | "muted" | "default" {
  switch (status) {
    case "ACTIVE":
    case "APPROVED":
    case "COMPLETED":
      return status === "COMPLETED" ? "info" : "success"
    case "UNDER_REVIEW":
      return "warning"
    case "PAUSED":
      return "danger"
    case "REJECTED":
    case "CANCELLED":
      return "danger"
    case "DRAFT":
      return "muted"
    default:
      return "default"
  }
}

export function campaignProgressVariant(
  status: CampaignStatus,
): "success" | "warning" | "info" | "danger" | "muted" {
  switch (status) {
    case "ACTIVE":
      return "success"
    case "UNDER_REVIEW":
      return "warning"
    case "COMPLETED":
      return "info"
    case "PAUSED":
    case "REJECTED":
    case "CANCELLED":
      return "danger"
    default:
      return "muted"
  }
}

export function campaignTimelineProgress(
  startDate?: string | null,
  endDate?: string | null,
): number | null {
  if (!startDate || !endDate) return null
  const start = Date.parse(startDate)
  const end = Date.parse(endDate)
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null
  const now = Date.now()
  const ratio = ((now - start) / (end - start)) * 100
  return Math.round(Math.min(Math.max(ratio, 0), 100))
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.?0+$/, "")}K`
  }
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatCurrency(value: number): string {
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return `$${value.toLocaleString("en-US")}`
}
