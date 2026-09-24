"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import {
  ArrowLeft,
  ExternalLink,
  Pause,
  Play,
  RefreshCw,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import DataTable from "@/components/common/DataTable"
import { FilterTabs } from "@/components/common/FilterTabs"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/layout/page-header"
import { UsdInrRateCard } from "@/components/report-sources/usd-inr-rate-card"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { useDataTableState } from "@/hooks/use-data-table-state"
import {
  deleteReportSource,
  fetchReportSourceById,
  fetchReportSourceRows,
  fetchReportSourceRuns,
  reportSourceQueryKey,
  reportSourceRowsQueryKey,
  reportSourceRunsQueryKey,
  reportSourcesQueryKey,
  syncReportSource,
  updateReportSource,
} from "@/lib/api/report-sources"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import {
  reportSyncBadge,
  type ReportRow,
  type ReportSyncRun,
} from "@/lib/report-source.types"

type DetailTab = "rows" | "runs"

function formatDateTime(value: string | null) {
  if (!value) return "—"
  try {
    return format(new Date(value), "dd MMM yyyy, HH:mm")
  } catch {
    return value
  }
}

function formatDuration(run: ReportSyncRun) {
  if (!run.finished_at) return "—"
  const ms = new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()
  if (!Number.isFinite(ms) || ms < 0) return "—"
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`
}

function apiMessage(error: unknown, fallback: string) {
  const message = (error as AxiosError<{ message?: string | string[] }>)
    .response?.data?.message
  return (Array.isArray(message) ? message[0] : message) ?? fallback
}

function SummaryItem({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium text-foreground">{children}</div>
    </div>
  )
}

export default function ReportSourceDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role, isReady } = useDashboardUserRole()

  const [tab, setTab] = useState<DetailTab>("rows")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [headerRowDraft, setHeaderRowDraft] = useState<string | null>(null)
  /** The tab picked in the Rows view of an all-tabs sheet; null = its first tab with rows. */
  const [rowsGid, setRowsGid] = useState<string | null>(null)
  const [tabsModeOpen, setTabsModeOpen] = useState(false)

  const rowsTable = useDataTableState({ initialPageSize: 25 })
  const runsTable = useDataTableState({ initialPageSize: 10 })

  const isAdmin = isReady && role === UserRole.ADMIN

  const {
    data: source,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: reportSourceQueryKey(id),
    queryFn: () => fetchReportSourceById(id),
    enabled: isAdmin && id !== "",
  })

  // An all-tabs sheet shows one tab's rows at a time, the first tab with rows until one is picked
  // (a new month's tab is often still empty). Until its first all-tabs import it has no `tabs`,
  // and reads like a single-tab sheet.
  const sheetTabs = source?.all_tabs ? (source.tabs ?? []) : []
  const selectedTab =
    sheetTabs.find((sheetTab) => sheetTab.gid === rowsGid) ??
    sheetTabs.find((sheetTab) => sheetTab.row_count > 0) ??
    sheetTabs[0] ??
    null
  const rowsGidParam = selectedTab?.gid ?? ""
  const selectedTabEmpty = selectedTab !== null && selectedTab.row_count === 0

  const rowsPage = rowsTable.pagination.pageIndex + 1
  const rowsPageSize = rowsTable.pagination.pageSize
  const { data: rowsResult, isFetching: rowsFetching } = useQuery({
    queryKey: reportSourceRowsQueryKey(id, rowsGidParam, rowsPage, rowsPageSize),
    queryFn: () =>
      fetchReportSourceRows(id, {
        page: rowsPage,
        pageSize: rowsPageSize,
        gid: rowsGidParam || undefined,
      }),
    // Waits for the sheet, so an all-tabs sheet asks for its tab straight away; an empty tab has
    // nothing to fetch.
    enabled:
      isAdmin &&
      id !== "" &&
      tab === "rows" &&
      source !== undefined &&
      !selectedTabEmpty,
    keepPreviousData: true,
  })

  const runsPage = runsTable.pagination.pageIndex + 1
  const runsPageSize = runsTable.pagination.pageSize
  const { data: runsResult, isFetching: runsFetching } = useQuery({
    queryKey: reportSourceRunsQueryKey(id, runsPage, runsPageSize),
    queryFn: () =>
      fetchReportSourceRuns(id, { page: runsPage, pageSize: runsPageSize }),
    enabled: isAdmin && id !== "" && tab === "runs",
    keepPreviousData: true,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: reportSourceQueryKey(id) })
    queryClient.invalidateQueries({ queryKey: ["report-sources", id, "rows"] })
    queryClient.invalidateQueries({ queryKey: ["report-sources", id, "runs"] })
    queryClient.invalidateQueries({ queryKey: reportSourcesQueryKey })
  }

  const sync = useMutation({
    mutationFn: () => syncReportSource(id),
    onSuccess: (run) => {
      invalidateAll()
      toast.success(
        run.status === "UNCHANGED"
          ? "Sheet has not changed since the last sync"
          : `Synced ${run.row_count ?? 0} rows`,
      )
    },
    onError: (error) => toast.error(apiMessage(error, "Could not sync sheet")),
  })

  const save = useMutation({
    mutationFn: (body: { sync_enabled?: boolean; header_row?: number | null }) =>
      updateReportSource(id, body),
    onSuccess: (updated, variables) => {
      invalidateAll()
      if (variables.sync_enabled !== undefined) {
        toast.success(
          updated.sync_enabled
            ? "Automatic sync resumed"
            : "Automatic sync paused",
        )
      } else {
        setHeaderRowDraft(null)
        toast.success("Header row saved. Re-importing the sheet…")
        sync.mutate()
      }
    },
    onError: (error) => toast.error(apiMessage(error, "Could not update sheet")),
  })

  const saveTabsMode = useMutation({
    mutationFn: (allTabs: boolean) => updateReportSource(id, { all_tabs: allTabs }),
    onSuccess: (updated) => {
      invalidateAll()
      setTabsModeOpen(false)
      setRowsGid(null)
      rowsTable.resetToFirstPage()
      toast.success(
        updated.all_tabs
          ? "Set to import every tab. Re-importing the sheet…"
          : "Set to import only this tab. Re-importing the sheet…",
      )
      sync.mutate()
    },
    onError: (error) =>
      toast.error(apiMessage(error, "Could not change which tabs are imported")),
  })

  const removeSource = useMutation({
    mutationFn: () => deleteReportSource(id),
    onSuccess: () => {
      // Drop this sheet's queries rather than invalidating them: the list key is a prefix of
      // theirs, so invalidating would refetch a record that no longer exists and 404.
      queryClient.removeQueries({ queryKey: ["report-sources", id] })
      queryClient.invalidateQueries({ queryKey: reportSourcesQueryKey })
      toast.success("Sheet removed")
      router.push("/report-sources")
    },
    onError: (error) => toast.error(apiMessage(error, "Could not remove sheet")),
  })

  // The columns travel with the rows, so while another tab loads the table still matches the rows
  // it shows. Before the first page arrives, the tab's (or the sheet's) columns stand in.
  const rowsColumns = rowsResult?.columns ?? selectedTab?.columns ?? source?.columns

  /** Row columns are built from whatever the last import found in the tab shown. */
  const rowColumns = useMemo(() => {
    const sheetColumns = rowsColumns ?? []
    return [
      {
        accessorKey: "row_index",
        header: "Sheet row",
        cell: ({ row }: { row: { original: ReportRow } }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.row_index}
          </span>
        ),
      },
      ...sheetColumns.map((column) => ({
        accessorKey: `data.${column.key}`,
        header: column.header || column.key,
        cell: ({ row }: { row: { original: ReportRow } }) => {
          const value = row.original.data[column.key]
          return value === null || value === "" ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="whitespace-nowrap">{value}</span>
          )
        },
      })),
    ]
  }, [rowsColumns])

  const runColumns = () => [
    {
      accessorKey: "status",
      header: "Result",
      cell: ({ row }: { row: { original: ReportSyncRun } }) => {
        const badge = reportSyncBadge(row.original.status)
        return <StatusBadge label={badge.label} variant={badge.variant} />
      },
    },
    {
      accessorKey: "trigger",
      header: "Trigger",
      cell: ({ row }: { row: { original: ReportSyncRun } }) =>
        row.original.trigger === "SCHEDULED" ? "Scheduled" : "Manual",
    },
    {
      accessorKey: "started_at",
      header: "Started",
      cell: ({ row }: { row: { original: ReportSyncRun } }) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.original.started_at)}
        </span>
      ),
    },
    {
      accessorKey: "duration",
      header: "Took",
      cell: ({ row }: { row: { original: ReportSyncRun } }) =>
        formatDuration(row.original),
    },
    {
      accessorKey: "row_count",
      header: "Rows",
      cell: ({ row }: { row: { original: ReportSyncRun } }) =>
        row.original.row_count === null ? "—" : row.original.row_count,
    },
    {
      accessorKey: "triggered_by",
      header: "By",
      cell: ({ row }: { row: { original: ReportSyncRun } }) =>
        row.original.triggered_by?.email ?? "Scheduler",
    },
    {
      accessorKey: "error",
      header: "Error",
      cell: ({ row }: { row: { original: ReportSyncRun } }) =>
        row.original.error ? (
          <span
            className="block max-w-[280px] truncate text-destructive"
            title={row.original.error}
          >
            {row.original.error}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ]

  if (!isReady || isLoading) {
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

  if (isError || !source) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sheet not found</CardTitle>
          <CardDescription>
            It may have been removed. Go back to the list, or try again.
          </CardDescription>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button type="button" asChild>
              <Link href="/report-sources">Back to report sources</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const badge = reportSyncBadge(source.last_sync_status)
  const rows = rowsResult?.data ?? []
  const runs = runsResult?.data ?? []
  const headerRowValue =
    headerRowDraft ?? (source.header_row === null ? "" : String(source.header_row))
  const ownTabName =
    source.tabs?.find((sheetTab) => sheetTab.gid === source.gid)?.name ?? null

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <Link
            href="/report-sources"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Report Sources
          </Link>
        }
        title={source.name}
        description={source.title ?? undefined}
        badge={<StatusBadge label={badge.label} variant={badge.variant} />}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 shadow-none"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
            >
              <RefreshCw
                className={`size-4 ${sync.isPending ? "animate-spin" : ""}`}
              />
              {sync.isPending ? "Syncing…" : "Sync now"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 shadow-none"
              onClick={() =>
                save.mutate({ sync_enabled: !source.sync_enabled })
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
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 shadow-none"
              asChild
            >
              <a
                href={source.sheet_url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <ExternalLink className="size-4" />
                Open sheet
              </a>
            </Button>
          </>
        }
      />

      {source.last_sync_status === "FAILED" && source.last_sync_error ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Last sync failed
            </CardTitle>
            <CardDescription className="break-words">
              {source.last_sync_error}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardContent className="grid gap-5 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Brand">
            {source.brand_profile?.brand_name ?? "—"}
          </SummaryItem>
          <SummaryItem label="Rows imported">
            <span className="tabular-nums">
              {source.row_count.toLocaleString("en-US")}
            </span>
          </SummaryItem>
          <SummaryItem label="Last synced">
            {formatDateTime(source.last_synced_at)}
          </SummaryItem>
          <SummaryItem label="Automatic sync">
            {source.sync_enabled ? "Every 6 hours" : "Paused"}
          </SummaryItem>
          {source.all_tabs ? (
            <SummaryItem label="Tabs">
              <span
                className="tabular-nums"
                title={source.tabs?.map((sheetTab) => sheetTab.name).join(", ")}
              >
                {source.tabs === null ? "—" : source.tabs.length}
              </span>
            </SummaryItem>
          ) : (
            <SummaryItem label="Tab id (gid)">
              <span className="font-mono text-xs">{source.gid}</span>
            </SummaryItem>
          )}
          <SummaryItem label="Columns">
            {selectedTab ? (
              <>
                <span className="tabular-nums">{selectedTab.columns.length}</span>{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  in {selectedTab.name}
                </span>
              </>
            ) : (
              source.columns.length
            )}
          </SummaryItem>
          <SummaryItem label="Header row">
            {source.header_row === null
              ? "Detected automatically"
              : `Row ${source.header_row}`}
          </SummaryItem>
          <SummaryItem label="Added">
            {formatDateTime(source.created_at)}
          </SummaryItem>
        </CardContent>
      </Card>

      <FilterTabs<DetailTab>
        tabs={[
          { value: "rows", label: "Rows", count: source.row_count },
          { value: "runs", label: "Sync history" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "rows" && sheetTabs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Sheet tab</span>
          <FilterTabs
            tabs={sheetTabs.map((sheetTab) => ({
              value: sheetTab.gid,
              label: sheetTab.name || `gid ${sheetTab.gid}`,
              count: sheetTab.row_count,
            }))}
            value={rowsGidParam}
            onChange={(gid) => {
              setRowsGid(gid)
              rowsTable.resetToFirstPage()
            }}
          />
        </div>
      ) : null}

      {/* Distinct keys: DataTable's page-size select is uncontrolled, so without them
          React reuses one instance across the tabs and the label goes stale. */}
      {tab === "rows" ? (
        selectedTab && selectedTabEmpty ? (
          <Card>
            <CardHeader>
              <CardTitle>This tab is empty</CardTitle>
              <CardDescription>
                &ldquo;{selectedTab.name}&rdquo; had nothing in it at the last
                import. Its rows are picked up on the first sync after it is
                filled in.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (rowsColumns ?? []).length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No columns detected</CardTitle>
              <CardDescription>
                The last import found no usable columns in this tab. Check the
                sheet, or set the header row below.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <DataTable
            key="rows"
            title="rows"
            data={rows}
            columns={rowColumns}
            pagination={rowsTable.pagination}
            setPagination={rowsTable.setPagination}
            totalCount={rowsResult?.total ?? 0}
            count={rows.length}
            isFetching={rowsFetching}
          />
        )
      ) : (
        <DataTable
          key="runs"
          title="sync runs"
          data={runs}
          columns={runColumns()}
          pagination={runsTable.pagination}
          setPagination={runsTable.setPagination}
          totalCount={runsResult?.total ?? 0}
          count={runs.length}
          isFetching={runsFetching}
        />
      )}

      <UsdInrRateCard source={source} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Advanced</CardTitle>
          <CardDescription>
            Only change the header row if the columns above look wrong. Leave it
            empty to let the importer find the header itself.
            {source.all_tabs
              ? " It applies to every tab."
              : " For a spreadsheet with a tab per month, import every tab."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-8">
            <div className="space-y-2">
              <Label htmlFor="header-row">Header row</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="header-row"
                  className="h-9 w-32"
                  inputMode="numeric"
                  placeholder="Auto"
                  value={headerRowValue}
                  onChange={(event) => setHeaderRowDraft(event.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={save.isPending || headerRowDraft === null}
                  onClick={() => {
                    const trimmed = (headerRowDraft ?? "").trim()
                    if (trimmed === "") {
                      save.mutate({ header_row: null })
                      return
                    }
                    const parsed = Number(trimmed)
                    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
                      toast.error("Header row must be a whole number from 1 to 100")
                      return
                    }
                    save.mutate({ header_row: parsed })
                  }}
                >
                  {save.isPending ? "Saving…" : "Save and re-import"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm leading-none font-medium">Tabs</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {source.all_tabs ? "Every tab" : "This tab only"}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saveTabsMode.isPending || sync.isPending}
                  onClick={() => setTabsModeOpen(true)}
                >
                  {source.all_tabs ? "Import only this tab" : "Import every tab"}
                </Button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Remove sheet
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={tabsModeOpen}
        onOpenChange={(open) => {
          if (!open && !saveTabsMode.isPending) setTabsModeOpen(false)
        }}
        title={source.all_tabs ? "Import only this tab?" : "Import every tab?"}
        description={
          source.all_tabs
            ? `Only ${ownTabName ? `"${ownTabName}"` : `the tab with gid ${source.gid}`}, the tab this sheet was added from, will be imported. The sheet is re-imported now, and the other tabs' rows are removed.`
            : "Every tab of this spreadsheet will be imported, and tabs added later (a new month) are picked up on each sync. The sheet is re-imported now."
        }
        confirmLabel={source.all_tabs ? "Import only this tab" : "Import every tab"}
        pendingLabel="Saving…"
        isPending={saveTabsMode.isPending}
        onConfirm={() => saveTabsMode.mutate(!source.all_tabs)}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open && !removeSource.isPending) setDeleteOpen(false)
        }}
        title="Remove this sheet?"
        description={`"${source.name}" and its ${source.row_count.toLocaleString("en-US")} imported rows will be removed. The Google Sheet itself is not touched, and you can add it again later.`}
        confirmLabel="Remove sheet"
        pendingLabel="Removing…"
        confirmVariant="destructive"
        isPending={removeSource.isPending}
        onConfirm={() => removeSource.mutate()}
      />
    </div>
  )
}
