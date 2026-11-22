"use client"

import { format, parseISO } from "date-fns"
import { ArrowUpRight } from "lucide-react"

import { CampaignAeoSection } from "@/components/campaign/campaign-aeo-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { MarketplaceCampaign } from "@/lib/campaign.types"
import { cn } from "@/lib/utils"

function shortDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "MMM d, yyyy")
  } catch {
    return iso
  }
}

export type MarketplaceCampaignCardProps = {
  campaign: MarketplaceCampaign
  index: number
  applicationLabel?: string | null
  onViewDetails?: () => void
  onApply?: () => void
}

export function MarketplaceCampaignCard({
  campaign,
  index,
  applicationLabel,
  onViewDetails,
  onApply,
}: MarketplaceCampaignCardProps) {
  const delayMs = Math.min(index, 12) * 70
  const budgetMin = campaign.content_budget ?? campaign.budget_min
  const budgetMax = campaign.distribution_budget ?? campaign.budget_max

  return (
    <Card
      size="sm"
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        "gap-0 overflow-hidden border-border/80 py-0",
        "shadow-md shadow-black/6 ring-1 ring-black/4 dark:shadow-black/25 dark:ring-white/6",
        "transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40",
        "animate-in fade-in-0 slide-in-from-bottom-4 fill-mode-both duration-500",
      )}
    >
      <div className="flex">
        <div
          className="w-1.5 shrink-0 bg-linear-to-b from-primary/90 to-primary/45"
          aria-hidden
        />
        <CardHeader className="min-w-0 flex-1 space-y-3 p-4">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <Badge variant="default" className="font-normal">
              Live
            </Badge>
            <Badge variant="outline" className="font-normal tabular-nums">
              {campaign.target_market}
            </Badge>
            {applicationLabel ? (
              <Badge
                variant={
                  applicationLabel === "Approved"
                    ? "secondary"
                    : applicationLabel === "Declined"
                      ? "destructive"
                      : "outline"
                }
                className="font-normal"
              >
                {applicationLabel}
              </Badge>
            ) : null}
          </div>

          <CardTitle className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight">
            {campaign.name}
          </CardTitle>

          {campaign.brand_profile ? (
            <p className="text-muted-foreground text-sm">
              {campaign.brand_profile.brand_name}
            </p>
          ) : null}

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground font-medium">Budget</span>
            <span className="tabular-nums font-semibold text-foreground">
              ${budgetMin.toLocaleString()} – ${budgetMax.toLocaleString()}
            </span>
          </div>

          <CampaignAeoSection campaign={campaign} compact />

          <p className="text-muted-foreground text-[11px] leading-relaxed tabular-nums">
            <span className="font-medium text-foreground/80">Posted</span>{" "}
            {shortDate(campaign.start_date ?? campaign.updated_at ?? campaign.created_at)}
          </p>

          <div className="flex flex-wrap gap-2">
            {onViewDetails ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={onViewDetails}
              >
                Details
                <ArrowUpRight className="size-3.5 opacity-80" aria-hidden />
              </Button>
            ) : null}
            {onApply ? (
              <Button type="button" size="sm" onClick={onApply}>
                Apply
              </Button>
            ) : null}
          </div>
        </CardHeader>
      </div>
    </Card>
  )
}
