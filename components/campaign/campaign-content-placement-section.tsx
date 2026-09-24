"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format, parseISO } from "date-fns"
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import toast from "react-hot-toast"

import { PlacementVisualizer } from "@/components/content-placement/placement-visualizer"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deletePlacementMedia,
  fetchPlacementMedia,
  placementMediaQueryKey,
  uploadPlacementMedia,
  type PlacementMediaItem,
} from "@/lib/api/placement-media"
import {
  getPlacementLabel,
  type ContentPlacement,
} from "@/lib/content-placement.types"
import { UserRole } from "@/lib/dashboard-nav"
import { getUserIdFromCookie } from "@/lib/user-info-cookie"
import { cn } from "@/lib/utils"

type CampaignContentPlacementSectionProps = {
  campaignId: string
  placement: ContentPlacement | null | undefined
  role: UserRole
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null
  try {
    return format(parseISO(iso), "PPp")
  } catch {
    return iso
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const msg = error.response?.data?.message
    if (typeof msg === "string" && msg.trim()) return msg
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export function CampaignContentPlacementSection({
  campaignId,
  placement,
  role,
}: CampaignContentPlacementSectionProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<PlacementMediaItem | null>(
    null,
  )
  const currentUserId = getUserIdFromCookie()
  const canUpload =
    role === UserRole.ADMIN || role === UserRole.PUBLISHER

  const mediaQuery = useQuery({
    queryKey: placementMediaQueryKey(campaignId),
    queryFn: () => fetchPlacementMedia(campaignId, { limit: 50, skip: 0 }),
    enabled: Boolean(campaignId),
  })

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadPlacementMedia(campaignId, files),
    onSuccess: (uploaded) => {
      toast.success(
        uploaded.length === 1
          ? "Image uploaded"
          : `${uploaded.length} images uploaded`,
      )
      void queryClient.invalidateQueries({
        queryKey: placementMediaQueryKey(campaignId),
      })
      if (inputRef.current) inputRef.current.value = ""
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to upload images"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) =>
      deletePlacementMedia(campaignId, mediaId),
    onSuccess: () => {
      toast.success("Image removed")
      setPendingDelete(null)
      void queryClient.invalidateQueries({
        queryKey: placementMediaQueryKey(campaignId),
      })
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to remove image"))
    },
  })

  const items = mediaQuery.data?.data ?? []

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const files = Array.from(fileList).filter((f) =>
      f.type.toLowerCase().startsWith("image/"),
    )
    if (files.length === 0) {
      toast.error("Please select image files only")
      return
    }
    uploadMutation.mutate(files)
  }

  function canDelete(item: PlacementMediaItem) {
    if (role === UserRole.ADMIN) return true
    if (role === UserRole.PUBLISHER) {
      return item.uploaded_by_id === currentUserId
    }
    return false
  }

  return (
    <div className="space-y-6">
      {placement ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{placement.name}</CardTitle>
              <p className="text-muted-foreground text-sm">
                {getPlacementLabel(placement.position)}
              </p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {placement.description ? (
                <p className="text-muted-foreground">{placement.description}</p>
              ) : (
                <p className="text-muted-foreground">
                  Branded content for this campaign is intended for the{" "}
                  <span className="text-foreground font-medium">
                    {getPlacementLabel(placement.position).toLowerCase()}
                  </span>{" "}
                  zone on publisher sites.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Placement preview
            </p>
            <PlacementVisualizer position={placement.position} emphasized />
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">
              No content placement selected
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              The brand did not choose a content placement when creating this
              campaign brief. You can still upload placement images below.
            </p>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Placement images</CardTitle>
            <p className="text-muted-foreground text-sm">
              {canUpload
                ? "Upload one or more images for this content placement. Files are stored securely and listed only on this tab."
                : "Images uploaded for this campaign’s content placement."}
            </p>
          </div>
          {canUpload ? (
            <div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                multiple
                className="hidden"
                onChange={(e) => onFilesSelected(e.target.files)}
              />
              <Button
                type="button"
                size="sm"
                disabled={uploadMutation.isPending}
                onClick={() => inputRef.current?.click()}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload images
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          {mediaQuery.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Loading images…
            </div>
          ) : mediaQuery.isError ? (
            <p className="text-destructive text-sm">
              {errorMessage(mediaQuery.error, "Failed to load placement images")}
            </p>
          ) : items.length === 0 ? (
            <div className="border-muted-foreground/25 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
              <ImagePlus className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No placement images yet</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                {canUpload
                  ? "Upload creative assets that belong in this placement zone."
                  : "No images have been uploaded for this placement."}
              </p>
              {canUpload ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={uploadMutation.isPending}
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  Choose images
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "bg-muted/30 group relative overflow-hidden rounded-lg border",
                  )}
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block aspect-4/3 overflow-hidden bg-black/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.file_name || "Placement image"}
                      className="size-full object-cover transition group-hover:scale-[1.02]"
                    />
                  </a>
                  <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">
                      {item.file_name || "Untitled image"}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {item.uploaded_by?.name ||
                        item.uploaded_by?.email ||
                        "Unknown uploader"}
                      {fmtDate(item.created_at)
                        ? ` · ${fmtDate(item.created_at)}`
                        : ""}
                    </p>
                    {canDelete(item) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive -ml-2 h-8 px-2"
                        onClick={() => setPendingDelete(item)}
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Remove placement image?"
        description="This removes the image from the campaign placement list. This cannot be undone from the UI."
        confirmLabel="Remove"
        confirmVariant="destructive"
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id)
        }}
      />
    </div>
  )
}
