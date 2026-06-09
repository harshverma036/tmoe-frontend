import apiConfig from "@/lib/apiConfig"

export type DeliverableStatus = "PENDING" | "SUBMITTED" | "DELIVERED" | "REJECTED"

export type DeliverableSource =
  | "ADMIN_PLANNED"
  | "MANUAL_SUBMIT"
  | "RSS_SELECTED"

export type RssFeedItem = {
  id: string
  article_url: string
  normalized_url: string
  title: string | null
  excerpt: string | null
  thumbnail_url: string | null
  published_at: string | null
  fetched_at: string
  already_on_campaign: boolean
  publisher_profile?: {
    id: string
    publication_name: string | null
    user?: { name?: string | null; email: string }
  }
}

export type MetadataStatus = "PENDING" | "ENRICHED" | "FAILED"

export type ContentDeliverable = {
  id: string
  campaign_id: string
  publisher_profile_id: string | null
  type: string
  description: string | null
  status: DeliverableStatus
  source?: DeliverableSource
  metadata_status?: MetadataStatus
  submitted_url: string | null
  submitted_at: string | null
  admin_note: string | null
  article_title: string | null
  article_excerpt: string | null
  thumbnail_url: string | null
  published_at: string | null
  publisher_profile?: {
    id: string
    publication_name: string | null
    user?: { id: string; name?: string | null; email: string }
  }
  created_at?: string | null
  updated_at?: string | null
}

export type DeliverablesSummary = {
  total: number
  delivered: number
  content_complete: boolean
}

export const deliverablesQueryKey = (campaignId: string) =>
  ["campaign", campaignId, "deliverables"] as const

export const campaignRssFeedQueryKey = (campaignId: string) =>
  ["campaign", campaignId, "rss-feed"] as const

function normalizeDeliverable(row: Record<string, unknown>): ContentDeliverable {
  return {
    id: String(row.id ?? ""),
    campaign_id: String(row.campaign_id ?? row.campaignId ?? ""),
    publisher_profile_id:
      (row.publisher_profile_id ?? row.publisherProfileId) as string | null,
    type: String(row.type ?? ""),
    description: (row.description as string) ?? null,
    status: String(row.status ?? "PENDING").toUpperCase() as DeliverableStatus,
    source: (row.source as DeliverableSource) ?? undefined,
    metadata_status: (row.metadata_status ?? row.metadataStatus) as
      | MetadataStatus
      | undefined,
    submitted_url: (row.submitted_url ?? row.submittedUrl) as string | null,
    submitted_at: (row.submitted_at ?? row.submittedAt) as string | null,
    admin_note: (row.admin_note ?? row.adminNote) as string | null,
    article_title: (row.article_title ?? row.articleTitle) as string | null,
    article_excerpt: (row.article_excerpt ?? row.articleExcerpt) as string | null,
    thumbnail_url: (row.thumbnail_url ?? row.thumbnailUrl) as string | null,
    published_at: (row.published_at ?? row.publishedAt) as string | null,
    publisher_profile: row.publisher_profile as ContentDeliverable["publisher_profile"],
    created_at: (row.created_at ?? row.createdAt) as string | null,
    updated_at: (row.updated_at ?? row.updatedAt) as string | null,
  }
}

export async function fetchDeliverables(campaignId: string): Promise<{
  items: ContentDeliverable[]
  summary: DeliverablesSummary
}> {
  const { data } = await apiConfig.get(`/api/campaign/${campaignId}/deliverables`)
  const root = data as Record<string, unknown>
  const payload = (root.data ?? root) as Record<string, unknown>
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : []
  const summaryRaw = (payload.summary ?? root.summary) as Record<string, unknown> | undefined
  return {
    items: rows.map((r) => normalizeDeliverable(r as Record<string, unknown>)),
    summary: {
      total: Number(summaryRaw?.total ?? rows.length),
      delivered: Number(summaryRaw?.delivered ?? 0),
      content_complete: Boolean(summaryRaw?.content_complete ?? summaryRaw?.contentComplete),
    },
  }
}

