"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Upload } from "lucide-react"

import { AgodaBookingsReport } from "@/components/agoda/agoda-bookings-report"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { formatDate, formatInt } from "@/lib/agoda-format"
import {
  agodaQueryKeys,
  fetchAgodaMeta,
  fetchAgodaReport,
} from "@/lib/api/agoda"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

export default function AgodaReportPage() {
  const { role, isReady } = useDashboardUserRole()
  const isAdmin = isReady && role === UserRole.ADMIN

  const metaQuery = useQuery({
    queryKey: agodaQueryKeys.meta,
    queryFn: fetchAgodaMeta,
    enabled: isAdmin,
    staleTime: 0,
  })
  const meta = metaQuery.data

  if (!isReady) return <LoadingSkeleton className="h-48 w-full" />
  if (role !== UserRole.ADMIN) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agoda</CardTitle>
          <CardDescription>
            The Agoda report is available to admins only.
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
            TMOE Admin <span className="mx-1.5">/</span> Agoda
          </>
        }
        title="Agoda bookings"
        description={
          meta && meta.total_bookings > 0
            ? `${formatInt(meta.total_bookings)} bookings imported, booked ${formatDate(meta.first_booking_date)} – ${formatDate(meta.last_booking_date)}. All amounts in USD.`
            : "Bookings and commission from Agoda Partners, imported from its CSV export."
        }
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href="/agoda/import">
              <Upload className="size-4" /> Import CSV
            </Link>
          </Button>
        }
      />

      <AgodaBookingsReport
        meta={meta}
        metaError={metaQuery.isError ? metaQuery.error : null}
        onRefetchMeta={() => metaQuery.refetch()}
        fetchReport={fetchAgodaReport}
        queryKey={agodaQueryKeys.report}
        canImport
      />
    </div>
  )
}
