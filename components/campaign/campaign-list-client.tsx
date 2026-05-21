"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Megaphone, Search } from "lucide-react"
import toast from "react-hot-toast"

import { CampaignCard } from "@/components/campaign/campaign-card"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  campaignsQueryKey,
  campaignsQueryKeyRoot,
  deleteCampaign,
  fetchCampaigns,
} from "@/lib/api/campaign"
import type { Campaign, CampaignStatus } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 12

const FILTER_CHIPS: { value: CampaignStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

function matchesSearch(c: Campaign, q: string) {
  if (!q.trim()) return true
  const s = q.trim().toLowerCase()
  return (
    c.name.toLowerCase().includes(s) ||
    c.target_market.toLowerCase().includes(s) ||
    c.target_category.some((x) => x.toLowerCase().includes(s)) ||
    c.product_skus.some((x) => x.toLowerCase().includes(s))
  )
}

export function CampaignListClient() {
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">(
    "ALL",
  )
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)

  const statusParam =
    statusFilter === "ALL" ? undefined : (statusFilter as CampaignStatus)

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: campaignsQueryKey({
      status: statusParam,
      limit: PAGE_SIZE,
      skip,
    }),
    queryFn: () =>
      fetchCampaigns({
        status: statusParam,
        limit: PAGE_SIZE,
        skip,
      }),
    enabled:
      isReady &&
      !!role &&
      (role === UserRole.ADMIN || role === UserRole.BRAND),
    keepPreviousData: true,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = skip + items.length < total

  const filtered = useMemo(
    () => items.filter((c) => matchesSearch(c, search)),
    [items, search],
  )

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignsQueryKeyRoot })
      toast.success("Campaign deleted")
      setDeleteTarget(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not delete campaign")
    },
  })

  if (!isReady || !role) {
    return <LoadingSkeleton variant="card-grid" cardCount={6} />
  }

  if (role !== UserRole.ADMIN && role !== UserRole.BRAND) {
    return null
  }

  return (
    <div className="animate-in fade-in-0 duration-500 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="size-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Campaign studio
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {role === UserRole.BRAND
              ? "Shape your next launch"
              : "Review brand briefs"}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {role === UserRole.BRAND
              ? "Draft a brief, refine the details, and send it for admin review when you are ready."
              : "Open any card to read the full brief and approve or reject campaigns in review."}
          </p>
        </div>
        {role === UserRole.BRAND ? (
          <Button asChild size="lg" className="shrink-0 shadow-sm">
            <Link href="/campaign/new">New Campaign Brief</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => (
            <Button
              key={chip.value}
              type="button"
              size="sm"
              variant={statusFilter === chip.value ? "default" : "outline"}
              className={cn(
                "rounded-full transition-transform duration-200",
                statusFilter === chip.value && "shadow-sm",
              )}
              onClick={() => {
                setStatusFilter(chip.value)
                setSkip(0)
              }}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, market, categories…"
            className="pl-9"
            aria-label="Search campaigns"
          />
        </div>
      </div>

      {isError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">
              Could not load campaigns
            </CardTitle>
            <CardDescription>
              Check your connection and try again.
            </CardDescription>
            <Button
              className="mt-2 w-fit"
              variant="outline"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </CardHeader>
        </Card>
      ) : null}

      {isFetching && !items.length ? (
        <LoadingSkeleton variant="card-grid" cardCount={6} />
      ) : !filtered.length && !isFetching ? (
        <Card
          className={cn(
            "overflow-hidden border-dashed",
            "animate-in fade-in-0 zoom-in-95 fill-mode-both duration-500",
          )}
        >
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">No campaigns yet</CardTitle>
            <CardDescription>
              {role === UserRole.BRAND
                ? "Start your first brief — you can save drafts and submit when it feels right."
                : "No campaigns match this filter."}
            </CardDescription>
            {role === UserRole.BRAND ? (
              <Button asChild className="mt-2 w-fit">
                <Link href="/campaign/new">New Campaign Brief</Link>
              </Button>
            ) : null}
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c, i) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                index={i}
                role={role}
                onDelete={
                  c.status === "DRAFT" &&
                  (role === UserRole.BRAND || role === UserRole.ADMIN)
                    ? () => setDeleteTarget(c)
                    : undefined
                }
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
            <p className="text-muted-foreground text-xs tabular-nums">
              Showing {skip + 1}–{skip + items.length} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={skip === 0 || isFetching}
                onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasMore || isFetching}
                onClick={() => setSkip((s) => s + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this draft?"
        description={
          deleteTarget ? (
            <span>
              Permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.name}
              </span>
              . This cannot be undone.
            </span>
          ) : null
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={removeMutation.isPending}
        pendingLabel="Deleting…"
        onConfirm={() => {
          if (deleteTarget) removeMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}
