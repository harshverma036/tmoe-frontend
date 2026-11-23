"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { CampaignPerformancePanel } from "@/components/campaign/campaign-performance-panel"
import { PageHeader } from "@/components/layout/page-header"
import { ErrorCard } from "@/components/reports/sheet-report"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiMessage, formatRange } from "@/lib/agoda-format"
import {
  brandReportScopeQueryKey,
  fetchBrandReportScope,
} from "@/lib/api/brand-report-scope"
import { campaignQueryKey, fetchCampaignById } from "@/lib/api/campaign"
import { UserRole } from "@/lib/dashboard-nav"

/**
 * A brand's Reports page: the Performance report of one of its campaigns (content pageviews and
 * uniques from its sheets, Agoda bookings for Agoda, Impact.com), opening on the newest campaign
 * and its own dates.
 */
export function BrandReports() {
  const scopeQuery = useQuery({
    queryKey: brandReportScopeQueryKey,
    queryFn: fetchBrandReportScope,
    staleTime: 0,
  })
  const scope = scopeQuery.data
  const campaigns = scope?.campaigns ?? []

  const [pickedId, setPickedId] = useState<string | null>(null)
  const campaignId =
    pickedId && campaigns.some((c) => c.id === pickedId)
      ? pickedId
      : (campaigns[0]?.id ?? null)
  const picked = campaigns.find((c) => c.id === campaignId) ?? null

  const campaignQuery = useQuery({
    queryKey: campaignQueryKey(campaignId ?? ""),
    queryFn: () => fetchCampaignById(campaignId as string),
    enabled: campaignId !== null,
  })

  let body: React.ReactNode
  if (scopeQuery.isError) {
    body = (
      <ErrorCard
        title="Could not load your reports"
        message={apiMessage(scopeQuery.error, "Check your connection and try again.")}
        onRetry={() => scopeQuery.refetch()}
      />
    )
  } else if (!scopeQuery.isSuccess) {
    body = <LoadingSkeleton className="h-64 w-full" />
  } else if (campaignId === null) {
    body = (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">No reports yet</CardTitle>
          <CardDescription>
            Reports appear here once one of your campaigns is running.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  } else if (campaignQuery.isError) {
    body = (
      <ErrorCard
        title="Could not load the campaign"
        message={apiMessage(campaignQuery.error, "Check your connection and try again.")}
        onRetry={() => campaignQuery.refetch()}
      />
    )
  } else if (!campaignQuery.data) {
    body = <LoadingSkeleton className="h-64 w-full" />
  } else {
    // Keyed by campaign, so picking another one starts on that campaign's dates.
    body = (
      <CampaignPerformancePanel
        key={campaignQuery.data.id}
        campaign={campaignQuery.data}
        role={UserRole.BRAND}
      />
    )
  }

  const dates =
    picked?.start_date && picked.end_date
      ? ` · ${formatRange(picked.start_date, picked.end_date)}`
      : ""

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description={
          picked
            ? `${picked.name}${dates}. Pageviews, uniques, clicks and CTR for your campaign's articles${scope?.is_agoda ? ", plus Agoda bookings" : ""}.`
            : "Your campaigns' performance."
        }
        actions={
          campaigns.length > 1 ? (
            <div className="space-y-1.5">
              <Label htmlFor="brand-report-campaign">Campaign</Label>
              <Select value={campaignId ?? undefined} onValueChange={setPickedId}>
                <SelectTrigger id="brand-report-campaign" className="h-9 w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null
        }
      />
      {body}
    </div>
  )
}
