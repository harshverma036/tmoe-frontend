"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format } from "date-fns"
import { Copy, Link2, Plus, Settings2 } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import DataTable from "@/components/common/DataTable"
import { AddPropertyDialog } from "@/components/promote-links/add-property-dialog"
import { BrandImpactConfigDialog } from "@/components/promote-links/brand-impact-config-dialog"
import { CreatePromoteLinkDialog } from "@/components/promote-links/create-promote-link-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { useDataTableState } from "@/hooks/use-data-table-state"
import {
  fetchPromoteLinks,
  promoteLinksQueryKey,
  type PromoteLink,
} from "@/lib/api/promote-links"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

function truncateUrl(url: string, max = 48) {
  if (url.length <= max) return url
  return `${url.slice(0, max)}…`
}

export default function PromoteLinksPage() {
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const { pagination, setPagination } = useDataTableState()
  const [createOpen, setCreateOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)

  const page = pagination.pageIndex + 1
  const pageSize = pagination.pageSize

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [...promoteLinksQueryKey, page, pageSize],
    queryFn: () => fetchPromoteLinks({ page, pageSize }),
    enabled: isReady && (role === UserRole.ADMIN || role === UserRole.PUBLISHER),
  })

  const copyLink = useMutation({
    mutationFn: async (url: string) => {
      await navigator.clipboard.writeText(url)
    },
    onSuccess: () => toast.success("Link copied"),
    onError: () => toast.error("Could not copy link"),
  })

  if (!isReady) {
    return <LoadingSkeleton className="h-48 w-full" />
  }

  if (role !== UserRole.ADMIN && role !== UserRole.PUBLISHER) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Promote Links</CardTitle>
          <CardDescription>
            Promote links are available to admins and publishers only.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const links = data?.data ?? []
  const total = data?.total ?? 0

  const columns = () => [
    {
      accessorKey: "brand_profile.brand_name",
      header: "Brand",
      cell: ({ row }: { row: { original: PromoteLink } }) =>
        row.original.brand_profile?.brand_name ?? "—",
    },
    ...(role === UserRole.ADMIN
      ? [
          {
            accessorKey: "publisher_profile.publication_name",
            header: "Publisher",
            cell: ({ row }: { row: { original: PromoteLink } }) =>
              row.original.publisher_profile?.publication_name ??
              row.original.publisher_profile?.user?.email ??
              "—",
          },
        ]
      : []),
    {
      accessorKey: "generated_url",
      header: "Link",
      cell: ({ row }: { row: { original: PromoteLink } }) => (
        <span className="font-mono text-xs" title={row.original.generated_url}>
          {truncateUrl(row.original.generated_url)}
        </span>
      ),
    },
    {
      accessorKey: "click_count",
      header: "Clicks",
      cell: ({ row }: { row: { original: PromoteLink } }) =>
        row.original.click_count,
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }: { row: { original: PromoteLink } }) => {
        const value = row.original.created_at
        if (!value) return "—"
        try {
          return format(new Date(value), "dd MMM yyyy")
        } catch {
          return value
        }
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }: { row: { original: PromoteLink } }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => copyLink.mutate(row.original.generated_url)}
        >
          <Copy className="mr-1 size-3.5" />
          Copy
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Promote Links
          </h1>
          <p className="text-sm text-muted-foreground">
            Create and manage Impact.com affiliate promote links for brands.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === UserRole.ADMIN ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfigOpen(true)}
            >
              <Settings2 className="mr-1 size-4" />
              Configure brands
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => setPropertyOpen(true)}
            >
              <Settings2 className="mr-1 size-4" />
              Add property
            </Button>
          )}
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 size-4" />
            Create a link
          </Button>
        </div>
      </div>

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="size-4" />
              Could not load links
            </CardTitle>
            <CardDescription>
              <Button type="button" variant="link" className="h-auto p-0" onClick={() => refetch()}>
                Try again
              </Button>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : isFetching && links.length === 0 ? (
        <LoadingSkeleton className="h-48 w-full" />
      ) : links.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No promote links yet</CardTitle>
            <CardDescription>
              Create your first Impact.com promote link for a brand.
            </CardDescription>
            <Button type="button" className="mt-2 w-fit" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 size-4" />
              Create a link
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <DataTable
          data={links}
          columns={columns()}
          pagination={pagination}
          setPagination={setPagination}
          totalCount={total}
          count={links.length}
          isFetching={isFetching}
        />
      )}

      <CreatePromoteLinkDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            queryClient.invalidateQueries({ queryKey: promoteLinksQueryKey })
          }
        }}
        role={role}
      />

      {role === UserRole.ADMIN ? (
        <BrandImpactConfigDialog open={configOpen} onOpenChange={setConfigOpen} />
      ) : (
        <AddPropertyDialog open={propertyOpen} onOpenChange={setPropertyOpen} />
      )}
    </div>
  )
}
