"use client"

import { format, parseISO } from "date-fns"
import { Globe, Loader2, MoreVertical } from "lucide-react"
import Link from "next/link"

import {
  campaignProgressVariant,
  campaignStatusLabel,
  campaignStatusVariant,
  campaignTimelineProgress,
  formatCompactNumber,
  formatCurrency,
} from "@/components/campaign/campaign-status-utils"
import { ProgressBar } from "@/components/common/ProgressBar"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Campaign } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

function shortDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "MMM d")
  } catch {
    return iso
  }
}

function campaignSubtitle(campaign: Campaign) {
  const parts: string[] = []
  if (campaign.start_date) {
    parts.push(`Started ${shortDate(campaign.start_date)}`)
  } else if (campaign.created_at) {
    parts.push(`Created ${shortDate(campaign.created_at)}`)
  }
  if (campaign.target_market) {
    parts.push(campaign.target_market)
  }
  return parts.join(" · ") || "—"
}

function spendLabel(campaign: Campaign) {
  if (campaign.content_budget != null && campaign.distribution_budget != null) {
    const spent = campaign.content_budget + campaign.distribution_budget
    return `${formatCurrency(spent)} allocated`
  }
  return `${formatCurrency(campaign.budget_min)} – ${formatCurrency(campaign.budget_max)}`
}

export type CampaignTableProps = {
  items: Campaign[]
  role: UserRole
  isLoading?: boolean
  assignmentPendingById?: Record<string, boolean>
  onDelete?: (campaign: Campaign) => void
}

export function CampaignTable({
  items,
  role,
  isLoading = false,
  assignmentPendingById = {},
  onDelete,
}: CampaignTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/70 hover:bg-transparent">
          <TableHead className="pl-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Campaign
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Pubs
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Status
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Pace
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Spend
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            ROAS
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Reach
          </TableHead>
          <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Deadline
          </TableHead>
          <TableHead className="pr-5 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && !items.length ? (
          <TableRow>
            <TableCell colSpan={9} className="h-32 text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading campaigns…
              </div>
            </TableCell>
          </TableRow>
        ) : !items.length ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-32 text-center text-muted-foreground"
            >
              No campaigns found.
            </TableCell>
          </TableRow>
        ) : (
          items.map((campaign) => {
            const publisherCount = campaign.publishers?.length ?? 0
            const progress = campaignTimelineProgress(
              campaign.start_date,
              campaign.end_date,
            )
            const canBrandEdit =
              role === UserRole.BRAND &&
              (campaign.status === "DRAFT" || campaign.status === "REJECTED")
            const canDelete =
              campaign.status === "DRAFT" &&
              (role === UserRole.BRAND || role === UserRole.ADMIN) &&
              Boolean(onDelete)
            const showMenu = canDelete
            const assignmentPending = assignmentPendingById[campaign.id]

            return (
              <TableRow
                key={campaign.id}
                className="border-border/60 hover:bg-muted/20"
              >
                <TableCell className="max-w-[240px] pl-5">
                  <Link
                    href={`/campaign/${campaign.id}`}
                    className="group block min-w-0"
                  >
                    <p className="truncate font-medium text-foreground group-hover:text-primary">
                      {campaign.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {campaignSubtitle(campaign)}
                    </p>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Globe className="size-3.5 shrink-0" aria-hidden />
                    <span className="tabular-nums">{publisherCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge
                      label={campaignStatusLabel(campaign.status)}
                      variant={campaignStatusVariant(campaign.status)}
                    />
                    {assignmentPending ? (
                      <StatusBadge label="Action required" variant="warning" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  {progress != null ? (
                    <ProgressBar
                      value={progress}
                      variant={campaignProgressVariant(campaign.status)}
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {spendLabel(campaign)}
                </TableCell>
                <TableCell>
                  {campaign.est_roi != null ? (
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        campaign.status === "ACTIVE"
                          ? "text-primary"
                          : "text-foreground",
                      )}
                    >
                      {campaign.est_roi.toFixed(2)}x
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {campaign.est_traffic != null
                    ? formatCompactNumber(campaign.est_traffic)
                    : "—"}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                  {campaign.end_date
                    ? shortDate(campaign.end_date)
                    : campaign.status === "DRAFT"
                      ? "Brief in progress"
                      : "—"}
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-lg px-2.5 text-xs"
                    >
                      <Link href={`/campaign/${campaign.id}`}>Open</Link>
                    </Button>
                    {showMenu ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Campaign actions"
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                          {canBrandEdit ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/campaign/${campaign.id}`}>
                                Edit brief
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {canDelete ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => onDelete?.(campaign)}
                            >
                              Delete draft
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )
}
