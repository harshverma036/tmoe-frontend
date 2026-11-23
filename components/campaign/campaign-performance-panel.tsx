"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  BarChart3,
  BedDouble,
  Clock,
  FileChartColumn,
  RefreshCw,
  Upload,
} from "lucide-react"

import {
  AGODA_BASIS_HELP,
  AGODA_BASIS_TABS,
  AgodaReportBody,
} from "@/components/agoda/agoda-report-body"
import {
  campaignPresetRange,
  campaignRange,
  CampaignRangeFilter,
  type CampaignRangePreset,
} from "@/components/campaign/campaign-range-filter"
import { FilterTabs } from "@/components/common/FilterTabs"
import { ImpactProgramReport } from "@/components/reports/impact-program-report"
import {
  ErrorCard,
  SheetReport,
  UntypedSheets,
} from "@/components/reports/sheet-report"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { AgodaBookingsParams, AgodaDateBasis } from "@/lib/api/agoda"
import {
  campaignPerformanceQueryKey,
  fetchCampaignAgodaBookings,
  fetchCampaignAgodaReport,
  fetchCampaignImpact,
  fetchCampaignPerformance,
  fetchCampaignSheetReports,
  type CampaignPerformance,
} from "@/lib/api/campaign-performance"
import type { Campaign } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"
import type { ReportDateRange } from "@/lib/report-date-range"

type Props = {
  campaign: Campaign
  role: UserRole | string | null
  /** Leave out the Agoda bookings tab (the brand Reports page shows it as its own report). */
  hideAgoda?: boolean
}

type Section = "content" | "agoda" | "impact"

const ALL_SITES = "all"

/**
 * A campaign's live results. Admins and the campaign's brand see every report its brand has
 * (content traffic from its sheets, Agoda bookings, Impact.com); publishers see the notice.
 */
export function CampaignPerformancePanel({ campaign, role, hideAgoda = false }: Props) {
  const canSeeReports = role === UserRole.ADMIN || role === UserRole.BRAND
  if (!canSeeReports) return <PendingPerformance campaign={campaign} />
  return (
    <LivePerformance
      campaign={campaign}
      isAdmin={role === UserRole.ADMIN}
      hideAgoda={hideAgoda}
    />
  )
}

function LivePerformance({
  campaign,
  isAdmin,
  hideAgoda,
}: {
  campaign: Campaign
  isAdmin: boolean
  hideAgoda: boolean
}) {
  const overviewQuery = useQuery({
    queryKey: campaignPerformanceQueryKey(campaign.id),
    queryFn: () => fetchCampaignPerformance(campaign.id),
    // A new sync or import should show up as soon as the tab opens.
    staleTime: 0,
  })
  const overview = overviewQuery.data

  if (overviewQuery.isError && !overview) {
    return (
      <ErrorCard
        title="Could not load performance"
        message={apiMessage(overviewQuery.error, "Check your connection and try again.")}
        onRetry={() => overviewQuery.refetch()}
      />
    )
  }
  if (!overview) return <LoadingSkeleton className="h-64 w-full" />

  const sections = availableSections(overview, hideAgoda)
  if (sections.length === 0) {
    return (
      <PendingPerformance
        campaign={campaign}
        adminHint={
          isAdmin ? (
            <>
              No report is linked to {overview.brand.brand_name || "this brand"}{" "}
              yet. Add one of its sheets on{" "}
              <Link href="/report-sources" className="underline underline-offset-4">
                Report Sources
              </Link>{" "}
              and it will show here.
            </>
          ) : null
        }
      />
    )
  }

  return (
    <PerformanceReports
      campaign={campaign}
      overview={overview}
      sections={sections}
      isAdmin={isAdmin}
      onRefreshOverview={() => overviewQuery.refetch()}
    />
  )
}

function availableSections(overview: CampaignPerformance, hideAgoda: boolean) {
  const sections: { value: Section; label: string }[] = []
  if (overview.sheet_reports > 0)
    sections.push({ value: "content", label: "Content performance" })
  if (overview.agoda && !hideAgoda) sections.push({ value: "agoda", label: "Agoda bookings" })
  if (overview.impact) sections.push({ value: "impact", label: "Impact.com" })
  return sections
}

const SECTION_HELP: Record<Section, string> = {
  content:
    "Pageviews, uniques, clicks and CTR for the campaign's articles, by publisher, country, month and article.",
  agoda:
    "Hotel bookings and commission from Agoda Partners: bookings, value, status, where guests stay and every booking. Amounts in USD.",
  impact: "Clicks, actions and revenue from the brand's Impact.com program.",
}