export async function createDeliverable(
  campaignId: string,
  body: {
    type: string
    description?: string
    publisher_profile_id?: string
  },
): Promise<ContentDeliverable> {
  const { data } = await apiConfig.post(`/api/campaign/${campaignId}/deliverables`, body)
  const root = data as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeDeliverable(row)
}

export async function submitDeliverableUrl(
  campaignId: string,
  deliverableId: string,
  submitted_url: string,
): Promise<ContentDeliverable> {
  const { data } = await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/submit-url`,
    { submitted_url },
  )
  const root = data as Record<string, unknown>
  const row = (root.data ?? root) as Record<string, unknown>
  return normalizeDeliverable(row)
}

export async function approveDeliverable(
  campaignId: string,
  deliverableId: string,
): Promise<void> {
  await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/approve`,
  )
}

export async function rejectDeliverable(
  campaignId: string,
  deliverableId: string,
  note?: string,
): Promise<void> {
  await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/reject`,
    { note },
  )
}

export async function needsRevisionDeliverable(
  campaignId: string,
  deliverableId: string,
  note?: string,
): Promise<void> {
  await apiConfig.patch(
    `/api/campaign/${campaignId}/deliverables/${deliverableId}/needs-revision`,
    { note },
  )
}

export async function submitManualUrls(
  campaignId: string,
  body: { urls: string[]; publisher_profile_id?: string },
): Promise<{ created: ContentDeliverable[]; errors: { url: string; message: string }[] }> {
  const { data } = await apiConfig.post(
    `/api/campaign/${campaignId}/deliverables/manual-urls`,
    body,
  )
  const root = data as Record<string, unknown>
  const payload = (root.data ?? root) as Record<string, unknown>
  const created = Array.isArray(payload.created)
    ? payload.created.map((r) => normalizeDeliverable(r as Record<string, unknown>))
    : []
  const errors = Array.isArray(payload.errors)
    ? (payload.errors as { url: string; message: string }[])
    : []
  return { created, errors }
}

export async function fetchCampaignRssFeed(campaignId: string): Promise<RssFeedItem[]> {
  const { data } = await apiConfig.get(`/api/campaign/${campaignId}/deliverables/rss-feed`)
  const root = data as Record<string, unknown>
  const rows = Array.isArray(root.data) ? root.data : []
  return rows.map((r) => {
    const row = r as Record<string, unknown>
    return {
      id: String(row.id ?? ""),
      article_url: String(row.article_url ?? ""),
      normalized_url: String(row.normalized_url ?? ""),
      title: (row.title as string) ?? null,
      excerpt: (row.excerpt as string) ?? null,
      thumbnail_url: (row.thumbnail_url as string) ?? null,
      published_at: (row.published_at as string) ?? null,
      fetched_at: String(row.fetched_at ?? ""),
      already_on_campaign: Boolean(row.already_on_campaign),
      publisher_profile: row.publisher_profile as RssFeedItem["publisher_profile"],
    }
  })
}

export async function addDeliverablesFromRss(
  campaignId: string,
  rss_feed_cache_ids: string[],
): Promise<number> {
  const { data } = await apiConfig.post(
    `/api/campaign/${campaignId}/deliverables/from-rss`,
    { rss_feed_cache_ids },
  )
  const root = data as Record<string, unknown>
  const created = (root.data as unknown[]) ?? []
  return Array.isArray(created) ? created.length : 0
}

export async function triggerRssSync(): Promise<{
  publishersProcessed: number
  errors: number
}> {
  const { data } = await apiConfig.post("/api/admin/rss-sync/trigger")
  const root = data as Record<string, unknown>
  const payload = (root.data ?? root) as Record<string, unknown>
  return {
    publishersProcessed: Number(payload.publishersProcessed ?? 0),
    errors: Number(payload.errors ?? 0),
  }
}
