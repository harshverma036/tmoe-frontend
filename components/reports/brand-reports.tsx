"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { AgodaBookingsReport } from "@/components/agoda/agoda-bookings-report"
import { CampaignPerformancePanel } from "@/components/campaign/campaign-performance-panel"
import { FilterTabs } from "@/components/common/FilterTabs"
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
import { apiMessage, formatDate, formatInt, formatRange } from "@/lib/agoda-format"
import type { AgodaBookingsParams, AgodaReportParams } from "@/lib/api/agoda"
import {
  brandReportScopeQueryKey,
  fetchBrandReportScope,
} from "@/lib/api/brand-report-scope"
import { campaignQueryKey, fetchCampaignById } from "@/lib/api/campaign"
import {
  campaignPerformanceQueryKey,
  fetchCampaignAgodaBookings,
  fetchCampaignAgodaReport,
  fetchCampaignPerformance,
} from "@/lib/api/campaign-performance"
import { UserRole } from "@/lib/dashboard-nav"

type BrandReport = "content" | "agoda"

const REPORT_TABS: { value: BrandReport; label: string }[] = [
  { value: "content", label: "Content performance" },
  { value: "agoda", label: "Agoda bookings" },
]

/**
 * Agoda's bookings dashboard, the same one admins see, read through the brand's campaign (the
 * campaign endpoints check the campaign is this brand's).
 */
function BrandAgodaReport({ campaignId }: { campaignId: string }) {
  const overviewQuery = useQuery({
    queryKey: campaignPerformanceQueryKey(campaignId),
    queryFn: () => fetchCampaignPerformance(campaignId),
    staleTime: 0,
  })
  return (
    <AgodaBookingsReport
      meta={overviewQuery.data ? overviewQuery.data.agoda : undefined}
      metaError={overviewQuery.isError ? overviewQuery.error : null}
      onRefetchMeta={() => overviewQuery.refetch()}
      fetchReport={(params: AgodaReportParams) =>
        fetchCampaignAgodaReport(campaignId, params)
      }
      fetchBookings={(params: AgodaBookingsParams) =>
        fetchCampaignAgodaBookings(campaignId, params)
      }
      queryKey={[...campaignPerformanceQueryKey(campaignId), "agoda-dashboard"]}
      scopeKey={`campaign:${campaignId}`}
      canImport={false}
    />
  )
}

/**
 * A brand's Reports page: the Performance report of one of its campaigns (content pageviews and
 * uniques from its sheets, Impact.com), opening on the newest campaign and its own dates. Agoda
 * also gets its bookings dashboard as a second report.
 */
export function BrandReports() {
  const scopeQuery = useQuery({
    queryKey: brandReportScopeQueryKey,
    queryFn: fetchBrandReportScope,
    staleTime: 0,
  })
  const scope = scopeQuery.data
  const campaigns = scope?.campaigns ?? []

  const [pickedReport, setPickedReport] = useState<BrandReport>("content")
  const report: BrandReport = scope?.is_agoda ? pickedReport : "content"

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
  } else if (report === "agoda") {
    body = <BrandAgodaReport campaignId={campaignId} />
  } else if (!campaignQuery.data) {
    body = <LoadingSkeleton className="h-64 w-full" />
  } else {
    // Keyed by campaign, so picking another one starts on that campaign's dates.
    body = (
      <CampaignPerformancePanel
        key={campaignQuery.data.id}
        campaign={campaignQuery.data}
        role={UserRole.BRAND}
        hideAgoda={scope?.is_agoda}
      />
    )
  }

  // Shares its cache with the Agoda report's own lookup.
  const overviewQuery = useQuery({
    queryKey: campaignPerformanceQueryKey(campaignId ?? ""),
    queryFn: () => fetchCampaignPerformance(campaignId as string),
    enabled: report === "agoda" && campaignId !== null,
    staleTime: 0,
  })
  const agodaMeta = overviewQuery.data?.agoda

  const dates =
    picked?.start_date && picked.end_date
      ? ` · ${formatRange(picked.start_date, picked.end_date)}`
      : ""
  const description =
    report === "agoda"
      ? agodaMeta && agodaMeta.total_bookings > 0
        ? `${formatInt(agodaMeta.total_bookings)} bookings, booked ${formatDate(agodaMeta.first_booking_date)} – ${formatDate(agodaMeta.last_booking_date)}. Bookings, value, commission and where guests stay. All amounts in USD.`
        : "Hotel bookings and commission from Agoda Partners. All amounts in USD."
      : picked
        ? `${picked.name}${dates}. Pageviews, uniques, clicks and CTR for your campaign's articles.`
        : "Your campaigns' performance."

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description={description}
        actions={
          report === "content" && campaigns.length > 1 ? (
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
      {scope?.is_agoda && campaignId !== null ? (
        <FilterTabs
          tabs={REPORT_TABS}
          value={report}
          onChange={setPickedReport}
          label="Report"
          className="-mt-2 border-b border-border pb-3"
        />
      ) : null}
      {body}
    </div>
  )
}
