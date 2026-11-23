import apiConfig from "@/lib/apiConfig"

/** Where the content was placed; each has its own screenshots on the Content placement tab. */
export type PlacementChannel =
  | "GOOGLE"
  | "AEO"
  | "PUSH_NOTIFICATION"
  | "IN_APP"
  | "RIGHT_SIDE_WIDGET"
  | "NEWS_FEED"
  | "ARTICLE_HYPERLINK"

export const PLACEMENT_CHANNELS: {
  value: PlacementChannel
  label: string
  description: string
  /** Takes videos as well as screenshots. */
  acceptsVideo?: boolean
}[] = [
  {
    value: "GOOGLE",
    label: "Google",
    description: "Articles showing in Google Search, Discover or News.",
  },
  {
    value: "AEO",
    label: "AEO",
    description: "Articles cited in AI answers (ChatGPT, Perplexity, Gemini, AI Overviews).",
  },
  {
    value: "PUSH_NOTIFICATION",
    label: "Push notification",
    description: "Publisher push notifications promoting the articles.",
  },
  {
    value: "IN_APP",
    label: "In app",
    description: "Placements inside publisher apps.",
  },
  {
    value: "RIGHT_SIDE_WIDGET",
    label: "Right side widget",
    description: "Articles promoted in the right-hand sidebar widget on publisher pages.",
  },
  {
    value: "NEWS_FEED",
    label: "News feed",
    description: "Articles in the publisher's news feed. Screenshots or videos.",
    acceptsVideo: true,
  },
  {
    value: "ARTICLE_HYPERLINK",
    label: "Article hyperlink",
    description: "Links to the articles placed inside other articles.",
  },
]

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
export const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime"
export const MAX_IMAGE_MB = 10
export const MAX_VIDEO_MB = 100

export type PlacementMediaItem = {
  id: string
  campaign_id: string
  url: string
  storage_key: string
  file_name: string | null
  content_type: string | null
  file_size: number | null
  /** null for images uploaded before channels existed. */
  channel: PlacementChannel | null
  uploaded_by_id: string
  uploaded_by?: {
    id: string
    name: string | null
    email: string
    role: string
  }
  created_at: string | null
}

export type PlacementMediaListResult = {
  data: PlacementMediaItem[]
  total: number
  page: number
  pageSize: number
}

export const placementMediaQueryKey = (campaignId: string) =>
  ["campaign", campaignId, "placement-media"] as const

const CHANNEL_VALUES = new Set<string>(PLACEMENT_CHANNELS.map((c) => c.value))

function normalizeMedia(row: Record<string, unknown>): PlacementMediaItem {
  const uploadedBy = (row.uploaded_by ?? row.uploadedBy) as
    | Record<string, unknown>
    | undefined

  return {
    id: String(row.id ?? ""),
    campaign_id: String(row.campaign_id ?? row.campaignId ?? ""),
    url: String(row.url ?? ""),
    storage_key: String(row.storage_key ?? row.storageKey ?? ""),
    file_name: (row.file_name ?? row.fileName ?? null) as string | null,
    content_type: (row.content_type ?? row.contentType ?? null) as string | null,
    file_size: (row.file_size ?? row.fileSize ?? null) as number | null,
    channel: CHANNEL_VALUES.has(String(row.channel))
      ? (row.channel as PlacementChannel)
      : null,
    uploaded_by_id: String(row.uploaded_by_id ?? row.uploadedById ?? ""),
    uploaded_by: uploadedBy
      ? {
          id: String(uploadedBy.id ?? ""),
          name: (uploadedBy.name as string | null) ?? null,
          email: String(uploadedBy.email ?? ""),
          role: String(uploadedBy.role ?? ""),
        }
      : undefined,
    created_at: (row.createdAt ?? row.created_at ?? null) as string | null,
  }
}

/** Whether an uploaded file is a video (news feed placements can be). */
export function isVideoMedia(item: Pick<PlacementMediaItem, "content_type" | "url">) {
  if (item.content_type) return item.content_type.toLowerCase().startsWith("video/")
  return /\.(mp4|webm|mov)(\?|$)/i.test(item.url)
}

export async function fetchPlacementMedia(
  campaignId: string,
  params?: { limit?: number; skip?: number },
): Promise<PlacementMediaListResult> {
  const { data } = await apiConfig.get(
    `/api/campaign/${campaignId}/placement-media`,
    {
      params: {
        limit: String(params?.limit ?? 50),
        skip: String(params?.skip ?? 0),
      },
    },
  )
  const rows = Array.isArray(data?.data) ? data.data : []
  return {
    data: rows.map((row: Record<string, unknown>) => normalizeMedia(row)),
    total: Number(data?.total ?? rows.length),
    page: Number(data?.page ?? 1),
    pageSize: Number(data?.pageSize ?? params?.limit ?? 50),
  }
}

/** Every file of a campaign's placements, read a page at a time so none are left out. */
export async function fetchAllPlacementMedia(
  campaignId: string,
): Promise<PlacementMediaListResult> {
  const pageSize = 100
  const first = await fetchPlacementMedia(campaignId, { limit: pageSize, skip: 0 })
  const data = [...first.data]
  while (data.length < first.total) {
    const next = await fetchPlacementMedia(campaignId, {
      limit: pageSize,
      skip: data.length,
    })
    if (next.data.length === 0) break
    const seen = new Set(data.map((item) => item.id))
    data.push(...next.data.filter((item) => !seen.has(item.id)))
  }
  return { ...first, data, total: Math.max(first.total, data.length), pageSize: data.length }
}

/** Images per request; a video goes on its own, as it can be up to 100MB. */
const IMAGES_PER_REQUEST = 10

/**
 * Uploads any number of files: the API takes up to 20 per request, so they are sent in batches,
 * one after another. `onProgress` is told how many are done after each batch.
 */
export async function uploadPlacementMedia(
  campaignId: string,
  files: File[],
  channel?: PlacementChannel,
  onProgress?: (done: number, total: number) => void,
): Promise<PlacementMediaItem[]> {
  const batches: File[][] = []
  let images: File[] = []
  for (const file of files) {
    if (file.type.toLowerCase().startsWith("video/")) {
      batches.push([file])
      continue
    }
    images.push(file)
    if (images.length === IMAGES_PER_REQUEST) {
      batches.push(images)
      images = []
    }
  }
  if (images.length > 0) batches.push(images)

  const uploaded: PlacementMediaItem[] = []
  let done = 0
  for (const batch of batches) {
    const form = new FormData()
    if (channel) form.append("channel", channel)
    for (const file of batch) form.append("files", file)
    const { data } = await apiConfig.post(
      `/api/campaign/${campaignId}/placement-media`,
      form,
    )
    const rows = Array.isArray(data?.data) ? data.data : []
    uploaded.push(...rows.map((row: Record<string, unknown>) => normalizeMedia(row)))
    done += batch.length
    onProgress?.(done, files.length)
  }
  return uploaded
}

export async function deletePlacementMedia(
  campaignId: string,
  mediaId: string,
): Promise<void> {
  await apiConfig.delete(
    `/api/campaign/${campaignId}/placement-media/${mediaId}`,
  )
}
