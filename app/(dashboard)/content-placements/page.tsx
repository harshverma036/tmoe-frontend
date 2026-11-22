"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { LayoutGrid, Loader2, Plus, Search, Settings2 } from "lucide-react"
import toast from "react-hot-toast"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { PlacementVisualizer } from "@/components/content-placement/placement-visualizer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import {
  contentPlacementsQueryKey,
  createContentPlacement,
  deleteContentPlacement,
  fetchContentPlacements,
} from "@/lib/api/content-placements"
import {
  getPlacementLabel,
  isPlacementConfigured,
  type ContentPlacement,
} from "@/lib/content-placement.types"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

export default function ContentPlacementsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role, isReady } = useDashboardUserRole()
  const [search, setSearch] = useState("")
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ContentPlacement | null>(null)

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: contentPlacementsQueryKey,
    queryFn: () => fetchContentPlacements({ limit: 200 }),
    enabled: isReady && role === UserRole.ADMIN,
  })

  const createMutation = useMutation({
    mutationFn: () => createContentPlacement({ name: newName.trim() }),
    onSuccess: (placement) => {
      queryClient.invalidateQueries({ queryKey: contentPlacementsQueryKey })
      setNameModalOpen(false)
      setNewName("")
      toast.success("Content placement created")
      router.push(`/content-placements/${placement.id}/configure`)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not create placement")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContentPlacement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentPlacementsQueryKey })
      toast.success("Content placement deleted")
      setDeleteTarget(null)
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not delete placement")
    },
  })

  const filtered = useMemo(() => {
    const items = data?.items ?? []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        getPlacementLabel(p.position).toLowerCase().includes(q),
    )
  }, [data?.items, search])

  if (!isReady) return <LoadingSkeleton variant="default" />
  if (role !== UserRole.ADMIN) {
    return <p className="text-muted-foreground text-sm">Admin access only.</p>
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Content placements</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Define where branded content appears on publisher sites. Brands select
            these when submitting campaign briefs.
          </p>
        </div>
        <Button onClick={() => setNameModalOpen(true)}>
          <Plus className="mr-2 size-4" />
          Add placement
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          placeholder="Search placements…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isFetching ? (
        <LoadingSkeleton variant="card-grid" cardCount={3} label="Loading placements…" />
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Could not load placements</CardTitle>
            <CardDescription>Check your connection and try again.</CardDescription>
            <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => refetch()}>
              Retry
            </Button>
          </CardHeader>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <LayoutGrid className="text-muted-foreground mb-2 size-10" />
            <CardTitle>No content placements yet</CardTitle>
            <CardDescription>
              Create your first placement to make it available in campaign briefs.
            </CardDescription>
            <Button className="mt-4" onClick={() => setNameModalOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add placement
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((placement) => (
            <Card key={placement.id} className="overflow-hidden">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{placement.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {getPlacementLabel(placement.position)}
                    </CardDescription>
                  </div>
                  <Badge variant={isPlacementConfigured(placement) ? "default" : "secondary"}>
                    {isPlacementConfigured(placement) ? "Configured" : "Draft"}
                  </Badge>
                </div>
                <PlacementVisualizer position={placement.position} className="max-w-full" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/content-placements/${placement.id}/configure`}>
                      <Settings2 className="mr-1.5 size-3.5" />
                      {isPlacementConfigured(placement) ? "Edit" : "Configure"}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(placement)}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={nameModalOpen} onOpenChange={setNameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New content placement</DialogTitle>
            <DialogDescription>
              Enter a name for this placement. You will configure the on-site position
              next.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="placement-name">Placement name</Label>
            <Input
              id="placement-name"
              placeholder="e.g. Homepage hero slot"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  createMutation.mutate()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newName.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Create & configure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && deleteMutation.isPending) return
          if (!open) setDeleteTarget(null)
        }}
        title="Delete content placement?"
        description={`"${deleteTarget?.name}" will be removed. Campaigns already using it will keep their reference until updated.`}
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  )
}
