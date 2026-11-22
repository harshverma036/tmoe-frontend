"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { Plus } from "lucide-react"
import toast from "react-hot-toast"

import { CampaignListMetrics } from "@/components/campaign/campaign-list-metrics"
import { CampaignTable } from "@/components/campaign/campaign-table"
import { CampaignTableSearch } from "@/components/campaign/campaign-table-search"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { FilterTabs } from "@/components/common/FilterTabs"
import { TablePagination } from "@/components/common/TablePagination"
import { TablePanel } from "@/components/common/TablePanel"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  campaignsQueryKey,
  campaignsQueryKeyRoot,
  deleteCampaign,
  fetchCampaigns,
} from "@/lib/api/campaign"
import type { Campaign, CampaignStatus } from "@/lib/campaign.types"
import type { CampaignPublisherAssignment } from "@/lib/campaign.types"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { cn } from "@/lib/utils"
import { getUserIdFromCookie } from "@/lib/user-info-cookie"

const PUBLISHER_ASSIGNMENT_RESPONSE_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
] as const

function publisherAssignmentPending(
  campaign: {
    operational_at?: string | null
    status: string
    publishers?: CampaignPublisherAssignment[]
  },
  userId: string | null,
) {
  if (!userId || !campaign.operational_at) return false
  if (
    !PUBLISHER_ASSIGNMENT_RESPONSE_STATUSES.includes(
      campaign.status as (typeof PUBLISHER_ASSIGNMENT_RESPONSE_STATUSES)[number],
    )
  ) {
    return false
  }
  const mine = campaign.publishers?.find(
    (p) => p.publisher_profile?.user?.id === userId,
  )
  return Boolean(mine && !mine.accepted_at)
}

const PAGE_SIZE = 12

const BRIEF_FILTERS: { value: CampaignStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
]

const OPERATIONAL_FILTERS: { value: CampaignStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
]

export function CampaignListClient() {
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "ALL">(
    "ALL",
  )
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    setUserId(getUserIdFromCookie())
  }, [])

  const statusParam =
    statusFilter === "ALL" ? undefined : (statusFilter as CampaignStatus)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setSkip(0)
  }, [statusFilter, debouncedSearch])

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: campaignsQueryKey({
      status: statusParam,
      search: debouncedSearch || undefined,
      limit: PAGE_SIZE,
      skip,
    }),
    queryFn: () =>
      fetchCampaigns({
        status: statusParam,
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        skip,
      }),
    enabled:
      isReady &&
      !!role &&
      (role === UserRole.ADMIN ||
        role === UserRole.BRAND ||
        role === UserRole.PUBLISHER),
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const hasMore = skip + items.length < total

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

  const filterChips =
    role === UserRole.PUBLISHER ? OPERATIONAL_FILTERS : BRIEF_FILTERS
  const showOperationalFilters = role === UserRole.ADMIN

  const filterTabs = useMemo(() => {
    const chips = showOperationalFilters
      ? [
          ...BRIEF_FILTERS,
          ...OPERATIONAL_FILTERS.filter(
            (f) => f.value !== "ALL" && f.value !== "DRAFT",
          ),
        ]
      : filterChips

    return chips.map((chip) => ({
      value: chip.value,
      label: chip.label,
      count: statusFilter === chip.value ? total : undefined,
    }))
  }, [showOperationalFilters, filterChips, statusFilter, total])

  const assignmentPendingById = useMemo(() => {
    if (role !== UserRole.PUBLISHER) return {}
    return Object.fromEntries(
      items.map((campaign) => [
        campaign.id,
        publisherAssignmentPending(campaign, userId),
      ]),
    )
  }, [items, role, userId])

  if (!isReady || !role) {
    return <LoadingSkeleton variant="card-grid" cardCount={6} />
  }

  if (
    role !== UserRole.ADMIN &&
    role !== UserRole.BRAND &&
    role !== UserRole.PUBLISHER
  ) {
    return null
  }

  const pageTitle =
    role === UserRole.BRAND
      ? "Campaigns"
      : role === UserRole.PUBLISHER
        ? "My Campaigns"
        : "Campaigns"

  const pageDescription =
    role === UserRole.BRAND
      ? "Draft a brief, refine the details, and send it for admin review when you are ready."
      : role === UserRole.PUBLISHER
        ? "Review assignments, accept campaigns, and track status."
        : "Review briefs, create campaigns, assign publishers, and manage lifecycle."

  const breadcrumbLabel =
    role === UserRole.ADMIN
      ? "TMOE Admin"
      : role === UserRole.BRAND
        ? "Brand Studio"
        : "Publisher Studio"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            {breadcrumbLabel} <span className="mx-1.5">/</span> Campaigns
          </>
        }
        title={pageTitle}
        description={pageDescription}
        actions={
          <>
            {role === UserRole.BRAND ? (
              <Button
                asChild
                size="sm"
                className="h-9 gap-2 rounded-xl px-4 shadow-none"
              >
                <Link href="/campaign/new">
                  <Plus className="size-4" />
                  New Campaign Brief
                </Link>
              </Button>
            ) : null}
            {role === UserRole.ADMIN ? (
              <Button
                asChild
                size="sm"
                className="h-9 gap-2 rounded-xl px-4 shadow-none"
              >
                <Link href="/campaign/admin/new">
                  <Plus className="size-4" />
                  Create campaign
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <CampaignListMetrics items={items} total={total} role={role} />

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

      {!isError && isFetching && !items.length ? (
        <LoadingSkeleton variant="card-grid" cardCount={4} />
      ) : !isError && !items.length && !isFetching ? (
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
      ) : !isError ? (
        <TablePanel
          toolbar={
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <FilterTabs
                tabs={filterTabs}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              <CampaignTableSearch
                value={search}
                onChange={setSearch}
                placeholder="Search by brief name…"
              />
            </div>
          }
          footer={
            <TablePagination
              showingFrom={total === 0 ? 0 : skip + 1}
              showingTo={skip + items.length}
              total={total}
              hasPrevious={skip > 0}
              hasNext={hasMore}
              isLoading={isFetching}
              onPrevious={() =>
                setSkip((current) => Math.max(0, current - PAGE_SIZE))
              }
              onNext={() => setSkip((current) => current + PAGE_SIZE)}
            />
          }
        >
          <CampaignTable
            items={items}
            role={role}
            isLoading={isFetching}
            assignmentPendingById={assignmentPendingById}
            onDelete={
              role === UserRole.BRAND || role === UserRole.ADMIN
                ? (campaign) => setDeleteTarget(campaign)
                : undefined
            }
          />
        </TablePanel>
      ) : null}

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
