"use client"

import { format, parseISO } from "date-fns"
import { ArrowUpRight, MoreVertical } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Campaign, CampaignStatus } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

function shortDate(iso: string | null | undefined) {
  if (!iso) return "—"
  try {
    return format(parseISO(iso), "MMM d, yyyy")
  } catch {
    return iso
  }
}

function statusBadgeVariant(
  status: CampaignStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "APPROVED":
      return "secondary"
    case "UNDER_REVIEW":
      return "default"
    case "REJECTED":
      return "destructive"
    default:
      return "outline"
  }
}

function statusLabel(status: CampaignStatus) {
  switch (status) {
    case "UNDER_REVIEW":
      return "Under review"
    default:
      return status.charAt(0) + status.slice(1).toLowerCase()
  }
}

export type CampaignCardProps = {
  campaign: Campaign
  index: number
  role: UserRole
  onEdit?: () => void
  onDelete?: () => void
}

export function CampaignCard({
  campaign,
  index,
  role,
  onEdit,
  onDelete,
}: CampaignCardProps) {
  const canBrandEdit =
    role === UserRole.BRAND &&
    (campaign.status === "DRAFT" || campaign.status === "REJECTED")
  const showMenu =
    (canBrandEdit && (onEdit || onDelete)) ||
    (role === UserRole.ADMIN && onDelete)

  const delayMs = Math.min(index, 12) * 70

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
          className={cn(
            "w-1.5 shrink-0 bg-linear-to-b",
            campaign.status === "APPROVED" &&
              "from-emerald-500/90 to-emerald-400/40",
            campaign.status === "REJECTED" && "from-destructive to-destructive/50",
            campaign.status === "UNDER_REVIEW" &&
              "from-primary/90 to-primary/45",
            campaign.status === "DRAFT" && "from-muted-foreground/70 to-muted-foreground/30",
          )}
          aria-hidden
        />
        <CardHeader className="min-w-0 flex-1 space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <Badge
                variant={statusBadgeVariant(campaign.status)}
                className="font-normal"
              >
                {statusLabel(campaign.status)}
              </Badge>
              <Badge variant="outline" className="font-normal tabular-nums">
                {campaign.target_market}
              </Badge>
            </div>
            {showMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Campaign actions"
                  >
                    <MoreVertical className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  {canBrandEdit && onEdit ? (
                    <DropdownMenuItem onSelect={() => onEdit()}>
                      Edit brief
                    </DropdownMenuItem>
                  ) : null}
                  {onDelete &&
                  campaign.status === "DRAFT" &&
                  role === UserRole.BRAND ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete()}
                    >
                      Delete draft
                    </DropdownMenuItem>
                  ) : null}
                  {onDelete &&
                  role === UserRole.ADMIN &&
                  campaign.status === "DRAFT" ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => onDelete()}
                    >
                      Delete draft
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <CardTitle className="line-clamp-2 text-lg leading-snug font-semibold tracking-tight">
            {campaign.name}
          </CardTitle>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground font-medium">Budget</span>
            <span className="tabular-nums font-semibold text-foreground">
              ${campaign.budget_min.toLocaleString()} – $
              {campaign.budget_max.toLocaleString()}
            </span>
          </div>

          <p className="text-muted-foreground text-[11px] leading-relaxed tabular-nums">
            <span className="font-medium text-foreground/80">Updated</span>{" "}
            {shortDate(campaign.updated_at ?? campaign.created_at)}
          </p>

          <Button
            asChild
            variant="secondary"
            size="sm"
            className="w-full justify-center gap-1.5 sm:w-auto"
          >
            <Link href={`/campaign/${campaign.id}`}>
              Open
              <ArrowUpRight className="size-3.5 opacity-80" aria-hidden />
            </Link>
          </Button>
        </CardHeader>
      </div>
    </Card>
  )
}
