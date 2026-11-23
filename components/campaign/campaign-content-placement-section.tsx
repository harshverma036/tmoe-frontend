"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { format, parseISO } from "date-fns"
import { ImagePlus, Loader2, Maximize2, Play, Trash2, Upload } from "lucide-react"
import toast from "react-hot-toast"

import { PlacementVisualizer } from "@/components/content-placement/placement-visualizer"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { MediaLightbox } from "@/components/common/media-lightbox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deletePlacementMedia,
  fetchAllPlacementMedia,
  IMAGE_ACCEPT,
  isVideoMedia,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  PLACEMENT_CHANNELS,
  placementMediaQueryKey,
  uploadPlacementMedia,
  VIDEO_ACCEPT,
  type PlacementChannel,
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
  const [pendingDelete, setPendingDelete] = useState<PlacementMediaItem | null>(
    null,
  )
  const currentUserId = getUserIdFromCookie()
  const canUpload =
    role === UserRole.ADMIN || role === UserRole.PUBLISHER

  const mediaQuery = useQuery({
    queryKey: placementMediaQueryKey(campaignId),
    queryFn: () => fetchAllPlacementMedia(campaignId),
    enabled: Boolean(campaignId),
  })

  // Files sent so far of the upload in flight, for the button's "Uploading 12/40".
  const [uploadProgress, setUploadProgress] = useState<{
    done: number
    total: number
  } | null>(null)

  const uploadMutation = useMutation({
    mutationFn: ({ files, channel }: { files: File[]; channel: PlacementChannel }) => {
      setUploadProgress({ done: 0, total: files.length })
      return uploadPlacementMedia(campaignId, files, channel, (done, total) =>
        setUploadProgress({ done, total }),
      )
    },
    onSuccess: (uploaded) => {
      toast.success(
        uploaded.length === 1 ? "1 file uploaded" : `${uploaded.length} files uploaded`,
      )
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to upload files"))
    },
    // Earlier batches of a failed upload are saved, so refresh either way.
    onSettled: () => {
      setUploadProgress(null)
      void queryClient.invalidateQueries({
        queryKey: placementMediaQueryKey(campaignId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (mediaId: string) =>
      deletePlacementMedia(campaignId, mediaId),
    onSuccess: () => {
      toast.success("Screenshot removed")
      setPendingDelete(null)
      void queryClient.invalidateQueries({
        queryKey: placementMediaQueryKey(campaignId),
      })
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to remove screenshot"))
    },
  })

  const items = mediaQuery.data?.data ?? []
  const untagged = items.filter((item) => item.channel === null)

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
              campaign brief. You can still upload placement screenshots below.
            </p>
          </CardHeader>
        </Card>
      )}

      <section className="space-y-4" aria-label="Placement screenshots">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Placement screenshots</h3>
          <p className="text-muted-foreground text-sm">
            {canUpload
              ? "Upload as many screenshots as you need showing where this campaign’s content appeared, under each placement. The news feed also takes videos. Click any image to see it full size."
              : "Screenshots showing where this campaign’s content appeared. Click any image to see it full size."}
          </p>
        </div>

        {mediaQuery.isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading screenshots…
          </div>
        ) : mediaQuery.isError ? (
          <p className="text-destructive text-sm">
            {errorMessage(mediaQuery.error, "Failed to load placement screenshots")}
          </p>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {PLACEMENT_CHANNELS.map((channel) => (
              <PlacementChannelCard
                key={channel.value}
                title={channel.label}
                description={channel.description}
                acceptsVideo={channel.acceptsVideo === true}
                items={items.filter((item) => item.channel === channel.value)}
                canUpload={canUpload}
                uploadProgress={
                  uploadMutation.isPending &&
                  uploadMutation.variables?.channel === channel.value
                    ? uploadProgress
                    : null
                }
                uploadDisabled={uploadMutation.isPending}
                onUpload={(files) =>
                  uploadMutation.mutate({ files, channel: channel.value })
                }
                canDelete={canDelete}
                onRemove={setPendingDelete}
              />
            ))}
            {untagged.length > 0 ? (
              <PlacementChannelCard
                title="Other images"
                description="Uploaded before placements were split by channel."
                items={untagged}
                acceptsVideo={false}
                canUpload={false}
                uploadProgress={null}
                uploadDisabled
                onUpload={() => undefined}
                canDelete={canDelete}
                onRemove={setPendingDelete}
              />
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={
          pendingDelete && isVideoMedia(pendingDelete)
            ? "Remove placement video?"
            : "Remove placement screenshot?"
        }
        description="This removes the file from the campaign’s placements. This cannot be undone from the UI."
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

type PlacementChannelCardProps = {
  title: string
  description: string
  /** Takes videos as well as screenshots (the news feed). */
  acceptsVideo: boolean
  items: PlacementMediaItem[]
  canUpload: boolean
  /** This card's upload in flight, files sent so far; null when none. */
  uploadProgress: { done: number; total: number } | null
  /** Any upload is in flight; one at a time keeps the toasts and refreshes simple. */
  uploadDisabled: boolean
  onUpload: (files: File[]) => void
  canDelete: (item: PlacementMediaItem) => boolean
  onRemove: (item: PlacementMediaItem) => void
}

/** One placement channel: its upload button and its screenshots (and videos). */
function PlacementChannelCard({
  title,
  description,
  acceptsVideo,
  items,
  canUpload,
  uploadProgress,
  uploadDisabled,
  onUpload,
  canDelete,
  onRemove,
}: PlacementChannelCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const isUploading = uploadProgress !== null
  const noun = acceptsVideo ? "screenshots or videos" : "screenshots"

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const picked = Array.from(fileList)
    if (inputRef.current) inputRef.current.value = ""

    const isVideo = (f: File) => f.type.toLowerCase().startsWith("video/")
    const supported = picked.filter(
      (f) => f.type.toLowerCase().startsWith("image/") || (acceptsVideo && isVideo(f)),
    )
    const tooLarge = supported.filter(
      (f) => f.size > (isVideo(f) ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024,
    )
    const files = supported.filter((f) => !tooLarge.includes(f))

    if (supported.length < picked.length) {
      toast.error(
        acceptsVideo
          ? "Some files were skipped: only images and MP4, WebM or MOV videos can be added."
          : "Some files were skipped: only images can be added here.",
      )
    }
    if (tooLarge.length > 0) {
      toast.error(
        `${tooLarge.length === 1 ? `"${tooLarge[0].name}" is` : `${tooLarge.length} files are`} too large (images up to ${MAX_IMAGE_MB}MB${acceptsVideo ? `, videos up to ${MAX_VIDEO_MB}MB` : ""}).`,
      )
    }
    if (files.length > 0) onUpload(files)
  }

  const chooseFiles = () => inputRef.current?.click()

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">
            {title}
            <span className="text-muted-foreground ml-2 text-sm font-normal tabular-nums">
              {items.length}
            </span>
          </CardTitle>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {canUpload ? (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept={acceptsVideo ? `${IMAGE_ACCEPT},${VIDEO_ACCEPT}` : IMAGE_ACCEPT}
              multiple
              className="hidden"
              aria-label={`Upload ${title} ${noun}`}
              onChange={(e) => onFilesSelected(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              disabled={uploadDisabled}
              onClick={chooseFiles}
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploadProgress && uploadProgress.total > 1
                ? `Uploading ${uploadProgress.done}/${uploadProgress.total}`
                : isUploading
                  ? "Uploading…"
                  : items.length > 0
                    ? "Add more"
                    : "Upload"}
            </Button>
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="border-muted-foreground/25 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
            <ImagePlus className="text-muted-foreground size-7" />
            <p className="text-muted-foreground text-sm">
              {canUpload
                ? `No ${title} ${noun} yet. You can add as many as you need.`
                : `No ${title} ${noun} have been uploaded.`}
            </p>
            {canUpload ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1"
                disabled={uploadDisabled}
                onClick={chooseFiles}
              >
                <Upload className="size-4" />
                {acceptsVideo ? "Choose images or videos" : "Choose images"}
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "bg-muted/30 group relative overflow-hidden rounded-lg border",
                )}
              >
                <button
                  type="button"
                  onClick={() => setViewing(index)}
                  className="relative block aspect-4/3 w-full cursor-zoom-in overflow-hidden bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`View ${item.file_name || `${title} file`} full size`}
                >
                  {isVideoMedia(item) ? (
                    <>
                      <video
                        src={`${item.url}#t=0.1`}
                        muted
                        playsInline
                        preload="metadata"
                        className="pointer-events-none size-full bg-black object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white">
                          <Play className="size-5 translate-x-px fill-current" />
                        </span>
                      </span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.file_name || `${title} screenshot`}
                      className="size-full object-cover object-top transition group-hover:scale-[1.02]"
                    />
                  )}
                  <span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-black/55 text-white opacity-0 transition group-hover:opacity-100">
                    <Maximize2 className="size-3.5" />
                  </span>
                </button>
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
                      onClick={() => onRemove(item)}
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
        <MediaLightbox
          items={items.map((item) => ({
            id: item.id,
            url: item.url,
            title: item.file_name || `${title} ${isVideoMedia(item) ? "video" : "screenshot"}`,
            caption: [
              title,
              item.uploaded_by?.name || item.uploaded_by?.email,
              fmtDate(item.created_at),
            ]
              .filter(Boolean)
              .join(" · "),
            isVideo: isVideoMedia(item),
          }))}
          index={viewing}
          onIndexChange={setViewing}
        />
      </CardContent>
    </Card>
  )
}
