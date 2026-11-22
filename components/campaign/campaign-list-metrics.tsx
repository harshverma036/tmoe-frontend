import { MetricCard } from "@/components/common/MetricCard"
import type { Campaign } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"

import {
  formatCompactNumber,
  formatCurrency,
} from "@/components/campaign/campaign-status-utils"

type CampaignListMetricsProps = {
  items: Campaign[]
  total: number
  role: UserRole
}

function countByStatus(items: Campaign[], status: Campaign["status"]) {
  return items.filter((item) => item.status === status).length
}

export function CampaignListMetrics({
  items,
  total,
  role,
}: CampaignListMetricsProps) {
  const totalBudgetMax = items.reduce((sum, item) => sum + item.budget_max, 0)
  const totalEstGmv = items.reduce((sum, item) => sum + (item.est_gmv ?? 0), 0)
  const totalPublishers = items.reduce(
    (sum, item) => sum + (item.publishers?.length ?? 0),
    0,
  )
  const activeOnPage = countByStatus(items, "ACTIVE")
  const reviewOnPage = countByStatus(items, "UNDER_REVIEW")
  const draftOnPage = countByStatus(items, "DRAFT")

  if (role === UserRole.PUBLISHER) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Assigned campaigns"
          value={total}
          sublabel="matching filters"
        />
        <MetricCard
          label="Live on page"
          value={activeOnPage}
          sublabel="active campaigns"
          trendVariant="positive"
          trend={activeOnPage > 0 ? "currently running" : undefined}
        />
        <MetricCard
          label="Est. reach"
          value={totalEstGmv > 0 ? formatCompactNumber(totalEstGmv) : "—"}
          sublabel="estimated GMV on page"
        />
        <MetricCard
          label="Paused"
          value={countByStatus(items, "PAUSED")}
          sublabel="on this page"
        />
      </div>
    )
  }

  if (role === UserRole.BRAND) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total briefs"
          value={total}
          sublabel="matching filters"
        />
        <MetricCard
          label="In review"
          value={reviewOnPage}
          sublabel="on this page"
          trendVariant="default"
          trend={reviewOnPage > 0 ? "awaiting admin review" : undefined}
        />
        <MetricCard
          label="Budget (page)"
          value={totalBudgetMax > 0 ? formatCurrency(totalBudgetMax) : "—"}
          sublabel="max budget on page"
        />
        <MetricCard
          label="Drafts"
          value={draftOnPage}
          sublabel="on this page"
        />
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Total campaigns"
        value={total}
        sublabel="matching filters"
      />
      <MetricCard
        label="Live on page"
        value={activeOnPage}
        sublabel="active campaigns"
        trendVariant="positive"
        trend={activeOnPage > 0 ? "currently running" : undefined}
      />
      <MetricCard
        label="Publishers"
        value={totalPublishers}
        sublabel="assigned on page"
      />
      <MetricCard
        label="Est. GMV"
        value={totalEstGmv > 0 ? formatCurrency(totalEstGmv) : "—"}
        sublabel="on this page"
      />
    </div>
  )
}
