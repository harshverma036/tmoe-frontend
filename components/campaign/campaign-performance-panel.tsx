"use client"

import { BarChart3, Clock } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Campaign } from "@/lib/campaign.types"

type Props = {
  campaign: Campaign
}

export function CampaignPerformancePanel({ campaign }: Props) {
  const hasEstimates = campaign.est_gmv != null

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
            Distribution is coordinated by the TMOE ops team outside the platform
            until partner APIs are connected (Scenario B). No manual data entry is
            required.
          </p>
        </CardContent>
      </Card>

      {hasEstimates ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4" aria-hidden />
              <CardTitle className="text-base">Estimated vs actual</CardTitle>
            </div>
            <CardDescription>
              Estimates from campaign setup; actuals will sync from distribution
              partners when available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCompare
                label="Traffic"
                estimated={campaign.est_traffic}
                actualLabel="Pending"
              />
              <MetricCompare
                label="Clicks"
                estimated={campaign.est_clicks}
                actualLabel="Pending"
              />
              <MetricCompare
                label="Orders"
                estimated={campaign.est_orders}
                actualLabel="Pending"
              />
              <MetricCompare
                label="GMV"
                estimated={campaign.est_gmv}
                prefix="$"
                actualLabel="Pending"
              />
              <MetricCompare
                label="ROI"
                estimated={
                  campaign.est_roi != null
                    ? Math.round(campaign.est_roi * 1000) / 10
                    : null
                }
                suffix="%"
                actualLabel="Pending"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function MetricCompare({
  label,
  estimated,
  actualLabel,
  prefix = "",
  suffix = "",
}: {
  label: string
  estimated: number | null | undefined
  actualLabel: string
  prefix?: string
  suffix?: string
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
        {label}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Estimated</p>
          <p className="font-medium tabular-nums">
            {estimated != null
              ? `${prefix}${estimated.toLocaleString()}${suffix}`
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Actual</p>
          <Badge variant="outline">{actualLabel}</Badge>
        </div>
      </div>
    </div>
  )
}