function PerformanceReports({
  campaign,
  overview,
  sections,
  isAdmin,
  onRefreshOverview,
}: {
  campaign: Campaign
  overview: CampaignPerformance
  sections: { value: Section; label: string }[]
  isAdmin: boolean
  onRefreshOverview: () => void
}) {
  const campaignId = campaign.id
  const campaignDates = campaignRange(
    overview.campaign.start_date,
    overview.campaign.end_date,
  )
  const [preset, setPreset] = useState<CampaignRangePreset>(
    campaignDates ? "campaign" : "last_30_days",
  )
  const [range, setRange] = useState<ReportDateRange>(() =>
    campaignPresetRange(campaignDates ? "campaign" : "last_30_days", campaignDates),
  )
  const [picked, setPicked] = useState<Section>(sections[0].value)
  // A section that went away (a sheet removed) falls back to the first one.
  const section = sections.some((s) => s.value === picked)
    ? picked
    : sections[0].value

  // Kept here, not in the sections, so switching sections or dates keeps each choice.
  const [selectedTables, setSelectedTables] = useState<Record<string, string>>({})
  const [basis, setBasis] = useState<AgodaDateBasis>("booking")
  const [siteId, setSiteId] = useState(ALL_SITES)

  const agodaMeta = overview.agoda
  const agodaParams = {
    ...range,
    date_basis: basis,
    site_id: siteId === ALL_SITES ? undefined : siteId,
  }

  const sheetsQuery = useQuery({
    queryKey: [
      ...campaignPerformanceQueryKey(campaignId),
      "sheets",
      range.start_date,
      range.end_date,
    ],
    queryFn: () =>
      fetchCampaignSheetReports(campaignId, overview.brand.id, range),
    enabled: section === "content",
    staleTime: 0,
  })
  const agodaQuery = useQuery({
    queryKey: [...campaignPerformanceQueryKey(campaignId), "agoda", agodaParams],
    queryFn: () => fetchCampaignAgodaReport(campaignId, agodaParams),
    enabled: section === "agoda" && (agodaMeta?.total_bookings ?? 0) > 0,
    keepPreviousData: true,
    staleTime: 0,
  })
  const impactQuery = useQuery({
    queryKey: [
      ...campaignPerformanceQueryKey(campaignId),
      "impact",
      range.start_date,
      range.end_date,
    ],
    queryFn: () => fetchCampaignImpact(campaignId, range),
    enabled: section === "impact",
  })

  const activeQuery =
    section === "content" ? sheetsQuery : section === "agoda" ? agodaQuery : impactQuery
  const isFetching = activeQuery.isFetching

  let body: React.ReactNode
  if (section === "content") {
    const insights = sheetsQuery.data
    if (sheetsQuery.isError) {
      body = (
        <ErrorCard
          title="Could not load the content report"
          message={apiMessage(sheetsQuery.error, "Check your connection and try again.")}
          onRetry={() => sheetsQuery.refetch()}
        />
      )
    } else if (!insights) {
      body = <LoadingSkeleton className="h-64 w-full" />
    } else {
      body = (
        <>
          {insights.reports.map((report) => (
            <SheetReport
              key={report.report_source_id}
              report={report}
              range={{ start_date: insights.start_date, end_date: insights.end_date }}
              selectedTableKey={selectedTables[report.report_source_id]}
              onSelectTable={(key) =>
                setSelectedTables((prev) => ({
                  ...prev,
                  [report.report_source_id]: key,
                }))
              }
              showAdminLinks={isAdmin}
            />
          ))}
          {isAdmin ? <UntypedSheets sheets={insights.sheets_without_type} /> : null}
        </>
      )
    }
  } else if (section === "agoda") {
    const report = agodaQuery.data
    if (!agodaMeta || agodaMeta.total_bookings === 0) {
      body = (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No Agoda bookings yet</CardTitle>
            <CardDescription>
              Bookings appear here once the Booking Received export from Agoda
              Partners is imported.
            </CardDescription>
            {isAdmin ? (
              <Button asChild className="mt-2 w-fit gap-2">
                <Link href="/agoda/import">
                  <Upload className="size-4" /> Import a CSV
                </Link>
              </Button>
            ) : null}
          </CardHeader>
        </Card>
      )
    } else if (agodaQuery.isError) {
      body = (
        <ErrorCard
          title="Could not load the Agoda report"
          message={apiMessage(agodaQuery.error, "Check your connection and try again.")}
          onRetry={() => agodaQuery.refetch()}
        />
      )
    } else if (!report) {
      body = <LoadingSkeleton className="h-96 w-full" />
    } else {
      body = (
        <AgodaReportBody
          report={report}
          countries={agodaMeta.destination_countries}
          fetchBookings={(params: AgodaBookingsParams) =>
            fetchCampaignAgodaBookings(campaignId, params)
          }
          scopeKey={`campaign:${campaignId}`}
        />
      )
    }
  } else {
    const impact = impactQuery.data
    const program = overview.impact
    if (impactQuery.isError) {
      body = (
        <ErrorCard
          title="Could not load Impact.com performance"
          message={apiMessage(impactQuery.error, "Impact.com API request failed.")}
          onRetry={() => impactQuery.refetch()}
        />
      )
    } else if (!impact || !program) {
      body = <LoadingSkeleton className="h-64 w-full" />
    } else {
      body = (
        <ImpactProgramReport
          key={`${program.program_id}-${impact.start_date}-${impact.end_date}`}
          programId={program.program_id}
          programName={program.program_name}
          data={impact}
          rangeLabel={formatRange(impact.start_date, impact.end_date)}
          isFetching={impactQuery.isFetching}
        />
      )
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="py-4">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Live performance</p>
              <p className="text-xs text-muted-foreground">
                {overview.brand.brand_name ? `${overview.brand.brand_name} · ` : ""}
                Showing {formatRange(range.start_date, range.end_date)}
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <CampaignRangeFilter
                value={range}
                onChange={setRange}
                preset={preset}
                onPresetChange={setPreset}
                campaignDates={campaignDates}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  onRefreshOverview()
                  activeQuery.refetch()
                }}
                disabled={isFetching}
              >
                <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {sections.length > 1 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <FilterTabs
                tabs={sections}
                value={section}
                onChange={setPicked}
                label="Report"
              />
              <p className="text-xs text-muted-foreground">{SECTION_HELP[section]}</p>
            </div>
          ) : (
            <p className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <SectionIcon section={section} />
              {SECTION_HELP[section]}
            </p>
          )}

          {section === "agoda" && agodaMeta && agodaMeta.total_bookings > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border pt-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-agoda-site">Site</Label>
                  <Select value={siteId} onValueChange={setSiteId}>
                    <SelectTrigger id="campaign-agoda-site" className="h-9 w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_SITES}>All sites</SelectItem>
                      {agodaMeta.sites.map((site) => (
                        <SelectItem key={site.site_id} value={site.site_id}>
                          {site.site_name} ({site.site_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span
                    className="block text-sm font-medium"
                    id="campaign-agoda-basis-label"
                  >
                    Dates are
                  </span>
                  <FilterTabs
                    tabs={AGODA_BASIS_TABS}
                    value={basis}
                    onChange={setBasis}
                    labelledBy="campaign-agoda-basis-label"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {AGODA_BASIS_HELP[basis]} {formatInt(agodaMeta.total_bookings)}{" "}
                bookings imported in all, booked{" "}
                {formatDate(agodaMeta.first_booking_date)} –{" "}
                {formatDate(agodaMeta.last_booking_date)}.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {body}

      <CampaignEstimates campaign={campaign} />
    </div>
  )
}

function SectionIcon({ section }: { section: Section }) {
  const Icon =
    section === "agoda" ? BedDouble : section === "impact" ? BarChart3 : FileChartColumn
  return <Icon className="size-3.5 shrink-0" aria-hidden />
}

/** For publishers, and for campaigns whose brand has no report yet. */
function PendingPerformance({
  campaign,
  adminHint,
}: {
  campaign: Campaign
  adminHint?: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-amber-600" aria-hidden />
            <CardTitle className="text-base">Performance data pending</CardTitle>
          </div>
          <CardDescription>
            Distribution partner integration is in progress. Live traffic, clicks,
            orders, and GMV will appear here once connected. Campaign execution and
            status updates continue as normal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {adminHint ??
              "Distribution is coordinated by the TMOE ops team outside the platform until partner APIs are connected (Scenario B). No manual data entry is required."}
          </p>
        </CardContent>
      </Card>
      <CampaignEstimates campaign={campaign} />
    </div>
  )
}

/** The estimates set when the campaign was planned, to read the reports against. */
function CampaignEstimates({ campaign }: { campaign: Campaign }) {
  if (campaign.est_gmv == null) return null
  const items: { label: string; value: string }[] = [
    { label: "Traffic", value: numberOrDash(campaign.est_traffic) },
    { label: "Clicks", value: numberOrDash(campaign.est_clicks) },
    { label: "Orders", value: numberOrDash(campaign.est_orders) },
    { label: "GMV", value: numberOrDash(campaign.est_gmv, "$") },
    {
      label: "ROI",
      value:
        campaign.est_roi != null
          ? `${(Math.round(campaign.est_roi * 1000) / 10).toLocaleString()}%`
          : "—",
    },
  ]
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4" aria-hidden />
          <CardTitle className="text-base">Campaign estimates</CardTitle>
        </div>
        <CardDescription>
          What the campaign was planned to deliver, from its setup.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border p-4">
              <dt className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {item.label}
              </dt>
              <dd className="mt-2 text-lg font-semibold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

function numberOrDash(value: number | null | undefined, prefix = "") {
  return value != null ? `${prefix}${value.toLocaleString()}` : "—"
}
