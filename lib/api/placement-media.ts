import apiConfig from "@/lib/apiConfig"

export type PlacementMediaItem = {
  id: string
  campaign_id: string
  url: string
  storage_key: string
  file_name: string | null
  content_type: string | null
  file_size: number | null
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

export async function uploadPlacementMedia(
  campaignId: string,
  files: File[],
): Promise<PlacementMediaItem[]> {
  const form = new FormData()
  for (const file of files) {
    form.append("files", file)
  }
  const { data } = await apiConfig.post(
    `/api/campaign/${campaignId}/placement-media`,
    form,
  )
  const rows = Array.isArray(data?.data) ? data.data : []
  return rows.map((row: Record<string, unknown>) => normalizeMedia(row))
}

export async function deletePlacementMedia(
  campaignId: string,
  mediaId: string,
): Promise<void> {
  await apiConfig.delete(
    `/api/campaign/${campaignId}/placement-media/${mediaId}`,
  )
}
