"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  apiMessage,
  formatDate,
  formatInt,
  formatRange,
  formatUsd,
} from "@/lib/agoda-format"
import {
  agodaQueryKeys,
  fetchAgodaImports,
  importAgodaFile,
  previewAgodaImport,
  type AgodaImportSummary,
} from "@/lib/api/agoda"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"
import { cn } from "@/lib/utils"

function Count({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "good" | "warn"
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xl font-semibold text-foreground tabular-nums",
          tone === "warn" && value > 0 && "text-amber-700 dark:text-amber-400"
        )}
      >
        {formatInt(value)}
      </p>
    </div>
  )
}

/** What a file holds and what importing it does: new, updated, unchanged, skipped. */
function SummaryView({ summary }: { summary: AgodaImportSummary }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Count label="Rows in file" value={summary.row_count} />
        <Count label="New bookings" value={summary.created_count} />
        <Count label="Updated" value={summary.updated_count} />
        <Count label="Unchanged" value={summary.unchanged_count} />
        <Count label="Skipped" value={summary.skipped_count} tone="warn" />
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Booking dates</p>
          <p className="font-medium text-foreground">
            {summary.booking_date_from && summary.booking_date_to
              ? formatRange(summary.booking_date_from, summary.booking_date_to)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Booking value · finalized commission
          </p>
          <p className="font-medium text-foreground tabular-nums">
            {formatUsd(Number(summary.booking_value_usd))} ·{" "}
            {formatUsd(Number(summary.finalized_commission_usd))}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Check against the file&apos;s Total line
          </p>
          {summary.totals_match === null ? (
            <p className="text-muted-foreground">The file has no Total line</p>
          ) : summary.totals_match ? (
            <p className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-4" /> Totals match
            </p>
          ) : (
            <p className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" /> File says{" "}
              {formatUsd(Number(summary.file_totals?.booking_value_usd))} ·{" "}
              {formatUsd(Number(summary.file_totals?.finalized_commission_usd))}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">
            Sites in this file
          </p>
          <ul className="space-y-0.5 text-sm">
            {summary.sites.map((site) => (
              <li key={site.site_id} className="flex justify-between gap-3">
                <span className="text-foreground">
                  {site.site_name}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({site.site_id})
                  </span>
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatInt(site.bookings)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {summary.status_changes.length > 0 || summary.newly_finalized > 0 ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Changes since the last import
            </p>
            <ul className="space-y-0.5 text-sm">
              {summary.status_changes.slice(0, 6).map((change) => (
                <li
                  key={`${change.from}-${change.to}`}
                  className="flex justify-between gap-3"
                >
                  <span className="text-foreground">
                    {change.from} → {change.to}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatInt(change.count)}
                  </span>
                </li>
              ))}
              {summary.newly_finalized > 0 ? (
                <li className="flex justify-between gap-3">
                  <span className="text-foreground">Commission finalized</span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatInt(summary.newly_finalized)}
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {summary.warnings.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4" /> {summary.warnings.length} thing
            {summary.warnings.length === 1 ? "" : "s"} to check
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-amber-900 dark:text-amber-200">
            {summary.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default function AgodaImportPage() {
  const { role, isReady } = useDashboardUserRole()
  const isAdmin = isReady && role === UserRole.ADMIN
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<AgodaImportSummary | null>(null)
  const [done, setDone] = useState<AgodaImportSummary | null>(null)
  const [dragging, setDragging] = useState(false)

  const importsQuery = useQuery({
    queryKey: agodaQueryKeys.imports,
    queryFn: () => fetchAgodaImports(1, 50),
    enabled: isAdmin,
    staleTime: 0,
  })

  const previewMutation = useMutation({
    mutationFn: previewAgodaImport,
    onSuccess: setPreview,
  })
  const importMutation = useMutation({
    mutationFn: importAgodaFile,
    onSuccess: (summary) => {
      setDone(summary)
      setPreview(null)
      setFile(null)
      toast.success(
        `Imported ${formatInt(summary.created_count)} new and ${formatInt(summary.updated_count)} updated bookings`
      )
      queryClient.invalidateQueries(agodaQueryKeys.all)
    },
  })

  const choose = (next: File | null | undefined) => {
    if (!next) return
    setFile(next)
    setPreview(null)
    setDone(null)
    importMutation.reset()
    previewMutation.mutate(next)
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    previewMutation.reset()
    importMutation.reset()
    if (inputRef.current) inputRef.current.value = ""
  }

  if (!isReady) return <LoadingSkeleton className="h-48 w-full" />
  if (role !== UserRole.ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import Agoda data</CardTitle>
          <CardDescription>
            Importing is available to admins only.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const changes = preview ? preview.created_count + preview.updated_count : 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            TMOE Admin <span className="mx-1.5">/</span>{" "}
            <Link href="/agoda" className="hover:underline">
              Agoda
            </Link>{" "}
            <span className="mx-1.5">/</span> Import
          </>
        }
        title="Import Agoda bookings"
        description="Upload the Booking Received CSV from Agoda Partners. Bookings are matched by Booking ID, so importing an overlapping period again updates statuses and commission instead of adding duplicates."
        actions={
          <Button asChild variant="outline">
            <Link href="/agoda">View report</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>1. Choose the CSV</CardTitle>
            <CardDescription>
              It is checked first; nothing is saved until you confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              htmlFor="agoda-file"
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault()
                setDragging(false)
                choose(event.dataTransfer.files?.[0])
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:bg-muted/40",
                dragging && "border-primary bg-primary/5"
              )}
            >
              {previewMutation.isLoading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              ) : file ? (
                <FileText className="size-6 text-muted-foreground" />
              ) : (
                <Upload className="size-6 text-muted-foreground" />
              )}
              <p className="text-sm font-medium text-foreground">
                {file ? file.name : "Drop the CSV here, or click to choose it"}
              </p>
              <p className="text-xs text-muted-foreground">
                {file
                  ? `${(file.size / 1024).toFixed(0)} KB${previewMutation.isLoading ? " · checking…" : ""}`
                  : "BookingReceivedReport_All_BookingDate_….csv"}
              </p>
              <input
                ref={inputRef}
                id="agoda-file"
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => choose(event.target.files?.[0])}
              />
            </label>

            {previewMutation.isError ? (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                {apiMessage(
                  previewMutation.error,
                  "The file could not be checked."
                )}
              </p>
            ) : null}
            {importMutation.isError ? (
              <p
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                role="alert"
              >
                {apiMessage(
                  importMutation.error,
                  "The import failed; nothing was saved."
                )}
              </p>
            ) : null}

            {done ? (
              <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <p className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="size-5" /> Imported {done.file_name}
                </p>
                <SummaryView summary={done} />
                <Button asChild>
                  <Link href="/agoda">Open the report</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where to get the file</CardTitle>
            <CardDescription>
              From partners.agoda.com, signed in as TMOE.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground">
              <li>
                Open <span className="font-medium">Reporting</span>.
              </li>
              <li>
                Keep <span className="font-medium">Booking Date</span> and pick
                one month (for example 1 – 31 Oct), then{" "}
                <span className="font-medium">Generate</span>.
              </li>
              <li>
                In Report Summary, click{" "}
                <span className="font-medium">view details</span> beside Booking
                Received.
              </li>
              <li>
                <span className="font-medium">Export → CSV</span>, and upload
                that file here.
              </li>
            </ol>
            <p className="mt-4 text-xs text-muted-foreground">
              Agoda keeps changing bookings after they are made (Charged →
              Departed, commission finalized). Re-import the last two or three
              months each month to keep the report current.
            </p>
          </CardContent>
        </Card>
      </div>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Check and import</CardTitle>
            <CardDescription>{preview.file_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <SummaryView summary={preview} />
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button
              onClick={() => file && importMutation.mutate(file)}
              disabled={!file || importMutation.isLoading || changes === 0}
              className="gap-2"
            >
              {importMutation.isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {changes === 0
                ? "Nothing new to import"
                : `Import ${formatInt(preview.created_count)} new · ${formatInt(preview.updated_count)} updated`}
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              disabled={importMutation.isLoading}
            >
              Choose another file
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Import history</CardTitle>
          <CardDescription>Every file imported, newest first.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {importsQuery.isLoading ? (
            <LoadingSkeleton className="h-24 w-full" />
          ) : (importsQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing imported yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imported</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Booking dates</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">New</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Unchanged</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importsQuery.data?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      <p className="text-foreground">
                        {formatDate(item.created_at.slice(0, 10))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.imported_by?.name ||
                          item.imported_by?.email ||
                          "Script"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-64">
                      <p
                        className="truncate text-foreground"
                        title={item.file_name}
                      >
                        {item.file_name}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {item.booking_date_from && item.booking_date_to
                        ? formatRange(
                            item.booking_date_from,
                            item.booking_date_to
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(item.row_count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(item.created_count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(item.updated_count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(item.unchanged_count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatInt(item.skipped_count)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUsd(item.finalized_commission_usd)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
