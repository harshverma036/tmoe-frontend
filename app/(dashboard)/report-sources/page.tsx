"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import {
  ExternalLink,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import DataTable from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/layout/page-header"
import { AddReportSourceDialog } from "@/components/report-sources/add-report-source-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDataTableState } from "@/hooks/use-data-table-state"
import {
  fetchPromoteLinkBrands,
  promoteLinkBrandsQueryKey,
} from "@/lib/api/promote-links"
import {
  deleteReportSource,
  fetchReportSources,
  reportSourcesQueryKey,
  syncAllReportSources,
  syncReportSource,
  updateReportSource,
} from "@/lib/api/report-sources"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { reportSyncBadge, type ReportSource } from "@/lib/report-source.types"

function formatDate(value: string | null) {
  if (!value) return "—"
  try {
    return format(new Date(value), "dd MMM yyyy, HH:mm")
  } catch {
    return value
  }
}

function apiMessage(error: unknown, fallback: string) {
  const message = (error as AxiosError<{ message?: string | string[] }>)
    .response?.data?.message
  return (Array.isArray(message) ? message[0] : message) ?? fallback
}

export default function ReportSourcesPage() {
  const { role, isReady } = useDashboardUserRole()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { pagination, setPagination, query, setQuery, resetToFirstPage } =
    useDataTableState()
  const [brandFilter, setBrandFilter] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<ReportSource | null>(null)

  // Search runs server-side, so wait for a pause in typing before refetching.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  const page = pagination.pageIndex + 1
  const pageSize = pagination.pageSize
  const isAdmin = isReady && role === UserRole.ADMIN

  const { data: brands = [] } = useQuery({
    queryKey: promoteLinkBrandsQueryKey,
    queryFn: fetchPromoteLinkBrands,
    enabled: isAdmin,
  })

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [
      ...reportSourcesQueryKey,
      page,
      pageSize,
      brandFilter,
      debouncedQuery,
    ],
    queryFn: () =>
      fetchReportSources({
        page,
        pageSize,
        brand_profile_id: brandFilter || undefined,
        search: debouncedQuery,
      }),
    enabled: isAdmin,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: reportSourcesQueryKey })

  const syncOne = useMutation({
    mutationFn: (id: string) => syncReportSource(id),
    onSuccess: (run) => {
      invalidate()
      toast.success(
        run.status === "UNCHANGED"
          ? "Sheet has not changed since the last sync"
          : `Synced ${run.row_count ?? 0} rows`,
      )
    },
    onError: (error) => toast.error(apiMessage(error, "Could not sync sheet")),
  })

  const syncAll = useMutation({
    mutationFn: syncAllReportSources,
    onSuccess: (result) => {
      invalidate()
      toast.success(
        result.errors > 0
          ? `Synced ${result.processed} sheets, ${result.errors} failed`
          : `Synced ${result.processed} sheets`,
      )
    },
    onError: (error) => toast.error(apiMessage(error, "Could not sync sheets")),
  })

  const toggleSync = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateReportSource(id, { sync_enabled: enabled }),
    onSuccess: (source) => {
      invalidate()
      toast.success(
        source.sync_enabled
          ? "Automatic sync resumed"
          : "Automatic sync paused",
      )
    },
    onError: (error) => toast.error(apiMessage(error, "Could not update sheet")),
  })

  const removeSource = useMutation({
    mutationFn: (id: string) => deleteReportSource(id),
    onSuccess: () => {
      invalidate()
      setPendingDelete(null)
      toast.success("Sheet removed")
    },
    onError: (error) => toast.error(apiMessage(error, "Could not remove sheet")),
  })

  const sources = data?.data ?? []
  const total = data?.total ?? 0

  const columns = () => [
    {
      accessorKey: "name",
      header: "Sheet",
      cell: ({ row }: { row: { original: ReportSource } }) => (
        <div className="min-w-0">
          <Link
            href={`/report-sources/${row.original.id}`}
            className="font-medium text-foreground hover:underline"
          >
            {row.original.name}
          </Link>
          {row.original.title && row.original.title !== row.original.name ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.title}
            </p>
          ) : null}
          {row.original.all_tabs ? (
            <p
              className="text-xs text-muted-foreground"
              title={row.original.tabs?.map((tab) => tab.name).join(", ")}
            >
              All tabs
              {row.original.tabs ? ` · ${row.original.tabs.length}` : null}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "brand_profile.brand_name",
      header: "Brand",
      cell: ({ row }: { row: { original: ReportSource } }) =>
        row.original.brand_profile?.brand_name ?? "—",
    },
    {
      accessorKey: "row_count",
      header: "Rows",
      cell: ({ row }: { row: { original: ReportSource } }) => (
        <span className="tabular-nums">
          {row.original.row_count.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      accessorKey: "last_synced_at",
      header: "Last synced",
      cell: ({ row }: { row: { original: ReportSource } }) => (
        <span className="whitespace-nowrap text-sm">
          {formatDate(row.original.last_synced_at)}
        </span>
      ),
    },
    {
      accessorKey: "last_sync_status",
      header: "Status",
      cell: ({ row }: { row: { original: ReportSource } }) => {
        const badge = reportSyncBadge(row.original.last_sync_status)
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge label={badge.label} variant={badge.variant} />
            {!row.original.sync_enabled ? (
              <span className="text-xs text-muted-foreground">Paused</span>
            ) : null}
          </div>
        )
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }: { row: { original: ReportSource } }) => {
        const source = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Actions for ${source.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => syncOne.mutate(source.id)}
                  disabled={syncOne.isPending}
                >
                  <RefreshCw className="size-4" />
                  Sync now
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toggleSync.mutate({
                      id: source.id,
                      enabled: !source.sync_enabled,
                    })
                  }
                >
                  {source.sync_enabled ? (
                    <>
                      <Pause className="size-4" />
                      Pause auto sync
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      Resume auto sync
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={source.sheet_url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <ExternalLink className="size-4" />
                    Open in Google Sheets
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setPendingDelete(source)}
                >
                  <Trash2 className="size-4" />
                  Remove sheet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  if (!isReady) {
    return <LoadingSkeleton className="h-48 w-full" />
  }

  if (role !== UserRole.ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Sources</CardTitle>
          <CardDescription>
            Reporting sheets are available to admins only.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            TMOE Admin <span className="mx-1.5">/</span> Report Sources
          </>
        }
        title="Report Sources"
        description="Google Sheets imported as brand reporting data. Rows refresh automatically every few hours."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 shadow-none"
              disabled={syncAll.isPending || sources.length === 0}
              onClick={() => syncAll.mutate()}
            >
              <RefreshCw
                className={`size-4 ${syncAll.isPending ? "animate-spin" : ""}`}
              />
              {syncAll.isPending ? "Syncing…" : "Sync all"}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 shadow-none"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add sheet
            </Button>
          </>
        }
      />

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Could not load report sources
            </CardTitle>
            <CardDescription>
              Check your connection and try again.
            </CardDescription>
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-fit"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </CardHeader>
        </Card>
      ) : isFetching && sources.length === 0 ? (
        <LoadingSkeleton className="h-48 w-full" />
      ) : sources.length === 0 && !brandFilter && !debouncedQuery ? (
        <Card>
          <CardHeader>
            <CardTitle>No reporting sheets yet</CardTitle>
            <CardDescription>
              Add a public Google Sheet and pick the brand it reports on. Every
              row is imported and kept up to date automatically.
            </CardDescription>
            <Button
              type="button"
              className="mt-2 w-fit gap-2"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add sheet
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <DataTable
          title="report sources"
          data={sources}
          columns={columns()}
          pagination={pagination}
          setPagination={setPagination}
          totalCount={total}
          count={sources.length}
          query={query}
          setQuery={(value: string) => {
            setQuery(value)
            resetToFirstPage()
          }}
          isFetching={isFetching}
          actionButtons={
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Brand</span>
              <Select
                value={brandFilter || "all"}
                onValueChange={(value) => {
                  setBrandFilter(value === "all" ? "" : value)
                  resetToFirstPage()
                }}
              >
                <SelectTrigger className="h-9 w-[220px]">
                  <SelectValue placeholder="All brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}

      <AddReportSourceDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={(source) => router.push(`/report-sources/${source.id}`)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !removeSource.isPending) setPendingDelete(null)
        }}
        title="Remove this sheet?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" and its ${pendingDelete.row_count.toLocaleString("en-US")} imported rows will be removed. The Google Sheet itself is not touched, and you can add it again later.`
            : undefined
        }
        confirmLabel="Remove sheet"
        pendingLabel="Removing…"
        confirmVariant="destructive"
        isPending={removeSource.isPending}
        onConfirm={() => {
          if (pendingDelete) removeSource.mutate(pendingDelete.id)
        }}
      />
    </div>
  )
}
