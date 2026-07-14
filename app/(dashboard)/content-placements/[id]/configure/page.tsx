"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { ArrowLeft, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

import { PlacementPicker } from "@/components/content-placement/placement-picker"
import { PageHeader } from "@/components/layout/page-header"
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
import { Textarea } from "@/components/ui/textarea"
import {
  contentPlacementQueryKey,
  contentPlacementsQueryKey,
  fetchContentPlacementById,
  updateContentPlacement,
} from "@/lib/api/content-placements"
import { getPlacementLabel } from "@/lib/content-placement.types"
import type { ContentPlacementPosition } from "@/lib/content-placement.types"
import { UserRole } from "@/lib/dashboard-nav"
import { useDashboardUserRole } from "@/lib/hooks/use-dashboard-user-role"

export default function ConfigureContentPlacementPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { role, isReady } = useDashboardUserRole()
  const id = String(params.id ?? "")

  const [name, setName] = useState("")
  const [position, setPosition] = useState<ContentPlacementPosition | null>(null)
  const [description, setDescription] = useState("")

  const { data: placement, isLoading, isError } = useQuery({
    queryKey: contentPlacementQueryKey(id),
    queryFn: () => fetchContentPlacementById(id),
    enabled: isReady && role === UserRole.ADMIN && Boolean(id),
  })

  useEffect(() => {
    if (!placement) return
    setName(placement.name)
    setPosition(placement.position)
    setDescription(placement.description ?? "")
  }, [placement])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateContentPlacement(id, {
        name: name.trim(),
        position: position ?? undefined,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentPlacementsQueryKey })
      queryClient.invalidateQueries({ queryKey: contentPlacementQueryKey(id) })
      toast.success("Content placement saved")
      router.push("/content-placements")
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      toast.error(error.response?.data?.message ?? "Could not save placement")
    },
  })

  const canSave = Boolean(name.trim() && position)

  if (!isReady) return <LoadingSkeleton variant="default" />
  if (role !== UserRole.ADMIN) {
    return <p className="text-muted-foreground text-sm">Admin access only.</p>
  }

  if (isLoading) return <LoadingSkeleton variant="default" />
  if (isError || !placement) {
    return (
      <div className="space-y-4">
        <p className="text-destructive text-sm">Content placement not found.</p>
        <Button variant="outline" asChild>
          <Link href="/content-placements">Back to list</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6 pb-24">
      <PageHeader
        breadcrumbs={
          <Button variant="link" size="sm" className="h-auto p-0" asChild>
            <Link href="/content-placements" className="inline-flex items-center gap-1">
              <ArrowLeft className="size-3.5" />
              Content placements
            </Link>
          </Button>
        }
        title="Configure placement"
        description="Set the on-site position for this placement. Brands will see the same preview when selecting it in campaign briefs."
        actions={
          <div className="hidden gap-2 sm:flex">
            <Button variant="outline" asChild>
              <Link href="/content-placements">Cancel</Link>
            </Button>
            <Button
              disabled={!canSave || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Save placement
            </Button>
          </div>
        }
      />

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Placement details</CardTitle>
          <CardDescription>
            Internal name and optional notes for your team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="grid gap-2">
              <Label htmlFor="cfg-name">Name</Label>
              <Input
                id="cfg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Homepage hero slot"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cfg-desc">Description (optional)</Label>
              <Textarea
                id="cfg-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes for brands or ops team…"
                className="min-h-[2.5rem] resize-y"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">On-site position</CardTitle>
          <CardDescription>
            Pick where branded content should render. The live preview updates as you
            select each option.
            {position ? (
              <>
                {" "}
                Current:{" "}
                <span className="text-foreground font-medium">
                  {getPlacementLabel(position)}
                </span>
              </>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlacementPicker
            value={position}
            onChange={setPosition}
            disabled={saveMutation.isPending}
          />
        </CardContent>
      </Card>

      {/* Sticky save bar on mobile / when scrolling */}
      <div className="bg-background/95 supports-backdrop-filter:bg-background/80 fixed inset-x-0 bottom-0 z-20 border-t px-4 py-3 backdrop-blur sm:px-6 lg:left-[var(--sidebar-width)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground hidden text-sm sm:block">
            {position
              ? `Selected: ${getPlacementLabel(position)}`
              : "Select a position to continue"}
          </p>
          <div className="ml-auto flex w-full flex-wrap justify-end gap-2 sm:w-auto">
            <Button variant="outline" asChild className="flex-1 sm:flex-none">
              <Link href="/content-placements">Cancel</Link>
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              disabled={!canSave || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Save placement
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
