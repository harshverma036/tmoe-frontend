"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Copy, Plus, Settings2 } from "lucide-react"
import toast from "react-hot-toast"

import DataTable from "@/components/common/DataTable"
import { PageHeader } from "@/components/layout/page-header"
import { AddPropertyDialog } from "@/components/promote-links/add-property-dialog"
import { BrandImpactConfigDialog } from "@/components/promote-links/brand-impact-config-dialog"
import { CreatePromoteLinkDialog } from "@/components/promote-links/create-promote-link-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  fetchPromoteLinks,
  promoteLinkBrandsQueryKey,
  promoteLinksQueryKey,
  type PromoteLink,
} from "@/lib/api/promote-links"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

function truncateUrl(url: string, max = 48) {
  if (url.length <= max) return url
  return `${url.slice(0, max)}…`
}

function matchesSearch(link: PromoteLink, query: string): boolean {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return (
    (link.brand_profile?.brand_name ?? "").toLowerCase().includes(q) ||
    (link.publisher_profile?.publication_name ?? "").toLowerCase().includes(q) ||
    (link.publisher_profile?.user?.email ?? "").toLowerCase().includes(q) ||
    link.generated_url.toLowerCase().includes(q) ||
    String(link.click_count).includes(q)
  )
}

export default function PromoteLinksPage() {
  const { role, isReady } = useDashboardUserRole()
  const queryClient = useQueryClient()
  const { pagination, setPagination, query, setQuery, resetToFirstPage } =
    useDataTableState()
  const [brandFilter, setBrandFilter] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [propertyOpen, setPropertyOpen] = useState(false)

  const page = pagination.pageIndex + 1
  const pageSize = pagination.pageSize

  const { data: brands = [] } = useQuery({
    queryKey: promoteLinkBrandsQueryKey,
    queryFn: fetchPromoteLinkBrands,
    enabled: isReady && (role === UserRole.ADMIN || role === UserRole.PUBLISHER),
  })

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [...promoteLinksQueryKey, page, pageSize, brandFilter],
    queryFn: () =>
      fetchPromoteLinks({
        page,
        pageSize,
        brand_profile_id: brandFilter || undefined,
      }),
    enabled: isReady && (role === UserRole.ADMIN || role === UserRole.PUBLISHER),
  })

  const copyLink = useMutation({
    mutationFn: async (url: string) => {
      await navigator.clipboard.writeText(url)
    },
    onSuccess: () => toast.success("Link copied"),
    onError: () => toast.error("Could not copy link"),
  })

  const links = data?.data ?? []
  const total = data?.total ?? 0

  const filteredLinks = useMemo(
    () => links.filter((link: any) => matchesSearch(link, query)),
    [links, query],
  )

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

  const breadcrumbLabel =
    role === UserRole.ADMIN ? "TMOE Admin" : "Publisher Studio"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={
          <>
            {breadcrumbLabel} <span className="mx-1.5">/</span> Promote Links
          </>
        }
        title="Promote Links"
        description="Create and manage Impact.com affiliate promote links for brands."
        actions={
          <>
            {role === UserRole.ADMIN ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl px-4 shadow-none"
                onClick={() => setConfigOpen(true)}
              >
                <Settings2 className="size-4" />
                Configure brands
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl px-4 shadow-none"
                onClick={() => setPropertyOpen(true)}
              >
                <Settings2 className="size-4" />
                Add property
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="h-9 gap-2 rounded-xl px-4 shadow-none"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Create a link
            </Button>
          </>
        }
      />

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Could not load links</CardTitle>
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
      ) : isFetching && links.length === 0 ? (
        <LoadingSkeleton className="h-48 w-full" />
      ) : links.length === 0 && !brandFilter && !query ? (
        <Card>
          <CardHeader>
            <CardTitle>No promote links yet</CardTitle>
            <CardDescription>
              Create your first Impact.com promote link for a brand.
            </CardDescription>
            <Button
              type="button"
              className="mt-2 w-fit gap-2"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" />
              Create a link
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <DataTable
          title="promote links"
          data={filteredLinks}
          columns={columns()}
          pagination={pagination}
          setPagination={setPagination}
          totalCount={total}
          count={filteredLinks.length}
          query={query}
          setQuery={setQuery}
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
