"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Search } from "lucide-react"
import toast from "react-hot-toast"

import { CampaignAeoSection } from "@/components/campaign/campaign-aeo-section"
import { MarketplaceCampaignCard } from "@/components/campaign/marketplace-campaign-card"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { TablePagination } from "@/components/common/TablePagination"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  applyToCampaign,
  fetchMarketplaceCampaignById,
  fetchMarketplaceCampaigns,
  marketplaceQueryKeyRoot,
} from "@/lib/api/campaign"
import type { MarketplaceCampaign } from "@/lib/campaign.types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const PAGE_SIZE = 12

export function CampaignMarketplaceClient() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [applyTarget, setApplyTarget] = useState<MarketplaceCampaign | null>(null)
  const [applyNote, setApplyNote] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)

  const skip = (page - 1) * PAGE_SIZE

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      ...marketplaceQueryKeyRoot,
      { search, limit: PAGE_SIZE, skip },
    ],
    queryFn: () =>
      fetchMarketplaceCampaigns({
        search: search || undefined,
        limit: PAGE_SIZE,
        skip,
      }),
  })

  const { data: detailCampaign, isLoading: detailLoading } = useQuery({
    queryKey: ["campaign-marketplace-detail", detailId],
    queryFn: () => fetchMarketplaceCampaignById(detailId!),
    enabled: Boolean(detailId),
  })

  const applyMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      applyToCampaign(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeyRoot })
      if (detailId) {
        queryClient.invalidateQueries({
          queryKey: ["campaign-marketplace-detail", detailId],
        })
      }
      toast.success("Application submitted")
      setApplyTarget(null)
      setApplyNote("")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not submit application")
    },
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = skip + items.length < total

  const detailFromList = useMemo(
    () => items.find((c) => c.id === detailId),
    [items, detailId],
  )

  const activeDetail = detailCampaign ?? detailFromList

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function canApply(campaign: MarketplaceCampaign) {
    const status = campaign.my_application?.status
    return !status || status === "REJECTED"
  }

  function applicationBadge(campaign: MarketplaceCampaign) {
    const status = campaign.my_application?.status
    if (!status) return null
    if (status === "PENDING") return "Pending review"
    if (status === "APPROVED") return "Approved"
    if (status === "REJECTED") return "Declined"
    return null
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campaign Marketplace"
        description="Browse live, unassigned campaigns and apply to participate."
      />

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label htmlFor="marketplace-search">Search</Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              id="marketplace-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Campaign name…"
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading ? <LoadingSkeleton variant="default" /> : null}

      {isError ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle>Could not load marketplace</CardTitle>
            <CardDescription>Please try again in a moment.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!isLoading && !isError && items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No open campaigns</CardTitle>
            <CardDescription>
              There are no live, unassigned campaigns matching your search right
              now. Check back later or try a different name.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((campaign, index) => (
              <MarketplaceCampaignCard
                key={campaign.id}
                campaign={campaign}
                index={index}
                applicationLabel={applicationBadge(campaign)}
                onViewDetails={() => setDetailId(campaign.id)}
                onApply={
                  canApply(campaign)
                    ? () => setApplyTarget(campaign)
                    : undefined
                }
              />
            ))}
          </div>
          {total > PAGE_SIZE ? (
            <TablePagination
              showingFrom={total === 0 ? 0 : skip + 1}
              showingTo={skip + items.length}
              total={total}
              hasPrevious={page > 1}
              hasNext={hasMore}
              onPrevious={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          ) : null}
        </>
      ) : null}

      <Dialog open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailLoading && !activeDetail ? "Loading…" : activeDetail?.name}
            </DialogTitle>
            <DialogDescription>
              {activeDetail?.brand_profile?.brand_name
                ? `Brand: ${activeDetail.brand_profile.brand_name}`
                : "Campaign details"}
            </DialogDescription>
          </DialogHeader>
          {detailLoading && !activeDetail ? (
            <LoadingSkeleton variant="default" />
          ) : activeDetail ? (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="text-muted-foreground">Market:</span>
                <span className="font-medium">{activeDetail.target_market}</span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Categories</p>
                <p>{activeDetail.target_category.join(", ") || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Budget</p>
                <p className="tabular-nums font-medium">
                  ${activeDetail.content_budget?.toLocaleString() ??
                    activeDetail.budget_min.toLocaleString()}{" "}
                  – $
                  {(activeDetail.distribution_budget ??
                    activeDetail.budget_max).toLocaleString()}
                </p>
              </div>
              {activeDetail.description ? (
                <div>
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="whitespace-pre-wrap">{activeDetail.description}</p>
                </div>
              ) : null}
              <CampaignAeoSection campaign={activeDetail} />
              {canApply(activeDetail) ? (
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setApplyTarget(activeDetail)
                    setDetailId(null)
                  }}
                >
                  Apply for this campaign
                </Button>
              ) : applicationBadge(activeDetail) ? (
                <p className="text-muted-foreground text-center text-sm">
                  Application status: {applicationBadge(activeDetail)}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(applyTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setApplyTarget(null)
            setApplyNote("")
          }
        }}
        title="Apply for campaign"
        description={
          applyTarget
            ? `Submit your application for "${applyTarget.name}". TMOE admin will review and onboard you if approved.`
            : ""
        }
        confirmLabel="Submit application"
        isPending={applyMutation.isPending}
        onConfirm={() => {
          if (!applyTarget) return
          applyMutation.mutate({ id: applyTarget.id, note: applyNote })
        }}
      >
        <div className="space-y-2 pt-2">
          <Label htmlFor="apply-note">Message to admin (optional)</Label>
          <Textarea
            id="apply-note"
            value={applyNote}
            onChange={(e) => setApplyNote(e.target.value)}
            placeholder="Why you're a good fit, relevant inventory, etc."
            rows={3}
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
